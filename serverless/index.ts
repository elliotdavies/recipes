/**
 * Express types:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express/index.d.ts
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts
 */
const serverless = require("serverless-http");

import { Request, Response } from "express";
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");

const { v4: uuid } = require("uuid");
const crypto = require("crypto-js");

const aws = require("aws-sdk");
const s3 = new aws.S3();
const dynamo = new aws.DynamoDB({
  region: "eu-west-2",
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
    const { Items: items } = await dynamo
      .query({
        TableName: "recipes",
        IndexName: "RecipesByUser",
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: {
          ":u": { S: userId },
        },
      })
      .promise();

    // TODO fix @ts-ignore
    return res.json(
      // @ts-ignore
      items.map((item) => ({
        id: item.id.S,
        url: item.url.S,
        title: item.title.S,
        notes: item.notes.S,
        images: item.images ? item.images.SS : [],
      }))
    );
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
      await dynamo
        .putItem({
          TableName: "recipes",
          Item: {
            id: { S: id },
            url: { S: url },
            title: { S: title },
            notes: { S: notes },
            images: images.length ? { SS: images } : undefined,
            user_id: { S: userId },
          },
        })
        .promise();

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
      const {
        Item: {
          user_id: { S: recipeUserId },
        },
      } = await dynamo
        .getItem({
          TableName: "recipes",
          Key: { id: { S: id } },
          ProjectionExpression: "user_id",
        })
        .promise();

      if (recipeUserId !== userId) {
        return res.status(403).json({
          msg: "Not authorized to edit this recipe",
        });
      }

      // TODO Use an update operation rather than overwriting every time
      await dynamo
        .putItem({
          TableName: "recipes",
          Item: {
            id: { S: id },
            url: { S: url },
            title: { S: title },
            notes: { S: notes },
            images: images.length ? { SS: images } : undefined,
            user_id: { S: userId },
          },
        })
        .promise();

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
  id: number;
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
      const {
        Item: {
          user_id: { S: recipeUserId },
        },
      } = await dynamo
        .getItem({
          TableName: "recipes",
          Key: { id: { S: id } },
          ProjectionExpression: "user_id",
        })
        .promise();

      if (recipeUserId !== userId) {
        return res.status(403).json({
          msg: "Not authorized to delete this recipe",
        });
      }

      await dynamo
        .deleteItem({
          TableName: "recipes",
          Key: { id: { S: id } },
        })
        .promise();

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

    const params = {
      Bucket: "recipes.elliotdavies.co.uk",
      Key: `images/${filename}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    try {
      await s3.upload(params).promise();
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

  let userId = null;
  try {
    const {
      Item: {
        user_id: { S: userIdForSession },
      },
    } = await dynamo
      .getItem({
        TableName: "recipes_sessions",
        Key: { session_id: { S: sessionId } },
        ProjectionExpression: "user_id",
      })
      .promise();

    userId = userIdForSession;
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
      const { Item } = await dynamo
        .getItem({
          TableName: "recipes_users_basic",
          Key: {
            email: { S: email },
          },
        })
        .promise();

      if (Item) {
        return res.status(400).json({
          msg: "An account already exists for this email",
        });
      }
    } catch (error) {
      console.error(error);
      // TODO ensure errors are included in responses properly
      return res.status(500).json({
        msg: "Failed to check whether email was associated with existing user",
        error,
      });
    }

    const userId = uuid();
    try {
      await dynamo
        .putItem({
          TableName: "recipes_users",
          Item: {
            id: { S: userId },
            name: { S: name },
          },
        })
        .promise();

      await dynamo
        .putItem({
          TableName: "recipes_users_basic",
          Item: {
            user_id: { S: userId },
            email: { S: email },
            password: { S: encodePassword(password) },
          },
        })
        .promise();
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to create user",
        error,
      });
    }

    try {
      const sessionId = uuid();

      await dynamo
        .putItem({
          TableName: "recipes_sessions",
          Item: {
            user_id: { S: userId },
            session_id: { S: sessionId },
          },
        })
        .promise();

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
      const { Item } = await dynamo
        .getItem({
          TableName: "recipes_users_basic",
          Key: { email: { S: email } },
        })
        .promise();

      userRes = Item;
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to query users",
        error,
      });
    }

    if (!userRes || userRes.password.S !== encodePassword(password)) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const userId = userRes.user_id.S;
    try {
      const {
        Item: {
          name: { S: name },
        },
      } = await dynamo
        .getItem({
          TableName: "recipes_users",
          Key: { id: { S: userId } },
        })
        .promise();

      const sessionId = uuid();

      await dynamo
        .putItem({
          TableName: "recipes_sessions",
          Item: {
            user_id: { S: userId },
            session_id: { S: sessionId },
          },
        })
        .promise();

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
    await dynamo
      .deleteItem({
        TableName: "recipes_sessions",
        Key: { session_id: { S: sessionId } },
      })
      .promise();

    return res.sendStatus(200);
  } catch (error) {
    return res.status(500).json({
      msg: "Failed to delete session",
      error,
    });
  }
});

module.exports.handler = serverless(app);
