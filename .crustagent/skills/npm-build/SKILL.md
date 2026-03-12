---
name: clawchives-npm-build©™
description: npm/Vite local build pipeline for ClawChives©™. Covers dev server setup, production build, output verification, environment variable behavior, and known failure modes.
---

# ClawChives©™ npm Build Pipeline

## 🚀 Commands

### Local Development (Recommended)
```bash
# Start both Vite dev server (4545) and API server (4242) concurrently
npm start

# Vite dev server only — API will be unreachable, use npm start instead
npm run dev

# API server only (port 4242)
npm run start:api
```

### Production Build
```bash
# Full TypeScript check + Vite production bundle → dist/
npm run build

# Run unit tests (Vitest)
npm test
```

### Port Reference
```
Dev:        http://localhost:4545  (Vite HMR)
API (dev):  http://localhost:4242  (Express, separate process)
Docker:     http://localhost:4545  (Vite bundle + Express, single container on same port)
```

---

## 📋 Pre-Build Checklist

- [ ] `tailwind.config.js` exists in project root
- [ ] `postcss.config.js` exists in project root
- [ ] TypeScript compiles cleanly: `npx tsc --noEmit`
- [ ] No `fetch()` calls directly in components (all API calls go through `RestAdapter`)
- [ ] No hardcoded `localhost:4242` in `src/` (use `getApiBaseUrl()` from `src/config/apiConfig.ts`)
- [ ] `import.meta.env.VITE_API_URL` is used as exact literal (not type-cast — see Critical note below)

---

## ✅ Output Verification

After `npm run build`, verify `dist/` is correct before using in Docker:

### CSS must be processed by Tailwind (>10KB)
```bash
wc -c dist/assets/*.css
# Expected: 50000+ bytes
# FAIL if:  ~1400 bytes — PostCSS did not run, @tailwind directives are raw text
```

### CSS must not contain raw Tailwind directives
```bash
head -c 200 dist/assets/*.css
# Expected: minified CSS rules starting with :root{... or *, ::before...
# FAIL if:  @tailwind base;@tailwind components;@tailwind utilities;
```

### JS bundle must not contain hardcoded localhost
```bash
grep -c "localhost:4242" dist/assets/*.js
# Expected: 0
# FAIL if:  any number > 0 (Vite env replacement did not fire)
```

### Both asset files must exist
```bash
ls dist/assets/
# Expected: index-[hash].css  index-[hash].js  (and optionally main-logo.png)
```

---

## ⚙️ Environment Variable Behavior

ClawChives©™ uses a **priority-based URL resolution** via `src/config/apiConfig.ts`:

```
Priority 1 (highest): VITE_API_URL env var set at build time
Priority 2:           Production build → "" (relative paths, same-origin)
Priority 3 (default): Dev fallback → http://localhost:4242
```

### Dev (`npm start`)
```
VITE_API_URL not set → import.meta.env.PROD = false → http://localhost:4242
Frontend (4545) calls API (4242) via absolute URL
```

### Production build (`npm run build`)
```
import.meta.env.PROD = true → API_BASE = ""
All /api/* calls are relative → works on any host/port (Docker, LAN, reverse proxy)
```

### Custom domain override
```bash
VITE_API_URL=https://bookmarks.yourdomain.com npm run build
# Bakes the custom URL into the bundle at build time
```

---

## 🔐 Critical: Vite Environment Variable Replacement

The `VITE_API_URL` env var MUST appear as the exact literal string in source code.
Vite's build-time string replacement only fires when it sees the exact token.

```typescript
// ✅ CORRECT — Vite sees the exact string and replaces it
// @ts-ignore: Vite replaces import.meta.env.VITE_API_URL at build-time
const API_BASE = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL || "http://localhost:4242");

// ❌ WRONG — TypeScript casting hides the string from Vite's scanner
const API_BASE = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL;
// Result: Vite never sees it → always serves localhost:4242 in production
```

This applies in ALL files that use `VITE_API_URL`:
- `src/services/database/rest/RestAdapter.ts`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SetupWizard.tsx`
- `src/App.tsx`

**The `// @ts-ignore` is intentional and must not be removed.**

---

## ☠️ Known Failure Modes

### #1 — Raw `@tailwind` Directives in Output
```
Symptom: npm run build completes but CSS file is ~1400 bytes of literal @tailwind text
Root Cause: postcss.config.js or tailwind.config.js missing from project root
Fix: Ensure both files exist:
     postcss.config.js  →  plugins: { tailwindcss: {}, autoprefixer: {} }
     tailwind.config.js →  content: ["./index.html", "./src/**/*.{ts,tsx}"]
```

### #2 — TypeScript Build Fails (vitest imports)
```
Symptom: npm run build exits with TS error on *.test.ts files
Root Cause: vitest types not installed or tsconfig includes test files
Fix: Ensure vitest is in devDependencies
     Add to tsconfig.json:  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
```

### #3 — Vite Env Not Replaced in Bundle
```
Symptom: Production Docker container tries to connect to localhost:4242
Evidence: grep "localhost:4242" dist/assets/*.js returns matches
Root Cause: Type-cast used instead of exact import.meta.env.VITE_API_URL literal
Fix: See Critical section above — restore exact literal with // @ts-ignore
```

### #4 — HMR Not Working in Dev
```
Symptom: File changes in src/ don't hot-reload in browser
Fix: Ensure vite.config.ts has server.host: true for LAN access
     Confirm npm start is running (not npm run dev — that's Vite only, no API)
```

### #5 — API 404 in Dev Mode
```
Symptom: All /api/* calls return 404 or connection refused on port 4242
Root Cause: Running npm run dev (Vite only) instead of npm start (both servers)
Fix: Always use npm start for local development
```

---

## 🦞 Lobster Wisdom

*"The npm build is where the lobster grows its shell. If PostCSS doesn't run, the shell is gossamer — beautiful in source, invisible in production. Always verify the molt before deploying to the reef."*