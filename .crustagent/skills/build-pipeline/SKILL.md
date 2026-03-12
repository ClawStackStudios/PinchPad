---
name: clawchives-build-pipeline©™
description: Docker build pipeline for ClawChives©™. Covers multi-stage Dockerfile requirements, dev vs production compose, post-build verification, and a registry of known failure modes learned from production debugging.
---

# ClawChives©™ Docker Build Pipeline

## 🏗️ Pipeline Overview

ClawChives©™ uses a **two-stage Docker build** — builder produces the frontend bundle, production runs the API and serves static files.

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: builder (node:20-alpine)                          │
│    npm install (all deps incl. devDependencies)             │
│    COPY: index.html, vite.config.ts, tsconfig*.json         │
│    COPY: postcss.config.js, tailwind.config.js  ← CRITICAL  │
│    COPY: src/, public/                                       │
│    RUN: npm run build  →  dist/ (Vite + Tailwind)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ COPY --from=builder /app/dist
┌──────────────────────────▼──────────────────────────────────┐
│  STAGE 2: production (node:20-alpine)                       │
│    npm install --omit=dev                                    │
│    COPY: server.js, src/ (middleware/utils/config)          │
│    COPY: dist/ (from builder)                               │
│    ENTRYPOINT: docker-entrypoint.sh → node server.js        │
│    PORT: 4545 (UI + API, single container)                  │
└─────────────────────────────────────────────────────────────┘
```

**Key rule:** `dist/` is NEVER copied from the host. It is always built fresh inside Docker from source files only.

---

## 📋 Pre-Build Checklist

Run before every `docker-compose up --build`:

### Builder Stage Files
- [ ] `postcss.config.js` exists in project root
- [ ] `tailwind.config.js` exists in project root
- [ ] Both are included in Dockerfile builder COPY (see Dockerfile Invariants below)
- [ ] `dist/` is NOT committed to git and NOT present on host (or is ignored)

### Security Headers (HTTP LAN vs HTTPS)
- [ ] `ENFORCE_HTTPS` is `false` for plain HTTP LAN deployments
- [ ] `ENFORCE_HTTPS` is `true` only behind a reverse proxy with a real certificate
- [ ] Helmet CSP `upgradeInsecureRequests` is gated: `process.env.ENFORCE_HTTPS === "true" ? [] : null`

### Compose File
- [ ] Using `docker-compose.dev.yml` for local builds (has `build:` section)
- [ ] Using `docker-compose.yml` only for pulling published GHCR images
- [ ] SPA catch-all regex excludes `/assets/`: `/^(?!\/api\/)(?!\/assets\/)/`

---

## 🚀 Build Commands

### Local / LAN Development
```bash
# Standard build from local source
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build -d

# Force fully clean build (bust all layer cache)
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Watch logs during startup
docker logs clawchives -f
```

### Production (GHCR via GitHub Actions)
```bash
# Push to main branch — Actions workflow builds and pushes to GHCR
git push origin main

# Pull and run published image (no local build)
docker-compose up -d   # uses docker-compose.yml → pulls ghcr.io image
```

### Useful One-Liners
```bash
# Full teardown + clean rebuild + start
docker-compose -f docker-compose.dev.yml down && \
  docker-compose -f docker-compose.dev.yml build --no-cache && \
  docker-compose -f docker-compose.dev.yml up -d

