FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/tsconfig.json ./

# Install tsx to run server.ts
RUN npm install -g tsx

EXPOSE 8383

CMD ["tsx", "server.ts"]
