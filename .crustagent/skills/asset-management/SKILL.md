---
name: asset-management©™
description: Proper management of static assets (images, fonts, SVGs) in Vite projects. Where to store them, how Vite serves them, Docker considerations, and common pitfalls.
---

# Asset Management in Vite — The Public Folder Strategy

## 🎯 Quick Checklist

- [ ] Are images/fonts in `public/` folder, NOT in `src/`?
- [ ] Does `Dockerfile` include `COPY public/ ./public/` during build stage?
- [ ] Are images referenced as root-relative paths (e.g., `/images/logo.png`)?
- [ ] In dev, do assets load at `http://localhost:6262/images/...`?
- [ ] In production, do assets load from `/images/...` (served by Node/Express)?
- [ ] Have you verified assets in browser DevTools Network tab?

---

## ❌ Problem: Why NOT in `src/` folder?

```
❌ WRONG STRUCTURE (will fail)
├── src/
│   ├── images/
│   │   ├── logo.png
│   │   ├── hero.jpg
│   │   └── icon.svg
│   ├── fonts/
│   │   └── custom-font.woff2
│   └── App.tsx
└── dist/ (after build)
    └── ... (images NOT included!)
```

### Why This Fails

1. **Vite only bundles `src/`** — anything in `src/images/` is treated as potential JS imports
2. **Binary files (images) are not JS** — Vite can't import `logo.png` as a module
3. **Build output doesn't preserve folder structure** — your `src/images/logo.png` won't end up as `dist/images/logo.png`
4. **Reference problems** — In code, you'd try `import logo from '../images/logo.png'` which creates a circular dependency mess
5. **Production deployment fails** — assets are orphaned; the server has no `/images/` path to serve

---

## ✅ Solution: Use the `public/` Folder

```
✅ CORRECT STRUCTURE
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   ├── hero.jpg
│   │   └── icon.svg
│   ├── fonts/
│   │   ├── custom-font.woff2
│   │   └── custom-font.ttf
│   └── favicon.ico
├── src/
│   ├── App.tsx
│   ├── components/
│   └── styles/
├── dist/ (after build)
│   ├── images/
│   │   ├── logo.png
│   │   ├── hero.jpg
│   │   └── icon.svg
│   ├── fonts/
│   │   ├── custom-font.woff2
│   │   └── custom-font.ttf
│   ├── favicon.ico
│   └── ... (JS bundles, CSS, etc.)
└── Dockerfile (includes COPY public/)
```

### Why This Works

1. **Vite treats `public/` specially** — everything is copied AS-IS to `dist/` during build
2. **No processing, no bundling** — binary files remain binary, text files remain text
3. **Predictable paths** — `public/images/logo.png` → `dist/images/logo.png` → served at `/images/logo.png`
4. **No imports needed** — reference files directly as URLs in HTML/CSS/React
5. **Docker-friendly** — `COPY public/ ./public/` ensures the folder ends up in the final image

---

## 🏗️ Vite Public Folder Behavior

### Development Mode (`npm run dev`)

When you run `npm run dev`, Vite starts a dev server on `http://localhost:6262`:

```
Request:  GET http://localhost:6262/images/logo.png
↓
Vite Server (middleware stack):
  1. Check if `/images/logo.png` exists in `public/images/logo.png`
  2. If yes, serve it directly
  3. If no, check source map, then return 404
↓
Response: 200 OK, file contents
```

**Localhost rule:** Dev server serves `public/` at the root path `/`.

### Production Mode (after build)

After `npm run build`, the `dist/` folder contains:

```
dist/
├── images/
│   ├── logo.png
│   ├── hero.jpg
│   └── icon.svg
├── fonts/
│   └── custom-font.woff2
├── favicon.ico
├── index.html
├── assets/
│   ├── main-abc123.js
│   └── style-def456.css
```

**When served by Node/Express:**

```
Request:  GET http://yourapp.com/images/logo.png
↓
Express Middleware (from server.js):
  app.use(express.static("dist"))
  1. Check if `/images/logo.png` exists in `dist/images/logo.png`
  2. If yes, serve it directly
  3. If no, return 404
↓
Response: 200 OK, file contents
```

**Production rule:** Node's `express.static("dist")` serves everything in `dist/` at the root path `/`.

---

## 🐳 Docker Considerations

