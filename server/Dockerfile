FROM node:22-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/migrations ./migrations
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
RUN apk add --no-cache wget
COPY --from=builder /app/dist ./dist
COPY server/migrations ./migrations
ENV NODE_ENV=production
ENV TZ=Europe/Paris
EXPOSE 3001
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
