#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate rocket_contrib;
#[macro_use]
extern crate serde_derive;

use rocket::http::ContentType;
use rocket::http::Status;
use rocket::response::status;
use rocket::Data;
use rocket_contrib::databases::postgres;
use rocket_contrib::json::{Json, JsonValue};
use rocket_cors;
use rocket_multipart_form_data::{
    mime, FileField, MultipartFormData, MultipartFormDataField, MultipartFormDataOptions,
};
use std::fs;
use uuid::Uuid;

mod cors;
mod s3;

#[database("recipes")]
struct DBConn(postgres::Connection);

#[derive(Serialize)]
struct ApiError {
    error: String,
}

#[derive(Serialize)]
struct PostImageResponse {
    filename: String,
}

// example with error handling etc at
// https://github.com/magiclen/rocket-multipart-form-data/blob/master/examples/image_uploader.rs
#[post("/image", data = "<data>")]
fn post_image(
    _db: DBConn,
    content_type: &ContentType,
    data: Data,
) -> status::Custom<Json<JsonValue>> {
    println!("post_image");

    let mut options = MultipartFormDataOptions::new();
    options.allowed_fields.push(
        MultipartFormDataField::file("image")
            .content_type_by_string(Some(mime::IMAGE_STAR))
            .unwrap(),
    );

    println!("post_image options: {:#?}", options);

    let multipart_form_data = MultipartFormData::parse(content_type, data, options).unwrap();

    println!("post_image m_f_d: {:#?}", multipart_form_data);

    let image = multipart_form_data.files.get("image");

    println!("post_image image: {:#?}", image);

    if let Some(image) = image {
        match image {
            FileField::Single(file) => {
                let maybe_filename = file.file_name.as_ref();
                println!("post_image maybe_filename: {:#?}", maybe_filename);

                let maybe_content_type = file.content_type.as_ref();
                println!("post_image maybe_content_type: {:#?}", maybe_content_type);

                let contents_result = fs::read(&file.path);
                let maybe_err = contents_result.as_ref().err();
                println!("post_image contents_result: {:#?}", maybe_err);

                match (maybe_filename, maybe_content_type, contents_result) {
                    (Some(filename), Some(content_type), Ok(contents)) => {
                        let filename_parts = filename.split(".");
                        let maybe_ext = filename_parts.last();

                        match maybe_ext {
                            Some(ext) => {
                                let uuid = Uuid::new_v4().to_string();
                                let mut uuid_filename = uuid + ".";
                                uuid_filename.push_str(&ext);

                                let mut s3_path = "images/".to_string();
                                s3_path.push_str(&uuid_filename);

                                s3::put_object(
                                    contents,
                                    "recipes.elliotdavies.co.uk",
                                    &s3_path,
                                    &content_type.to_string(),
                                );

                                let response = PostImageResponse {
                                    filename: uuid_filename,
                                };
                                status::Custom(Status::Ok, Json(json!(response)))
                            }
                            None => status::Custom(
                                Status::BadRequest,
                                Json(json!(ApiError {
                                    error: "Filename had no extension".to_string()
                                })),
                            ),
                        }
                    }
                    (None, _, _) => status::Custom(
                        Status::BadRequest,
                        Json(json!(ApiError {
                            error: "No filename found in request".to_string()
                        })),
                    ),
                    (_, None, _) => status::Custom(
                        Status::BadRequest,
                        Json(json!(ApiError {
                            error: "No content type found in request".to_string()
                        })),
                    ),
                    (_, _, Err(_err)) => status::Custom(
                        Status::InternalServerError,
                        Json(json!(ApiError {
                            error: "Failed to read file".to_string()
                        })),
                    ),
                }
            }
            FileField::Multiple(_files) => status::Custom(
                Status::BadRequest,
                Json(json!(ApiError {
                    error: "Multiple files found in request".to_string()
                })),
            ),
        }
    } else {
        status::Custom(
            Status::BadRequest,
            Json(json!(ApiError {
                error: "No file found in request".to_string()
            })),
        )
    }
}

#[derive(Serialize, Deserialize)]
struct Recipe {
    id: i32,
    url: String,
    title: String,
    notes: String,
    images: Vec<String>,
}

#[get("/")]
fn get_recipes(db: DBConn) -> status::Custom<Json<JsonValue>> {
    let mut recipes: Vec<Recipe> = Vec::new();
    for row in &db.query("SELECT * FROM recipes", &[]).unwrap() {
        let id: i32 = row.get("id");
        let url: String = row.get("url");
        let title: String = row.get("title");
        let notes: String = row.get("notes");
        let images: Vec<String> = row.get("images");
        let recipe = Recipe {
            id,
            url,
            title,
            notes,
            images,
        };
        recipes.push(recipe);
    }

    status::Custom(Status::Ok, Json(json!(recipes)))
}

#[derive(Serialize, Deserialize)]
struct Submission {
    url: String,
    title: String,
    notes: String,
    images: Vec<String>,
}

#[post("/", data = "<data>")]
fn add_recipe(db: DBConn, data: Json<Submission>) -> status::Custom<Json<JsonValue>> {
    let mut result: Option<Recipe> = None;
    for row in &db
        .query(
            "INSERT INTO recipes (url, title, notes, images) VALUES ($1, $2, $3, $4) RETURNING id",
            &[&data.url, &data.title, &data.notes, &data.images],
        )
        .unwrap()
    {
        let recipe = Recipe {
            id: row.get("id"),
            url: data.url.clone(),
            title: data.title.clone(),
            notes: data.notes.clone(),
            images: data.images.clone(),
        };

        result = Some(recipe);
    }

    status::Custom(Status::Created, Json(json!(result)))
}

#[put("/", data = "<data>")]
fn update_recipe(db: DBConn, data: Json<Recipe>) -> status::Custom<()> {
    db.query(
        "UPDATE recipes SET url = $1, title = $2, notes = $3, images = $4 WHERE id = $5",
        &[&data.url, &data.title, &data.notes, &data.images, &data.id],
    )
    .unwrap();

    status::Custom(Status::NoContent, ())
}

#[derive(Serialize, Deserialize)]
struct DeleteRecipe {
    id: i32,
}

#[delete("/", data = "<data>")]
fn delete_recipe(db: DBConn, data: Json<DeleteRecipe>) -> status::Custom<()> {
    db.query("DELETE FROM recipes WHERE id = $1", &[&data.id])
        .unwrap();

    status::Custom(Status::NoContent, ())
}

fn main() -> Result<(), rocket_cors::Error> {
    println!("Launching...");

    let cors = cors::cors()?;

    rocket::ignite()
        .attach(DBConn::fairing())
        .attach(cors)
        .mount(
            "/",
            routes![
                get_recipes,
                add_recipe,
                update_recipe,
                delete_recipe,
                post_image
            ],
        )
        .launch();

    Ok(())
}
