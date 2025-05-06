FROM node:22-alpine AS build
WORKDIR /app

COPY yarn.lock package.json ./

RUN yarn install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN yarn build

FROM caddy:2-alpine
WORKDIR /srv
RUN mkdir -p dist
COPY --from=build /app/dist ./dist
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE ${PORT}
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]