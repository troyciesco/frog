# Started from https://hono.dev/docs/getting-started/nodejs#building-deployment
FROM node:22-alpine AS base

FROM base AS builder

RUN apk add --no-cache gcompat
WORKDIR /app

COPY yarn.lock package.json tsconfig.json ./
COPY src/ ./src/

RUN yarn install --frozen-lockfile

RUN yarn build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
EXPOSE 2222

ENV PORT=${PORT}
ENV ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

CMD ["node", "/app/dist/index.js"]