/**
 * Express types:
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express/index.d.ts
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts
 */
const serverless = require("serverless-http");

const { Pool } = require("pg");
const pg = new Pool();

import { Request, Response } from "express";
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");

const { v4: uuid } = require("uuid");
const crypto = require("crypto-js");

const aws = require("aws-sdk");
const s3 = new aws.S3();

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
  id: number;
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
    await pg.connect();
  } catch (error) {
    return res.status(500).json({
      msg: "Error connecting to DB",
      error,
    });
  }

  try {
    const queryRes = await pg.query(
      "SELECT * FROM recipes WHERE user_id = $1",
      [userId]
    );
    return res.json(
      queryRes.rows.map((row: Recipe) => ({
        id: row.id,
        url: row.url,
        title: row.title,
        notes: row.notes,
        images: row.images,
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

    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { url, title, notes, images } = req.body;
    if (isVoid(url) || isVoid(title) || isVoid(notes) || isVoid(images)) {
      return res.status(400).json({
        msg: "Missing data needed to create recipe",
      });
    }

    try {
      const queryRes = await pg.query(
        "INSERT INTO recipes (url, title, notes, images, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [url, title, notes, images, userId]
      );

      res
        .status(201)
        .json({ id: queryRes.rows[0].id, url, title, notes, images });
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

    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
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
      const recipeRes = await pg.query("SELECT * FROM recipes WHERE id = $1", [
        id,
      ]);
      const recipe = recipeRes.rows[0];
      if (recipe.user_id !== userId) {
        return res.status(403).json({
          msg: "Not authorized to edit this recipe",
        });
      }

      await pg.query(
        "UPDATE recipes SET url = $1, title = $2, notes = $3, images = $4 WHERE id = $5",
        [url, title, notes, images, id]
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

    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
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
      const recipeRes = await pg.query("SELECT * FROM recipes WHERE id = $1", [
        id,
      ]);
      const recipe = recipeRes.rows[0];
      if (recipe.user_id !== userId) {
        return res.status(403).json({
          msg: "Not authorized to delete this recipe",
        });
      }

      await pg.query("DELETE FROM recipes WHERE id = $1", [id]);
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

  try {
    await pg.connect();
  } catch (error) {
    throw new Error("Error connecting to DB");
  }

  let session = null;
  try {
    const sessionRes = await pg.query(
      "SELECT * FROM sessions WHERE session_id = $1",
      [sessionId]
    );
    session = sessionRes.rows[0];
  } catch (error) {
    throw new Error("Failed to query for session");
  }

  if (!session) {
    throw new Error("Invalid session");
  }

  return session.user_id;
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
    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { name, email, password } = req.body;
    if (isVoid(name) || isVoid(email) || isVoid(password)) {
      return res.status(400).json({
        msg: "Missing data in sign=up request",
      });
    }

    // Check if there's already an account for this email
    try {
      const existingUserRes = await pg.query(
        "SELECT * FROM users_basic WHERE email = $1",
        [email]
      );

      if (existingUserRes.rows[0]) {
        return res.status(400).json({
          msg: "An account already exists for this email",
        });
      }
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to check whether email was associated with existing user",
        error,
      });
    }

    const userId = uuid();
    try {
      await pg.query("INSERT INTO users (id, name) VALUES ($1, $2)", [
        userId,
        name,
      ]);

      await pg.query(
        "INSERT INTO users_basic (user_id, email, password) VALUES ($1, $2, $3)",
        [userId, email, encodePassword(password)]
      );
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to create user",
        error,
      });
    }

    try {
      const sessionId = uuid();
      const sessionRes = await pg.query(
        "INSERT INTO sessions (user_id, session_id) VALUES ($1, $2)",
        [userId, sessionId]
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
    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { email, password } = req.body;
    if (isVoid(email) || isVoid(password)) {
      return res.status(400).json({
        msg: "Missing email or password in login request",
      });
    }

    let userRes;
    try {
      userRes = await pg.query(
        "SELECT * FROM users_basic WHERE email = $1 AND password = $2",
        [email, encodePassword(password)]
      );
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to query users",
        error,
      });
    }

    if (!userRes.rows[0]) {
      return res.status(401).json({
        msg: "Invalid email or password",
      });
    }

    const userId = userRes.rows[0].user_id;
    try {
      const userRes = await pg.query("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      const { name } = userRes.rows[0];

      const sessionId = uuid();
      await pg.query(
        "INSERT INTO sessions (user_id, session_id) VALUES ($1, $2)",
        [userId, sessionId]
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
    await pg.connect();
  } catch (error) {
    return res.status(500).json({
      msg: "Error connecting to DB",
      error,
    });
  }

  try {
    const sessionRes = await pg.query(
      "DELETE FROM sessions WHERE session_id = $1",
      [sessionId]
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
