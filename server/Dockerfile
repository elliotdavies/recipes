# Build
FROM clux/muslrust:stable as build

COPY ./ ./

RUN rustup toolchain install nightly-2019-08-09 && \
    rustup default nightly-2019-08-09

RUN rustup target add x86_64-unknown-linux-musl

RUN cargo build --target x86_64-unknown-linux-musl --release

RUN mkdir /build && \
    cp target/x86_64-unknown-linux-musl/release/recipes /build

# Deploy
FROM scratch

COPY --from=build /build/recipes /

CMD ["/recipes"]
