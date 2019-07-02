#![feature(proc_macro_hygiene, decl_macro)]
use rocket;
use rocket_cors;

use rocket::http::Method;
use rocket_cors::{AllowedHeaders, AllowedOrigins, Cors, Error};

pub fn cors() -> Result<Cors, Error> {
    let allowed_origins = AllowedOrigins::some_exact(&["http://localhost:5000"]);

    rocket_cors::CorsOptions {
        allowed_origins,
        allowed_methods: vec![Method::Get, Method::Post].into_iter().map(From::from).collect(),
        allowed_headers: AllowedHeaders::some(&["Authorization", "Accept", "Content-Type"]),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
}
