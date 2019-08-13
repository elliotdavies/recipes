FROM node:lts

COPY ./ ./

RUN yarn

RUN yarn build

RUN yarn serve-prod
