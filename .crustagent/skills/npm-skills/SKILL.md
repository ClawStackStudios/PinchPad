# ClawStack Studios — npm Skills

## Base Commands

```bash
# Start Vite dev server (port 6262, HMR enabled)
npm run dev

# TypeScript check + Vite production bundle → dist/
npm run build

# Run production Express server locally (requires dist/ to exist)
npm run start
```

## Docker Commands

```bash
# Build and start container
docker-compose up --build -d

# Force clean rebuild (bust all layer cache)
docker-compose build --no-cache && docker-compose up -d

# Watch logs
docker logs clawstack-studios -f

# Tear down
docker-compose down
```

## Production Server

ClawStack Studios uses a minimal Express server (`server.js`) in the production Docker container.

- Serves `dist/` as static files
- SPA catch-all routes everything except `/assets/*` to `index.html`
- Listens on `PORT` env var (default `6262`, bound to `0.0.0.0`)
- Started with `node server.js` — no Vite required at runtime

### Why not `vite preview`?

`vite` is a `devDependency`. The Docker production stage runs `npm install --omit=dev`, so `vite` is not available. Using `node server.js` with Express means only production dependencies are needed.

## Port Reference

```
Dev (Vite HMR):   http://localhost:6262
Docker (Express): http://localhost:6262
```