# Check what's in the container's dist/
docker exec clawchives ls /app/dist/assets/
docker exec clawchives cat /app/dist/index.html
```

---

## ✅ Post-Build Verification

Run after every rebuild to confirm the pipeline succeeded:

### 1. CSS must be `text/css` — NOT `text/html`
```bash
# Get the CSS filename from the container
CSS_FILE=$(docker exec clawchives ls /app/dist/assets/*.css | head -1 | xargs basename)
curl -sI http://192.168.1.6:4545/assets/$CSS_FILE | grep content-type
# Expected: content-type: text/css; charset=utf-8
# FAIL if:  content-type: text/html  (SPA catch-all is intercepting assets)
```

### 2. CSS must be >10KB (Tailwind actually processed)
```bash
docker exec clawchives wc -c /app/dist/assets/*.css
# Expected: 50000+ bytes for a full Tailwind build
# FAIL if:  ~1400 bytes  (Tailwind directives were NOT processed — raw @tailwind text)
```

### 3. CSP must NOT contain `upgrade-insecure-requests` on HTTP
```bash
curl -sI http://192.168.1.6:4545/ | grep content-security-policy
# FAIL if output contains: upgrade-insecure-requests
```

### 4. No HSTS on HTTP
```bash
curl -sI http://192.168.1.6:4545/ | grep -i strict-transport
# Expected: (no output)
# FAIL if:  strict-transport-security header is present
```

### 5. Container is healthy
```bash
docker ps | grep clawchives
# Expected: Status "healthy" or "Up X seconds"
docker logs clawchives --tail=20
# Expected: "🦞 ClawChives API running on port 4545"
```

---

## ☠️ Known Failure Modes

A registry of bugs found and fixed — consult before debugging a new styling/asset issue.

### #1 — Tailwind Not Processed (Missing Config in Builder Stage)
```
Symptom: Page renders with zero styles, no colors, huge default font
Evidence: dist/assets/*.css is ~1400 bytes and contains literal @tailwind base; text
Root Cause: postcss.config.js and/or tailwind.config.js missing from Dockerfile COPY
Fix: Add to Dockerfile builder stage:
     COPY postcss.config.js tailwind.config.js ./
```

### #2 — SPA Catch-All Swallowing Assets
```
Symptom: CSS/JS returns Content-Type: text/html (457 bytes = index.html)
Evidence: curl -sI /assets/foo.css shows content-type: text/html
Root Cause: Express catch-all regex /^(?!\/api\/).*/ matches /assets/* paths
            express.static serves the file, but if it calls next() the catch-all
            fires and returns index.html instead of 404
Fix: Tighten regex in server.js:
     app.get(/^(?!\/api\/)(?!\/assets\/).*/, ...)
```

### #3 — CSP `upgrade-insecure-requests` on HTTP LAN
```
Symptom: ERR_SSL_PROTOCOL_ERROR — browser tries to HTTPS-upgrade every asset
Evidence: curl -I response contains upgrade-insecure-requests in CSP header
Root Cause: Helmet injects upgrade-insecure-requests by default, even on HTTP
Fix: Add to helmet() CSP directives in server.js:
     upgradeInsecureRequests: process.env.ENFORCE_HTTPS === "true" ? [] : null,
```

### #4 — `docker-compose up --build` Is a No-Op
```
Symptom: Code changes don't appear in running container after rebuild
Evidence: git diff shows local changes; container serves old behavior
Root Cause: docker-compose.yml has only image: (GHCR pull), no build: section
            docker-compose up --build does nothing when there's no build: key
Fix: Use docker-compose.dev.yml for local development (has build: section)
     OR add build: to docker-compose.yml for local-only use
```

### #5 — Stale Layer Cache
```
Symptom: After fixing Dockerfile, container still shows old behavior
Root Cause: Docker cached the builder stage from before the fix
Fix: docker-compose -f docker-compose.dev.yml build --no-cache
```

### #6 — HSTS Caching "Always Use HTTPS"
```
Symptom: Browser shows ERR_SSL_PROTOCOL_ERROR even on HTTP-only LAN
Evidence: Previous deployment had ENFORCE_HTTPS=true; browser cached HSTS
Root Cause: HSTS (Strict-Transport-Security) cached by browser, not server issue
Fix: Disable in browser: chrome://net-internals/#hsts → delete domain entry
     Server: strictTransportSecurity: process.env.ENFORCE_HTTPS === "true" ? undefined : false
```

---

## 🔐 Dockerfile Builder Stage Invariants

These files MUST be present in the builder COPY section. Missing any causes silent failures:

```dockerfile
# ✅ REQUIRED — all must be present
COPY package.json package-lock.json* ./
RUN npm install
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY postcss.config.js tailwind.config.js ./   ← NEVER REMOVE
COPY src ./src
COPY public ./public
RUN npm run build

# ❌ NEVER DO THIS — copies stale local dist/ into image
# COPY . .
# COPY dist ./dist
```

The production stage MUST get `dist/` from the builder, never from the host:
```dockerfile
# ✅ CORRECT
COPY --from=builder /app/dist ./dist
```

---

## 🦞 Lobster Wisdom

*"A lobster never carries its old shell into the new one. The Docker builder stage is the molt — start clean, build fresh, never drag stale `dist/` into production."*