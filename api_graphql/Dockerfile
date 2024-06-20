FROM node:12-alpine as builder

RUN apk add git python g++ make

WORKDIR app
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock

RUN yarn

COPY ./src ./src
COPY ./assets ./assets
COPY ./nest-cli.json ./nest-cli.json
COPY ./nodemon.json ./nodemon.json
COPY ./tsconfig.build.json ./tsconfig.build.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./.env.dev ./.env.dev

RUN  yarn build

##################################################

FROM node:12-alpine
WORKDIR app

EXPOSE 4000

COPY --from=builder /app /app

CMD [ "yarn", "start:prod"]
