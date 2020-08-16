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

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(bodyParser.json()); // parse application/json

/**
 * @TODO
 *
 * - Refactor out dev env vars
 * - Add image endpoint
 */

interface ApiError {
  msg: string;
  error?: Error;
}

type RequestWithBody<T> = Request<any, any, T>;
type ResponseWithErr<T> = Response<T | ApiError>;

interface Recipe {
  id: number;
  url: string;
  title: string;
  notes: string;
  images: string[];
}

app.get("/", async (req: Request, res: ResponseWithErr<Recipe[]>) => {
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
    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { url, title, notes, images } = req.body;
    if (!url || !title || !notes || !images) {
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
    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { id, url, title, notes, images } = req.body;
    if (!url || !title || !notes || !images) {
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
    try {
      await pg.connect();
    } catch (error) {
      return res.status(500).json({
        msg: "Error connecting to DB",
        error,
      });
    }

    const { id } = req.body;
    if (!id) {
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

module.exports.handler = serverless(app);
