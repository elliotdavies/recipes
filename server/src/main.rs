#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate rocket_contrib;
#[macro_use] extern crate serde_derive;

use rocket::Rocket;
use rocket::fairing::AdHoc;
use rocket_contrib::json::{Json, JsonValue};
use rocket_contrib::databases::postgres;
use rocket_cors;

mod cors;

#[database("recipes_db")]
struct DBConn(postgres::Connection);

#[derive(Serialize, Deserialize)]
struct Submission {
    text: String
}

#[derive(Serialize, Deserialize)]
struct Recipe {
    id: i32,
    text: String
}

#[get("/")]
fn get_recipes(db: DBConn) -> Json<JsonValue> {
    let mut recipes: Vec<Recipe> = Vec::new();
    for row in &db.query("SELECT * FROM recipes", &[]).unwrap() {
        let id : i32 = row.get("id");
        let text : String = row.get("text");
        let recipe = Recipe { id, text };
        recipes.push(recipe);
    }

    Json(json!(recipes))
}

#[post("/",  data = "<submission>")]
fn add_recipe(db: DBConn, submission: Json<Submission>) -> Json<JsonValue> {
    db.execute(
        "INSERT INTO recipes (text) VALUES ($1)",
         &[&submission.text]
    ).unwrap();

    Json(json!({ "status": "ok" }))
}

fn set_up_db(rocket: Rocket) -> Result<Rocket, Rocket> {
    let db = DBConn::get_one(&rocket).expect("Database connection");
    db.execute(
        "CREATE TABLE IF NOT EXISTS recipes (
            id   SERIAL PRIMARY KEY,
            text VARCHAR NOT NULL
        )",
        &[]
    ).unwrap();
    Ok(rocket)
}

fn main() -> Result<(), rocket_cors::Error> {
    println!("Launching...");

    let cors = cors::cors()?;

    rocket::ignite()
        .attach(DBConn::fairing())
        .attach(AdHoc::on_attach("Set up database", set_up_db))
        .attach(cors)
        .mount("/", routes![get_recipes, add_recipe])
        .launch();

    Ok(())
}
