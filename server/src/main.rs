#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

use rocket::response::status;
use rocket::http::Status;
use rocket_contrib::json::{Json, JsonValue};
use rocket_contrib::databases::postgres;
use rocket_cors;

mod cors;

#[database("recipes")]
struct DBConn(postgres::Connection);

#[derive(Serialize, Deserialize)]
struct Recipe {
    id: i32,
    url: String,
    title: String,
    notes: String
}

#[get("/")]
fn get_recipes(db: DBConn) -> status::Custom<Json<JsonValue>> {
    let mut recipes: Vec<Recipe> = Vec::new();
    for row in &db.query("SELECT * FROM recipes", &[]).unwrap() {
        let id : i32 = row.get("id");
        let url : String = row.get("url");
        let title : String = row.get("title");
        let notes : String = row.get("notes");
        let recipe = Recipe { id, url, title, notes };
        recipes.push(recipe);
    }

    status::Custom(Status::Ok, Json(json!(recipes)))
}

#[derive(Serialize, Deserialize)]
struct Submission {
    url: String,
    title: String,
    notes: String
}

#[post("/",  data = "<data>")]
fn add_recipe(db: DBConn, data: Json<Submission>) -> status::Custom<Json<JsonValue>> {
    let mut result: Option<Recipe> = None;
    for row in &db.query(
        "INSERT INTO recipes (url, title, notes) VALUES ($1, $2, $3) RETURNING id",
         &[&data.url, &data.title, &data.notes]
    ).unwrap() {
        let recipe = Recipe {
            id: row.get("id"),
            url: data.url.clone(),
            title: data.title.clone(),
            notes: data.notes.clone()
        };

        result = Some(recipe);
    }

    status::Custom(Status::Created, Json(json!(result)))
}

#[put("/",  data = "<data>")]
fn update_recipe(db: DBConn, data: Json<Recipe>) -> status::Custom<()> {
    db.query(
        "UPDATE recipes SET url = $1, title = $2, notes = $3 WHERE id = $4",
         &[&data.url, &data.title, &data.notes, &data.id]
    ).unwrap();

    status::Custom(Status::NoContent, ())
}

#[derive(Serialize, Deserialize)]
struct DeleteRecipe {
    id: i32,
}

#[delete("/",  data = "<data>")]
fn delete_recipe(db: DBConn, data: Json<DeleteRecipe>) -> status::Custom<()> {
    db.query(
        "DELETE FROM recipes WHERE id = $1",
         &[&data.id]
    ).unwrap();

    status::Custom(Status::NoContent, ())
}

fn main() -> Result<(), rocket_cors::Error> {
    println!("Launching...");

    let cors = cors::cors()?;

    rocket::ignite()
        .attach(DBConn::fairing())
        .attach(cors)
        .mount("/", routes![get_recipes, add_recipe, update_recipe, delete_recipe])
        .launch();

    Ok(())
}
