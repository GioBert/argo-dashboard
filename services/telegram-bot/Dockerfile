FROM node:20-bookworm-slim AS vendor-build
WORKDIR /app/vendors/portaleargo-api

COPY vendors/portaleargo-api/package.json ./package.json
COPY vendors/portaleargo-api/package-lock.json ./package-lock.json
COPY vendors/portaleargo-api/tsconfig.json ./tsconfig.json
COPY vendors/portaleargo-api/tsup.config.ts ./tsup.config.ts
COPY vendors/portaleargo-api/src ./src

RUN npm ci --legacy-peer-deps && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=vendor-build /app/vendors/portaleargo-api /app/vendors/portaleargo-api
COPY services/telegram-bot/package.json ./package.json
COPY services/telegram-bot/src ./src

RUN mkdir -p /app/data

CMD ["node", "src/app.js"]