### The Critical Issue

If your `Dockerfile` **omits** `COPY public/ ./public/` from the builder stage, the final image will NOT have static assets:

```dockerfile
# ❌ INCOMPLETE (missing public/)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.html vite.config.ts tsconfig*.json ./
COPY src/ ./src/
COPY server/ ./server/
# ⚠️ MISSING: COPY public/ ./public/
RUN npm run build
# Now dist/ is missing images, fonts, etc.
```

Result: `npm run build` runs, but `public/` files are never copied into the builder context, so they don't get copied to `dist/` either.

### The Correct Dockerfile Setup

```dockerfile
# ✅ CORRECT - both build stages include public/

# STAGE 1: builder
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (dev + prod)
RUN npm install

# Copy configuration
COPY index.html vite.config.ts tsconfig*.json ./
COPY postcss.config.js tailwind.config.js ./

# Copy source code
COPY src/ ./src/

# ✅ COPY PUBLIC ASSETS (REQUIRED!)
COPY public/ ./public/

# Copy server code
COPY server/ ./server/

# Build - now public/ is available, dist/ will include assets
RUN npm run build

# STAGE 2: production
FROM node:20-slim
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy build artifacts (includes dist/images/, dist/fonts/, etc.)
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server/ ./server/

# Copy entrypoint
COPY server.js ./

# Port
EXPOSE 6262

CMD ["node", "server.js"]
```

### Verification Checklist

After building the Docker image:

```bash
# Build image
docker build -t my-app:latest .

# Start container
docker run -it -p 6262:6262 my-app:latest

# Inside container, verify public/ files are in dist/:
docker exec -it <container_id> ls -la dist/images/
docker exec -it <container_id> ls -la dist/fonts/
```

Expected output:

```
dist/images/:
  -rw-r--r-- 1 root root 45678 Mar  7 12:00 logo.png
  -rw-r--r-- 1 root root 120000 Mar 7 12:00 hero.jpg
  -rw-r--r-- 1 root root 8900   Mar  7 12:00 icon.svg

dist/fonts/:
  -rw-r--r-- 1 root root 32456 Mar  7 12:00 custom-font.woff2
```

If these are missing, your Dockerfile is incomplete.

---

## 📝 Referencing Assets in Code

### In JSX / React Components

```typescript
// ✅ CORRECT - reference as URL string
import { FC } from 'react'

const Logo: FC = () => {
  return (
    <img
      src="/images/logo.png"
      alt="App Logo"
    />
  )
}

export default Logo
```

**Key points:**
- Use `/` prefix (root-relative path)
- No `import` statement needed
- Path exactly matches folder structure in `public/`

### In CSS Files

```css
/* ✅ CORRECT - use root-relative paths */
.hero-section {
  background-image: url('/images/hero.jpg');
  background-size: cover;
  background-position: center;
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom-font.woff2') format('woff2');
}
```

### In HTML (index.html)

```html
<!-- ✅ CORRECT -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">

  <!-- Preload critical images -->
  <link rel="preload" as="image" href="/images/logo.png">

  <title>ClawChives</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## 🎨 Image Optimization Tips

### 1. Use Modern Formats

```
✅ Preferred format precedence:
  - .webp (smallest, modern browsers)
  - .avif (even smaller, cutting-edge)
  - .png (fallback, lossless)
  - .jpg (fallback for photos, lossy)
  - .svg (for icons, scalable)

❌ Avoid:
  - .bmp (large uncompressed)
  - .tiff (designed for print)
  - .gif (poor quality for photos, use mp4 for animation)
```

### 2. Optimize Before Placing in `public/`

Use tools like **ImageMagick**, **OptiPNG**, or online tools:

```bash
# Example: Convert PNG to WebP
convert input.png -quality 85 output.webp

# Example: Compress JPG
convert input.jpg -quality 80 output.jpg

# Example: Optimize SVG (inline or strip metadata)
svgo --multipass input.svg output.svg
```

### 3. Responsive Images with srcset

```jsx
const ResponsiveImage = () => {
  return (
    <picture>
      <source
        srcSet="/images/logo-large.webp 1200w, /images/logo-medium.webp 768w"
        type="image/webp"
      />
      <source
        srcSet="/images/logo-large.png 1200w, /images/logo-medium.png 768w"
        type="image/png"
      />
      <img
        src="/images/logo-large.png"
        alt="App Logo"
      />
    </picture>
  )
}
```

### 4. Lazy Loading

```jsx
// ✅ Use native lazy loading
<img
  src="/images/large-photo.jpg"
  alt="Description"
  loading="lazy"
