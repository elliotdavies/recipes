# Build
FROM node:lts as build

COPY ./ ./

RUN yarn && yarn build

# Run
FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /dist /usr/share/nginx/html
