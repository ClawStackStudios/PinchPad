# PinchPad Combined API + UI Server
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build for a single-image setup serving both frontend and backend.
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy ONLY source files needed for build (exclude dist/)
# This ensures we never use stale local dist/ files
COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src
COPY public ./public

# Build fresh from source
RUN npm run build

# Stage 2: Production environment for Express API
FROM node:20-alpine

# Install build tools needed for native modules (better-sqlite3),
# su-exec to drop privileges, and shadow for usermod/groupmod (PUID/PGID)
RUN apk add --no-cache python3 make g++ su-exec shadow

WORKDIR /app

# Copy only the server + package files first (layer cache optimisation)
COPY package.json package-lock.json* ./
# Keep tsx as a dev dependency — needed to run server.ts at runtime
RUN npm install

COPY server.ts ./
COPY src ./src

# Copy built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Data volume mount point
RUN mkdir -p /app/data

# Copy and prepare the entrypoint script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Expose the API/UI port
EXPOSE 8282

# Health check (run as the node user inside the container)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:8282/api/health || exit 1

ENV NODE_ENV=production
ENV PORT=8282
ENV DATA_DIR=/app/data
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npx", "tsx", "server.ts"]
