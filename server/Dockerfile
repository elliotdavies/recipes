# Build
FROM rustlang/rust:nightly as build

COPY ./ ./

RUN rustup toolchain install nightly-2018-08-09

RUN rustup default nightly-2018-08-09

RUN rustup target add x86_64-unknown-linux-musl

RUN apt-get update && apt-get install -y clang

RUN TARGET_CC=clang cargo build --target x86_64-unknown-linux-musl --release

RUN mkdir /build

RUN cp target/x86_64-unknown-linux-musl/release/recipes /build

RUN ls /build

# Deploy
FROM scratch

COPY --from=build /build/recipes /

CMD ["/recipes"]
