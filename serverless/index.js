const serverless = require('serverless-http');
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
app.disable('x-powered-by')
app.options('*', cors())

const pg = new Pool()

/** 
 * @TODO
 *
 * - Add image endpoint
 * - Set up local dev with frontend and DB
 * - Prod env vars
 * - Deploy with CI
 * - TypeScript
 * - Prettier
 * - Switch api.recipes* domain to point at API gateway
 * - Decommission ECS etc
 * - Delete Rust code
 */

// interface ApiError {
//   error: string
// }

// interface Recipe {
//   id: number
//   url: string
//   title: string
//   notes: string
//   images: string[]
// }

// interface Submission {
//   url: string
//   title: string
//   notes: string
//   images: string[]
// }

app.get('/', async (req, res) => {
  await pg.connect()

  const queryRes = await pg.query("SELECT * FROM recipes")
  res.json(queryRes.rows)
})

app.post('/', async (req, res) => {
  await pg.connect()
  const { url,title,notes,images } = req.data

  await pg.query("INSERT INTO recipes (url, title, notes, images) VALUES ($1, $2, $3, $4) RETURNING id",
    [url,title,notes,images])

  res.status(201)
  res.json({ id,url,title,notes,images })
})

app.put('/', async (req, res) => {
  await pg.connect()
  const { id, url,title,notes,images } = req.data

  await pg.query("UPDATE recipes SET url = $1, title = $2, notes = $3, images = $4 WHERE id = $5",
    [url, title, notes, images, id])

  res.sendStatus(204)
})

app.delete('/', async (req, res) => {
  await pg.connect()
  const { id } = req.data

  await pg.query("DELETE FROM recipes WHERE id = $1", [id])
  res.sendStatus(204)
})

module.exports.handler = serverless(app)
app.listen(8000)
