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
struct Message {
    message: String
}

#[post("/",  data = "<message>")]
fn receive_message(db: DBConn, message: Json<Message>) -> Json<JsonValue> {
    db.execute(
        "INSERT INTO recipes (message) VALUES ($1)",
         &[&message.message]
    ).unwrap();

    Json(json!({ "status": "ok" }))
}

fn set_up_db(rocket: Rocket) -> Result<Rocket, Rocket> {
    let db = DBConn::get_one(&rocket).expect("Database connection");
    db.execute(
        "CREATE TABLE IF NOT EXISTS recipes (
            id      SERIAL PRIMARY KEY,
            message VARCHAR NOT NULL
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
        .mount("/", routes![receive_message])
        .launch();

    Ok(())
}
