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
  const session_id = extractSessionId(req);
  try {
    await checkAuthValid(session_id);
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
    const queryRes = await pg.query("SELECT * FROM recipes");
    return res.json(queryRes.rows);
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
    const session_id = extractSessionId(req);
    try {
      await checkAuthValid(session_id);
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
        "INSERT INTO recipes (url, title, notes, images) VALUES ($1, $2, $3, $4) RETURNING id",
        [url, title, notes, images]
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
    const session_id = extractSessionId(req);
    try {
      await checkAuthValid(session_id);
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
    const session_id = extractSessionId(req);
    try {
      await checkAuthValid(session_id);
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
    const session_id = extractSessionId(req);
    try {
      await checkAuthValid(session_id);
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

interface User {
  email: string;
  name?: string;
}

interface Session {
  user_email: number;
  session_id: string;
}

const extractSessionId = (req: Request): string | null => {
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }

  return null;
};

const checkAuthValid = async (session_id: string | null): Promise<void> => {
  if (!session_id) {
    throw new Error("Null session_id");
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
      [session_id]
    );
    session = sessionRes.rows[0];
  } catch (error) {
    throw new Error("Failed to query for session");
  }

  if (!session) {
    throw new Error("Invalid session");
  }
};

interface LoginBody {
  email: string;
  name?: string;
}

interface LoginResponse {
  session_id: string;
}

app.post(
  "/login/google",
  async (
    req: RequestWithBody<LoginBody>,
    res: ResponseWithErr<LoginResponse>
  ) => {
    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { email, name } = req.body;
    if (isVoid(email)) {
      return res.status(400).json({
        msg: "Missing email in login request",
      });
    }

    try {
      const existingUserRes = await pg.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      const existingUser = existingUserRes.rows[0];

      if (!existingUser) {
        await pg.query("INSERT INTO users (email, name) VALUES ($1, $2)", [
          email,
          name,
        ]);
      }
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to retrieve or create user",
        error,
      });
    }

    try {
      const session_id = uuid();
      const sessionRes = await pg.query(
        "INSERT INTO sessions (user_email, session_id) VALUES ($1, $2)",
        [email, session_id]
      );
      res.status(200).json({ session_id });
    } catch (error) {
      return res.status(500).json({
        msg: "Failed to generate session",
        error,
      });
    }
  }
);

app.post("/logout", async (req: Request, res: Response) => {
  const session_id = extractSessionId(req);
  try {
    await checkAuthValid(session_id);
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
      [session_id]
    );
    res.status(200);
  } catch (error) {
    return res.status(500).json({
      msg: "Failed to delete session",
      error,
    });
  }
});

module.exports.handler = serverless(app);
