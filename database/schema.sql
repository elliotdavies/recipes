CREATE TABLE IF NOT EXISTS users (
    id    UUID NOT NULL PRIMARY KEY,
    name  VARCHAR
);

CREATE TABLE IF NOT EXISTS users_basic (
    user_id   UUID NOT NULL REFERENCES users(id),
    email     VARCHAR NOT NULL UNIQUE,
    password  VARCHAR NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS users_google (
    user_id   UUID NOT NULL REFERENCES users(id),
    google_id VARCHAR NOT NULL,
    PRIMARY KEY (user_id, google_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    user_id    UUID NOT NULL REFERENCES users(id),
    session_id UUID NOT NULL,
    PRIMARY KEY (user_id, session_id)
);

CREATE TABLE IF NOT EXISTS recipes (
    id    SERIAL PRIMARY KEY,
    url   VARCHAR NOT NULL,
    notes VARCHAR NOT NULL
);

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS title VARCHAR NOT NULL DEFAULT '';

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS images VARCHAR[] NOT NULL DEFAULT '{}';

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES users(id);
