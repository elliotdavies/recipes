FROM postgres

ENV POSTGRES_DB recipes
ENV POSTGRES_USER recipes
ENV POSTGRES_PASSWORD password123

COPY schema.sql /docker-entrypoint-initdb.d/