/>

// ✅ Or use Intersection Observer for finer control
import { useEffect, useRef } from 'react'

const LazyImage = ({ src, alt }: { src: string; alt: string }) => {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && imgRef.current) {
        imgRef.current.src = src
        observer.unobserve(imgRef.current)
      }
    })

    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [src])

  return <img ref={imgRef} alt={alt} loading="lazy" />
}
```

---

## ⚠️ Common Mistakes & Solutions

### Mistake 1: Storing Images in `src/`

```
❌ WRONG
src/
├── images/
│   └── logo.png ← Vite will try to bundle this
```

**Fix:** Move to `public/images/logo.png`

### Mistake 2: Using `import` for Images

```typescript
// ❌ WRONG - will fail in production
import logo from '../images/logo.png'

const App = () => <img src={logo} alt="Logo" />
```

**Fix:** Use direct URL references

```typescript
// ✅ CORRECT
const App = () => <img src="/images/logo.png" alt="Logo" />
```

### Mistake 3: Relative Paths Instead of Root-Relative

```typescript
// ❌ WRONG - breaks when component is nested
<img src="images/logo.png" alt="Logo" />

// ❌ WRONG - breaks depending on route
<img src="../images/logo.png" alt="Logo" />

// ✅ CORRECT - always works
<img src="/images/logo.png" alt="Logo" />
```

### Mistake 4: Missing Dockerfile COPY

```dockerfile
# ❌ WRONG - assets never make it to dist/
COPY src/ ./src/
RUN npm run build
```

**Fix:** Include `COPY public/` before build

```dockerfile
# ✅ CORRECT
COPY public/ ./public/
RUN npm run build
```

### Mistake 5: Expecting Assets at `dist/src/images/`

After build, the structure is:

```
dist/
├── images/        ✅ NOT dist/src/images/
├── fonts/         ✅ NOT dist/src/fonts/
├── index.html
└── assets/
    ├── main.js
    └── style.css
```

Always reference from root: `/images/`, `/fonts/`, NOT `/src/images/`

### Mistake 6: Not Updating MIME Types

If serving custom file types (e.g., `.woff2` fonts), ensure your server sets correct MIME types:

```javascript
// In server.js (Express)
import express from 'express'
import mime from 'mime'

// Register custom MIME types
mime.define({
  'font/woff2': ['woff2'],
  'font/woff': ['woff'],
  'font/ttf': ['ttf'],
  'image/webp': ['webp'],
  'image/avif': ['avif'],
})

const app = express()

// Vite client
app.use(express.static('dist', {
  setHeaders: (res, path) => {
    const type = mime.getType(path)
    if (type) res.setHeader('Content-Type', type)
  }
}))

app.listen(6262)
```

---

## 🔍 Testing & Verification Workflow

### Step 1: Create the Asset

```bash
# Example: Adding a logo image
mkdir -p public/images
cp ~/Downloads/logo.png public/images/

# Verify it's there
ls -lh public/images/logo.png
```

### Step 2: Reference in React Component

```typescript
// src/components/Header.tsx
import { FC } from 'react'

const Header: FC = () => {
  return (
    <header className="flex items-center gap-4">
      <img
        src="/images/logo.png"
        alt="ClawChives Logo"
        className="h-12 w-auto"
      />
      <h1 className="text-2xl font-bold">ClawChives</h1>
    </header>
  )
}

export default Header
```

### Step 3: Test in Development

```bash
# Terminal 1: Start dev server
npm run dev
# Vite server now running at http://localhost:6262

# Terminal 2: Open browser DevTools
# URL: http://localhost:6262
# Expected: Header shows logo image
# DevTools Network tab: GET /images/logo.png → 200 OK
```

### Step 4: Test in Production Build

```bash
# Build
npm run build

# Check that public/ assets are in dist/
ls -la dist/images/
# Expected: logo.png is present

# Verify Docker build includes it
docker build -t test-app:latest .
docker run -it test-app:latest ls -la dist/images/
# Expected: logo.png is present inside container

