FROM node:10.18.1-alpine

RUN apk add git

EXPOSE 4000
WORKDIR app
COPY package.json ./package.json
# COPY yarn.lock ./yarn.lock

RUN yarn
COPY . .
RUN  yarn build

CMD [ "yarn", "start:prod"]
