extern crate futures;
extern crate rusoto_core;
extern crate rusoto_s3;

use std::default::Default;

use futures::{Future, Stream};
use rusoto_core::Region;
use rusoto_s3::{GetObjectRequest, PutObjectRequest, S3Client, S3};

pub fn get_object(bucket: &str, filename: &str) {
    let client = S3Client::new(Region::EuWest2);

    let get_req = GetObjectRequest {
        bucket: bucket.to_owned(),
        key: filename.to_owned(),
        ..Default::default()
    };

    let result = client
        .get_object(get_req)
        .sync()
        .expect("Couldn't GET object");
    println!("get object result: {:#?}", result);

    let stream = result.body.unwrap();
    let body = stream.concat2().wait().unwrap();

    assert!(body.len() > 0);
}

pub fn put_object(contents: Vec<u8>, bucket: &str, filename: &str, content_type: &str) {
    let client = S3Client::new(Region::EuWest2);

    let put_request = PutObjectRequest {
        bucket: bucket.to_owned(),
        key: filename.to_owned(),
        body: Some(contents.into()),
        content_type: Some(content_type.to_owned()),
        ..Default::default()
    };

    client
        .put_object(put_request)
        .sync()
        .expect("Failed to put object");
}
