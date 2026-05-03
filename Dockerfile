FROM node:20-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates git \
	&& rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/DTrombett/portaleargo-api.git /tmp/portaleargo-api
WORKDIR /tmp/portaleargo-api
RUN npm ci --legacy-peer-deps && npm run build
RUN node -e "const fs=require('fs');const pkg=require('./package.json');delete pkg.scripts.postinstall;fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

WORKDIR /app
COPY package.json ./
RUN node -e "const fs=require('fs');const pkg=require('./package.json');pkg.dependencies['portaleargo-api']='file:/tmp/portaleargo-api';fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"
RUN npm install --legacy-peer-deps

FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /tmp/portaleargo-api /tmp/portaleargo-api
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=deps /tmp/portaleargo-api /tmp/portaleargo-api
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/icons ./icons
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/postcss.config.js ./postcss.config.js
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

CMD ["npm", "run", "start"]
