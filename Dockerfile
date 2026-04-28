FROM node:22-slim AS builder

WORKDIR /app

# Install build tools for native modules (better-sqlite3-multiple-ciphers requires Python + build essentials)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-slim

WORKDIR /app

# Install build tools for native modules (better-sqlite3-multiple-ciphers requires Python + build essentials)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/tsconfig.json ./

# Install tsx to run server.ts
RUN npm install -g tsx

# Install gosu for privilege dropping (PUID/PGID support)
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8383

ENTRYPOINT ["entrypoint.sh"]
CMD ["tsx", "server.ts"]
