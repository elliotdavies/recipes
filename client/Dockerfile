# Build
FROM node:lts

COPY ./ ./

RUN yarn && yarn build

# Run
CMD yarn serve-prod
