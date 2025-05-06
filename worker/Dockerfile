FROM node:22-alpine AS build

WORKDIR /app

COPY yarn.lock package.json tsconfig.json ./
COPY src ./src

RUN yarn install --frozen-lockfile 

RUN yarn build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production

CMD ["node", "dist/index.js"]