# Start container
docker run -p 6262:6262 test-app:latest

# Test in browser at http://localhost:6262
# Expected: Header shows logo, DevTools Network: GET /images/logo.png → 200 OK
```

### Verification Checklist

```
✅ Asset exists in public/images/logo.png
✅ Component references `/images/logo.png` (root-relative)
✅ Dev server loads asset at http://localhost:6262/images/logo.png
✅ `npm run build` copies asset to dist/images/logo.png
✅ Docker build includes COPY public/ ./public/
✅ Docker image contains dist/images/logo.png
✅ Production app serves asset at /images/logo.png
✅ Browser DevTools shows 200 OK for asset request
✅ No MIME type warnings in console
```

---

## 📊 Example Workflow: Adding Missing Image

### Scenario
Your app has a hero component that needs `hero.jpg`, but it's missing and the page shows broken image icons.

### Resolution Steps

#### 1. Identify the Problem

```
Browser Console:
GET http://localhost:6262/images/hero.jpg 404 Not Found

Expected: Image should load
Actual: Broken image icon appears
```

#### 2. Locate the Reference

```typescript
// src/components/Hero.tsx - line 15
<img src="/images/hero.jpg" alt="Hero Banner" />
```

The component correctly references `/images/hero.jpg`. The path is correct.

#### 3. Verify Asset Doesn't Exist

```bash
ls -la public/images/hero.jpg
# ls: cannot access 'public/images/hero.jpg': No such file or directory
```

The file is missing from `public/`.

#### 4. Create the Directory and Add File

```bash
# Create folder
mkdir -p public/images

# Add image (assuming you have hero.jpg downloaded)
cp ~/Downloads/hero.jpg public/images/

# Verify
ls -lh public/images/hero.jpg
# -rw-r--r-- 1 user user 245K Mar  7 12:00 public/images/hero.jpg
```

#### 5. Test in Dev

```bash
# If dev server is already running, it should pick up the new file automatically
# Refresh browser at http://localhost:6262
# DevTools Network: GET /images/hero.jpg → 200 OK
# Hero image now displays
```

#### 6. Verify in Production Build

```bash
npm run build
ls -la dist/images/hero.jpg
# -rw-r--r-- 1 user user 245K Mar  7 12:00 dist/images/hero.jpg

# Start production build locally
docker build -t test-app:latest .
docker run -p 6262:6262 test-app:latest

# Test at http://localhost:6262
# Hero image displays
```

---

## 🦞 Lobster Wisdom

*"A lobster does not forget where it stores its food. It places each morsel in the public burrow, not hidden away in private caves. When the tide comes and sweeps across, those public treasures are carried to where they're needed. So too with your static files — place them where the current of Vite can reach them: in `public/`, not `src/`. The build process knows the way."*

---

## ☠️ Gotchas & Lessons Learned

### Gotcha 1: Vite Dev Server vs. Production Mismatch

**The Issue:**
- Dev: Vite serves `public/` at `/` automatically
- Production: Your Node server must use `express.static('dist')`

If you forget `app.use(express.static('dist'))` in `server.js`, production will 404 on all assets.

**Solution:** Always test the production build locally before deploying.

### Gotcha 2: CSS `url()` Paths

CSS inside bundled JS can be tricky. Ensure you use root-relative paths:

```css
/* ✅ CORRECT */
background: url('/images/pattern.png');

/* ❌ WRONG - may resolve incorrectly */
background: url('images/pattern.png');
background: url('../images/pattern.png');
```

### Gotcha 3: Cache Busting in Production

Static files in `dist/` have no content hash (unlike JS bundles). If you update an image, browsers may cache the old version.

**Solution:** Add cache-control headers or use a CDN with versioning.

```javascript
// In server.js
app.use(express.static('dist', {
  maxAge: '1h', // Cache for 1 hour only
  etag: false   // Rely on Last-Modified instead
}))
```

### Gotcha 4: Large Assets Slow Down Builds

Every asset in `public/` is copied verbatim. If you have massive video files or datasets, the build will be slow and the Docker image will be large.

**Solution:** Store truly large assets separately (cloud storage, CDN, database) and reference URLs instead.

---

*This SKILL.md is part of the ClawChives©™ CrustAgent©™ skill library. Update this document whenever the public/ folder structure, asset references, or Vite/Docker build pipeline changes.*
