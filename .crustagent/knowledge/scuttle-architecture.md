# 🛸 Scuttle Architecture©™

The **Scuttle Architecture** defines how PinchPad is launched, stopped, and deployed, ensuring total parity with the **ClawChives** ecosystem.

## 🚢 Port Configuration
PinchPad operates on a dual-port model to maintain separation between the Frontend UI and the Backend API:

| Environment | UI Port (8282) | API Port (8383) | Handler |
| :--- | :--- | :--- | :--- |
| **Development** | Vite Dev Server | Express + TSX | Hot-reloading enabled |
| **Production** | Vite Preview | Express + Node | High-performance static serving |

## 🚀 The Scuttle Command Set
- `npm run scuttle`: Launches the development environment. Starts both UI and API.
- `npm run scuttle:prod`: Executes a production build and launches the single-service preview.
- `npm run scuttle:stop`: Force-kills all processes on ports 8282 and 8383.
- `npm run scuttle:reset`: Stops all services and wipes the `dist/` directory.

## 🔒 Security Alignment
The architecture enforces strict security boundaries mirrored from ClawChives:
- **CORS**: 
  - Dev: Strictly `localhost` only.
  - Prod: Supports `localhost`, LAN (Private IP), and Cloudflare Tunnels via `CORS_ORIGIN`.
- **Helmet**: 
  - Strict HSTS and Content Security Policy (CSP).
  - Dev: Allows frame embedding for IDE previews.
  - Prod: Enforces `SAMEORIGIN` frame protection.
- **DB Encryption**: 
  - Uses `ShellCryption©™` via `better-sqlite3-multiple-ciphers`.
  - Automatic migration from plaintext to encrypted if `DB_ENCRYPTION_KEY` is provided.

## 🏗️ Docker Context
The Docker environment exposes **8383** as the primary API/UI unified port. The container runs a single Express process that serves the static assets from `dist/` and the API endpoints.

---
**Maintained by CrustAgent©™**
