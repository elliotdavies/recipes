/**
 * Express types:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express/index.d.ts
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts
 */
import serverless from "serverless-http";

import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";

import { v4 as uuid } from "uuid";
import crypto from "crypto-js";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, QueryCommand as RawQueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const s3Client = new S3Client({ region: "eu-west-2" });
const ddbClient = new DynamoDBClient({ region: "eu-west-2" });
const dynamo = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(bodyParser.json()); // parse application/json

const isVoid = (x: any): boolean => x === null || typeof x === "undefined";

interface ApiError {
  msg: string;
  error?: Error;
}

type RequestWithBody<T> = Request<any, any, T>;
type ResponseWithErr<T> = Response<T | ApiError>;

/**
 * Recipes
 */

interface Recipe {
  id: string;
  url: string;
  title: string;
  notes: string;
  images: string[];
}

interface DynamoRecipe {
  id: string;
  url: string;
  title: string;
  notes: string;
  images?: string[];
  user_id: string;
}

app.get("/", async (req: Request, res: ResponseWithErr<Recipe[]>) => {
  const sessionId = extractSessionId(req);
  let userId;
  try {
    userId = await getUserIdFromValidSession(sessionId);
  } catch (error) {
    return res.status(403).json({
      msg: "Invalid session",
      error,
    });
  }

  try {
    /**
     * TODO This query is limited to 1MB of data at a time. We need to check for
     * a `LastEvaluatedKey` and handle pagination if it's present, either here
     * or in the frontend.
     *
     * See https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html
     */
    // Use raw DynamoDB client to handle both SDK v2 (String Set) and SDK v3 (List) formats
    const dynamoRes = await ddbClient.send(
      new RawQueryCommand({
        TableName: "recipes",
        IndexName: "RecipesByUser",
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: {
          ":u": { S: userId },
        },
      })
    );

    const items = (dynamoRes.Items || []).map(rawItem => {
      const item = unmarshall(rawItem);
      // Handle both SDK v3 array format and legacy SDK v2 String Set format
      // SDK v2 stores as { SS: ["file1.jpg"] }, SDK v3 stores as ["file1.jpg"]
      let images: string[] = [];
      if (rawItem.images) {
        if (rawItem.images.SS) {
          // Legacy SDK v2 String Set format
          images = rawItem.images.SS;
        } else if (rawItem.images.L) {
          // SDK v3 List format
          images = rawItem.images.L.map((i: any) => i.S);
        }
      }

      return {
        id: item.id,
        url: item.url,
        title: item.title,
        notes: item.notes,
        images,
      };
    });

    return res.json(items);
  } catch (error) {
    return res.status(500).json({
      msg: "Error querying DB",
      error,
    });
  }
});

type CreateRecipeBody = Omit<Recipe, "id">;

app.post(
  "/",
  async (
    req: RequestWithBody<CreateRecipeBody>,
    res: ResponseWithErr<Recipe>
  ) => {
    const sessionId = extractSessionId(req);
    let userId;
    try {
      userId = await getUserIdFromValidSession(sessionId);
    } catch (error) {
      return res.status(403).json({
        msg: "Invalid session",
        error,
      });
    }

    const { url, title, notes, images } = req.body;
    if (isVoid(url) || isVoid(title) || isVoid(notes) || isVoid(images)) {
      return res.status(400).json({
        msg: "Missing data needed to create recipe",
      });
    }

    const id = uuid();

    try {
      await dynamo.send(
        new PutCommand({
          TableName: "recipes",
          Item: {
            id,
            url,
            title,
            notes,
            ...(images.length ? { images } : {}),
            user_id: userId,
          },
        })
      );

      res.status(201).json({ id, url, title, notes, images });
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to create recipe",
        error,
      });
    }
  }
);

app.put(
  "/",
  async (req: RequestWithBody<Recipe>, res: ResponseWithErr<void>) => {
    const sessionId = extractSessionId(req);
    let userId;
    try {
      userId = await getUserIdFromValidSession(sessionId);
    } catch (error) {
      return res.status(403).json({
        msg: "Invalid session",
        error,
      });
    }

    const { id, url, title, notes, images } = req.body;
    if (
      isVoid(id) ||
      isVoid(url) ||
      isVoid(title) ||
      isVoid(notes) ||
      isVoid(images)
    ) {
      return res.status(400).json({
        msg: "Missing data needed to update recipe",
      });
    }

    try {
      const { Item } = await dynamo.send(
        new GetCommand({
          TableName: "recipes",
          Key: { id },
          ProjectionExpression: "user_id",
        })
      );

      if (!Item || Item.user_id !== userId) {
        return res.status(403).json({
          msg: "Not authorized to edit this recipe",
        });
      }

      // TODO Use an update operation rather than overwriting every time
      await dynamo.send(
        new PutCommand({
          TableName: "recipes",
          Item: {
            id,
            url,
            title,
            notes,
            ...(images.length ? { images } : {}),
            user_id: userId,
          },
        })
      );

      return res.sendStatus(204);
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to update recipe",
        error,
      });
    }
  }
);

interface DeleteRecipeBody {
  id: string;
}

