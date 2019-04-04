#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use] extern crate rocket;
#[macro_use] extern crate serde_derive;

use rocket_contrib::json::{Json};

#[derive(Serialize)]
struct Response {
    id: i32,
    message: String
}

#[get("/")]
fn get() -> Json<Response> {
    Json(Response {
        id: 1,
        message: String::from("Hello world!")
    })
}

fn rocket() -> rocket::Rocket {
    rocket::ignite().mount("/", routes![get])
}

fn main() {
    println!("Launching...");
    rocket().launch();
}
