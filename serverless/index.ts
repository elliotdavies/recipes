/**
 * Express types: 
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express/index.d.ts
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/express-serve-static-core/index.d.ts
 */
const serverless = require("serverless-http");

const { Pool } = require("pg");
const pg = new Pool();

import { Request, Response } from 'express'
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
 * - Error handling
 * - Refactor out dev env vars
 * - Prod env vars
 * - Deploy with CI
 * - Switch api.recipes* domain to point at API gateway
 * - Add image endpoint
 * - Decommission ECS etc
 * - Delete Rust code
 */

// interface ApiError {
//   error: string
// }

type RequestWithBody<T> = Request<any, any, T>

interface Recipe {
  id: number
  url: string
  title: string
  notes: string
  images: string[]
}

app.get("/", async (req: Request, res: Response<Recipe[]>) => {
  console.log('Connecting to DB') 
  await pg.connect();
  console.log('Connected to DB') 
  const queryRes = await pg.query("SELECT * FROM recipes");
  console.log('Got query result') 
  res.json(queryRes.rows);
});

type CreateRecipeBody = Omit<Recipe, "id">

app.post("/", async (req: RequestWithBody<CreateRecipeBody>, res: Response<Recipe>) => {
  await pg.connect();
  const { url, title, notes, images } = req.body;

  const queryRes = await pg.query(
    "INSERT INTO recipes (url, title, notes, images) VALUES ($1, $2, $3, $4) RETURNING id",
    [url, title, notes, images]
  );

  res.status(201);
  res.json({ id: queryRes.rows[0].id, url, title, notes, images });
});

app.put("/", async (req: RequestWithBody<Recipe>, res: Response<void>) => {
  await pg.connect();
  const { id, url, title, notes, images } = req.body;

  await pg.query(
    "UPDATE recipes SET url = $1, title = $2, notes = $3, images = $4 WHERE id = $5",
    [url, title, notes, images, id]
  );

  res.sendStatus(204);
});

interface DeleteRecipeBody {
  id: number
}

app.delete("/", async (req: RequestWithBody<DeleteRecipeBody>, res: Response<void>) => {
  await pg.connect();
  const { id } = req.body;
  await pg.query("DELETE FROM recipes WHERE id = $1", [id]);
  res.sendStatus(204);
});

module.exports.handler = serverless(app);