app.delete(
  "/",
  async (
    req: RequestWithBody<DeleteRecipeBody>,
    res: ResponseWithErr<void>
  ) => {
    const sessionId = extractSessionId(req);
    let userId;
    try {
      userId = await getUserIdFromValidSession(sessionId);
    } catch (error) {
      return res.status(403).json({
        msg: "Invalid session",
        error,
      });
    }

    const { id } = req.body;
    if (isVoid(id)) {
      return res.status(400).json({
        msg: "Missing recipe ID",
      });
    }

    try {
      const { Item } = await dynamo.send(
        new GetCommand({
          TableName: "recipes",
          Key: { id },
          ProjectionExpression: "user_id",
        })
      );

      if (!Item || Item.user_id !== userId) {
        return res.status(403).json({
          msg: "Not authorized to delete this recipe",
        });
      }

      await dynamo.send(
        new DeleteCommand({
          TableName: "recipes",
          Key: { id },
        })
      );

      return res.sendStatus(204);
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to delete recipe",
        error,
      });
    }
  }
);

interface ImageUploadResponse {
  filename: string;
}

app.post(
  "/image",
  multer().single("image"),
  async (req: Request, res: ResponseWithErr<ImageUploadResponse>) => {
    const sessionId = extractSessionId(req);
    try {
      await getUserIdFromValidSession(sessionId);
    } catch (error) {
      return res.status(403).json({
        msg: "Invalid session",
        error,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        msg: "No image file found in request",
      });
    }

    const { originalname } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    const filename = `${uuid()}.${ext}`;

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: "recipes.elliotdavies.co.uk",
          Key: `images/${filename}`,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
      );
      return res.json({ filename });
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to store image",
        error,
      });
    }
  }
);

/**
 * Users and sessions
 */

const extractSessionId = (req: Request): string | null => {
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }

  return null;
};

const getUserIdFromValidSession = async (
  sessionId: string | null
): Promise<string> => {
  if (!sessionId) {
    throw new Error("Null sessionId");
  }

  let userId: string | undefined;
  try {
    const { Item } = await dynamo.send(
      new GetCommand({
        TableName: "recipes_sessions",
        Key: { session_id: sessionId },
        ProjectionExpression: "user_id",
      })
    );

    if (Item) {
      userId = Item.user_id;
    }
  } catch (error) {
    throw new Error("Failed to query for session");
  }

  if (!userId) {
    throw new Error("Invalid session");
  }

  return userId;
};

const encodePassword = (s: string): string => {
  return crypto.SHA256(s).toString();
};

interface SignUpBody {
  name: string;
  email: string;
  password: string;
}

interface SignUpResponse {
  sessionId: string;
  name: string;
}

app.post(
  "/sign-up",
  async (
    req: RequestWithBody<SignUpBody>,
    res: ResponseWithErr<SignUpResponse>
  ) => {
    const { name, email, password } = req.body;
    if (isVoid(name) || isVoid(email) || isVoid(password)) {
      return res.status(400).json({
        msg: "Missing data in sign=up request",
      });
    }

    // Check if there's already an account for this email
    try {
      const { Item } = await dynamo.send(
        new GetCommand({
          TableName: "recipes_users_basic",
          Key: { email },
        })
      );

      if (Item) {
        return res.status(400).json({
          msg: "An account already exists for this email",
        });
      }
    } catch (error) {
      console.error(error);
      // TODO Ensure errors are included in responses properly. This currently
      // seems to come through in the frontend as `{}`
      return res.status(500).json({
        msg: "Failed to check whether email was associated with existing user",
        error,
      });
    }

    const userId = uuid();
    try {
      await dynamo.send(
        new PutCommand({
          TableName: "recipes_users",
          Item: {
            id: userId,
            name,
          },
        })
      );

      await dynamo.send(
        new PutCommand({
          TableName: "recipes_users_basic",
          Item: {
            user_id: userId,
            email,
            password: encodePassword(password),
          },
        })
      );
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to create user",
        error,
      });
    }

    try {
      const sessionId = uuid();

      await dynamo.send(
        new PutCommand({
          TableName: "recipes_sessions",
          Item: {
            user_id: userId,
            session_id: sessionId,
          },
        })
      );

      res.status(200).json({ sessionId, name });
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to generate session",
        error,
      });
    }
  }
);

interface SignInBody {
  email: string;
  password: string;
}

interface SignInResponse {
  sessionId: string;
  name: string;
}

app.post(
  "/sign-in",
  async (
    req: RequestWithBody<SignInBody>,
    res: ResponseWithErr<SignInResponse>
  ) => {
    const { email, password } = req.body;
    if (isVoid(email) || isVoid(password)) {
      return res.status(400).json({
        msg: "Missing email or password in login request",
      });
    }

    let userRes;
    try {
      const { Item } = await dynamo.send(
        new GetCommand({
          TableName: "recipes_users_basic",
          Key: { email },
        })
      );

      userRes = Item;
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to query users",
        error,
      });
    }

    if (!userRes || userRes.password !== encodePassword(password)) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const userId = userRes.user_id;
    try {
      const { Item } = await dynamo.send(
        new GetCommand({
          TableName: "recipes_users",
          Key: { id: userId },
        })
      );

      if (!Item) {
        throw new Error("No user found for given ID");
      }

      const name: string = Item.name || "";
      const sessionId = uuid();

      await dynamo.send(
        new PutCommand({
          TableName: "recipes_sessions",
          Item: {
            user_id: userId,
            session_id: sessionId,
          },
        })
      );

      res.status(200).json({ sessionId, name });
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to generate session",
        error,
      });
    }
  }
);

app.post("/sign-out", async (req: Request, res: Response) => {
  const sessionId = extractSessionId(req);
  try {
    await getUserIdFromValidSession(sessionId);
  } catch (error) {
    return res.status(403).json({
      msg: "Invalid session",
      error,
    });
  }

  try {
    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: "recipes_sessions",
        Key: { session_id: sessionId },
      })
    );

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({
      msg: "Failed to delete session",
      error,
    });
  }
});

module.exports.handler = serverless(app);
