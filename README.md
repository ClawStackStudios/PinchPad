# 🦞 PinchPad
<!-- hook test -->
<div align="center">

```
    ██████╗ ██╗███╗   ██╗ ██████╗██╗  ██╗██████╗  █████╗ ██████╗
    ██╔══██╗██║████╗  ██║██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗
    ██████╔╝██║██╔██╗ ██║██║     ███████║██████╔╝███████║██║  ██║
    ██╔═══╝ ██║██║╚██╗██║██║     ██╔══██║██╔═══╝ ██╔══██║██║  ██║
    ██║     ██║██║ ╚████║╚██████╗██║  ██║██║     ██║  ██║██████╔╝
    ╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═════╝
```

*Your Sovereign Scratchpad — where Humans and AI Lobsters collaborate to protect ideas.*

</div>

---

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Phase](https://img.shields.io/badge/Phase-3_Active-00cc66?style=for-the-badge)](#)

---

## 📜 Table of Contents

<details>
<summary>Unfurl the Scroll 📜</summary>

- [About](#-about)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with npm](#-running-with-npm)
  - [Running with Docker](#-running-with-docker)
- [Key System](#-key-system)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [Contributing](#-contributing)
- [Security](#-security)

</details>

---

## 📌 About

**PinchPad** is a privacy-first, self-hostable **note-taking** app designed for the Human-Agent ecosystem. It protects your notes with client-side encryption while allowing delegated, granular access to autonomous agents. No passwords, no accounts, no servers watching — just cryptographic keys and sovereign data.

- 🔒 **ClawKeys©™** — login with a decentralized identity key instead of passwords. Your `hu-` key is your passport.
- 🐚 **ShellCryption©™** — zero-knowledge AES-256-GCM encryption for all notes at rest. Only you can decrypt your thoughts.
- 🦞 **LobsterKeys©™** — Granular, revocable API keys for autonomous agents.
- 🗄️ **Secure Reef** — Persistent SQLite storage with multi-cipher encryption.
- 📦 **Selective Archival** — selective MD/HTML/JSON exports with automated Jewel (attachment) handling.
- 🌓 **MoltTheme** — View Transition-based theme engine. Watching the world shift colors.
- 🛡️ **SuperAdmin Panel** — Sovereign instance management via a metadata-only control plane at `/admin`. Configure system settings, retention policies, and monitor system health.


---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Client ["🌐 Browser"]
        UI[React / Tailwind UI]
        Auth["Auth Module<br/>SetupWizard + LoginForm"]
        Provider["DashboardContext<br/>useNotes() hook"]
        REST[RestAdapter]
        Theme[MoltTheme<br/>View Transition]
    end

    subgraph Server ["🖥️ server.ts (Express)"]
        API["REST API<br/>Port 8383 dev<br/>Port 8282 prod"]
        DB[(SQLite<br/>WAL Mode)]
    end

    UI --> Auth
    UI --> Theme
    UI --> Provider
    Provider --> REST
    REST -->|"fetch + Bearer token"| API
    API --> DB
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22+
- **npm** v10+
- **Docker & Docker Compose** *(for containerized deployment)*

---

### 🐚 Running with npm

<details>
<summary>Expand npm instructions</summary>

**Install dependencies first:**
```bash
npm install
```

**Development Commands (The Coral Nursery):**
- **Start Frontend + Backend**: `npm run scuttle:dev-start` (Frontend :8282, Backend :8383 w/ HMR)
- **Stop All**: `npm run scuttle:stop` (Graceful shutdown using SIGTERM)
- **Reset DB**: `npm run scuttle:reset-dev` (Scuttles dev reef)

---

**Production Commands (The Great Scuttle):**
- **Build & Start**: `npm run scuttle:prod-start` (API + Frontend on :8282)
- **Stop All**: `npm run scuttle:stop` (Graceful shutdown using SIGTERM)
- **Reset DB**: `npm run scuttle:reset` (DANGER: Deletes prod reef)

---

**Utility Scripts:**
- **Frontend Only**: `npm run dev` (Vite :8282 with HMR)
- **Backend Only**: `npm run dev:server` (Express :8383 with watch)
- **Build Bundle**: `npm run build`
- **Preview Build**: `npm run preview`

</details>

---

### 🐳 Running with Docker

<details>
<summary>Expand Docker instructions</summary>

**Environment Variables:**

```bash
# Default (edit in compose files if needed)
PORT=8282                    # Server listen port (single container)
NODE_ENV=production          # production or development
CORS_ORIGIN=http://yourdomain.com  # restrict CORS origin, or leave unset for open LAN
ADMIN_TOKEN=your-secret-token     # Optional: Enable SuperAdmin panel at /admin
ENABLE_SHELL_PROXY=true          # Optional: Enable public pearl sharing
SHELL_PROXY_RATE_LIMIT=60        # Optional: Public request limit (default: 60/15min)
```


**Option A: Production (Pull from GHCR) ⚓**
Use this for a stable, sovereign deployment. It pulls the latest pre-built image from the GitHub Container Registry.
```bash
docker compose up -d
```

**Option B: Development & Testing (Build Locally) 🛠️**
Use this if you are modifying the source code and want to test changes immediately.
```bash
docker compose -f docker-compose.dev.yml up -d --build
```

**Monitoring & Maintenance:**

- **View Logs**: `docker compose logs -f`
- **Stop Stack**: `docker compose down`
- **Healthcheck**: `curl http://localhost:8282/api/health`

> [!IMPORTANT]
> **Data Sovereignty & Persistence**:
> All notes and agent identities are stored in a local bind mount on your host system for maximum visibility and ease of backup.
> - **Path**: `./data/clawstack.db`
>
> You can directly copy or backup this file. If it doesn't exist, Docker will create it when the container starts.

</details>

---

## 🔑 Key System

PinchPad uses a **prefix-based identity token system** — no passwords, no usernames stored on a server. Your key file is your identity.

| Prefix | Type | Length | Usage |
|---|---|---|---|
| `hu-` | **Human Key** | 64 chars | Your personal identity. Hashed SHA-256, stored securely. |
| `lb-` | **Lobster/Agent Key** | 64 chars | For your AI agents. Granular permissions (canRead, canWrite, canDelete, canEdit). |
| `api-` | **Session Token** | 32 chars | Short-lived REST API bearer. 24h TTL. Issued via `POST /api/auth/token`. |

> [!CAUTION]
> Your `hu-` key is the **only** way to access your PinchPad. Keep it safe. If you lose it, it cannot be recovered. Back it up somewhere secure.

---

## 🔌 API Reference

> All endpoints except `/api/health`, `/api/auth/register`, `/api/auth/token`, `/api/admin/auth`, `/api/admin/verify`, `/api/admin/logout`, and `/api/photos/:id` require a valid `Authorization: Bearer <api-token>` header.

<details>
<summary>View full API endpoint table</summary>

| Method | Endpoint | Auth | Permission | Description |
|---|---|---|---|---|
| **Authentication** | | | | |
| `POST` | `/api/auth/register` | No | - | Create new identity key |
| `POST` | `/api/auth/token` | No | - | Issue `api-` token from `hu-` or `lb-` key (plaintext or SHA-256 keyHash) |
| `GET` | `/api/auth/validate` | Yes | - | Fast bearer token validity check |
| `GET` | `/api/auth/verify` | Yes | - | Fetch authenticated user configuration and metadata |
| `POST` | `/api/auth/logout` | Yes | - | Revoke session and clear cookies |
| **Pearls (Notes) CRUD** | | | | |
| `GET` | `/api/notes` | Yes | canRead | List and filter all notes (supports limit/offset pagination) |
| `POST` | `/api/notes` | Yes | canWrite | Create a new encrypted note |
| `PUT` | `/api/notes/:id` | Yes | canEdit | Update an existing encrypted note |
| `DELETE` | `/api/notes/:id` | Yes | canDelete | Delete a note and clean up associated assets |
| `GET` | `/api/notes/counts` | Yes | - | Fetch dashboard count badges for notes, pots, and starred states |
| `POST` | `/api/notes/bulk` | Yes | canWrite | Bulk sync/import multiple notes (rate-limit bypassed) |
| `GET` | `/api/notes/export` | Yes | canRead | Generate a comprehensive ZIP archive of notes (MD/HTML/JSON) |
| `PATCH` | `/api/notes/:id/starred` | Yes | canEdit | Toggle a note's starred status |
| `PATCH` | `/api/notes/:id/pinned` | Yes | canEdit | Toggle a note's pinned status |
| **Pots (Folders) CRUD** | | | | |
| `GET` | `/api/pots` | Yes | canRead | List all pots (folders) |
| `POST` | `/api/pots` | Yes | canWrite | Create a new pot (with title and color) |
| `PATCH` | `/api/pots/:id` | Yes | canEdit | Update a pot's title or color |
| `DELETE` | `/api/pots/:id` | Yes | canDelete | Cascade delete a pot and all notes inside it |
| **Photos (Attachments)** | | | | |
| `POST` | `/api/photos/upload` | Yes | canWrite | Upload a note photo attachment (multipart/form-data) |
| `GET` | `/api/photos/:id` | No | - | Fetch raw photo binary (accessible to decoders) |
| `DELETE` | `/api/photos/:id` | Yes | canDelete | Permanently delete a photo attachment from the server |
| **Agent Key Management** | | | | |
| `GET` | `/api/agents` | Yes | human-only | List all configured agent keys (`lb-`) |
| `POST` | `/api/agents` | Yes | human-only | Create a new agent key (`lb-`) with granular permissions |
| `PUT` | `/api/agents/:id/revoke` | Yes | human-only | Revoke an agent key (sets active = 0) |
| `DELETE` | `/api/agents/:id` | Yes | human-only | Permanently delete an agent key from the database |
| **Lobster Agent Sessions** | | | | |
| `POST` | `/api/lobster-session/start` | Yes | human-only | Initiate an interactive agent session |
| `POST` | `/api/lobster-session/:id/close` | Yes | human-only | Terminate an active agent session |
| **SuperAdmin Panel** | | | | |
| `POST` | `/api/admin/auth` | No | - | Admin login (gated by `ADMIN_TOKEN`, returns secure cookie) |
| `GET` | `/api/admin/verify` | No | - | Verify admin session validity (via cookie or header) |
| `POST` | `/api/admin/logout` | No | - | Logout admin session and clear credentials |
| `GET` | `/api/admin/users` | Yes | admin-only | List user metadata, storage metrics, and login logs |
| `DELETE` | `/api/admin/users/:uuid` | Yes | admin-only | Cascade scuttle a user and all their notes/photos/keys |
| `GET` | `/api/admin/system` | Yes | admin-only | Get real-time system stats, database file size, and uptime |
| `GET` | `/api/admin/audit` | Yes | admin-only | Query security and event audit logs (filtered & paginated) |
| `GET` | `/api/admin/uptime` | Yes | admin-only | Fetch historical uptime session logs and crash metrics |
| `GET` | `/api/admin/settings` | Yes | admin-only | Get dynamic global settings (retention days, etc.) |
| `PATCH` | `/api/admin/settings` | Yes | admin-only | Update global system settings dynamically |
| **System & Skills** | | | | |
| `GET` | `/api/health` | No | - | API service health check |
| `GET` | `/skill.md` | No | - | Fetch public agent instructions membrane (`SKILL.md`) |

</details>

---

## 🛡️ SuperAdmin Panel & System Settings

PinchPad includes an opt-in **SuperAdmin Control Plane** mounted at `/admin`. This panel provides a "God-view" into the system topology without revealing sensitive decrypted pearl contents.

### Features
- **Health Monitoring:** Track total users, total pearls, db size, and exact Server Uptime (with session history metrics).
- **User Management:** Scuttle malicious or orphaned identities permanently from the server.
- **Audit Logs:** Monitor security anomalies, unauthorized access attempts, and authentication spikes.
- **Retention Policies:** Dynamically configure database retention directly from the UI dropdown in the header:
  - `Audit Logs`: 30, 60, or 90 days.
  - `Uptime History`: 30, 60, or 90 days.

### How to Enable

1. Generate a secure token (e.g., `openssl rand -base64 48`).
2. Add it to your `.env` or `docker-compose.yml`:
   ```bash
   ADMIN_TOKEN="your_secure_token_here"
   ```
3. Restart PinchPad.
4. Navigate to `/admin`. You will be prompted to log in using the `ADMIN_TOKEN`.

> [!NOTE]  
> If `ADMIN_TOKEN` is unset or removed, the `/admin` UI and API routes are completely disabled and will return 404s.

---

## 📂 Project Structure

See [BLUEPRINT.md](./BLUEPRINT.md) for the full ASCII construction diagram.

```
PinchPad/
├── src/
│   ├── server/                 # Backend (Express + SQLite)
│   │   ├── db.ts               # Schema & migrations
│   │   ├── middleware/         # Auth, permission gates
│   │   ├── routes/             # API endpoints
│   │   └── utils/              # Crypto, token helpers
│   ├── components/             # Feature-scoped UI
│   │   ├── auth/               # LoginForm + SetupWizard
│   │   ├── dashboard/          # Main note grid + sidebar
│   │   ├── notes/              # Note editor + viewer
│   │   └── ui/                 # shadcn/ui base components
│   ├── services/               # Business logic
│   │   ├── authService.ts      # Key generation, hashing
│   │   ├── noteService.ts      # Note CRUD
│   │   ├── agentService.ts     # Agent key management
│   │   └── types/              # Shared TypeScript interfaces
│   └── lib/                    # Utilities
│       ├── crypto.ts           # SHA-256, AES-256-GCM, UUID
│       └── utils.ts            # Helpers
├── test/                       # Test suite (140 tests, Vitest)
│   ├── server/                 # Backend integration tests
│   ├── services/               # Service unit tests
│   ├── lib/                    # Utility tests
│   └── shared/                 # Test fixtures + setup
├── Dockerfile                  # Single-container image
├── docker-compose.yml          # Prod: pull from GHCR
├── docker-compose.dev.yml      # Dev: build locally
├── server.ts                   # Express entry point
├── vite.config.ts              # Bundler config
├── tailwind.config.js          # Design tokens
└── package.json                # Dependencies & scripts
```

---

## 🛠️ Available Scripts

| Script | Description |
|---|---|
| `npm run scuttle:dev-start` | 🦞 Start both Frontend + Backend concurrently (dev mode) |
| `npm run scuttle:stop` | Gracefully kill all node services via SIGTERM |
| `npm run scuttle:prod-start` | Build + start production server (:8282) |
| `npm run scuttle:reset` | Scuttle the production database (DANGER) |
| `npm run scuttle:reset-dev` | Scuttle the development database |
| `npm run dev` | Vite frontend dev server (:8282 with HMR) |
| `npm run dev:server` | Express backend dev server (:8383 with watch) |
| `npm run build` | Vite production build → `dist/` |
| `npm run preview` | Serve the production `dist/` locally |
| `npm run lint` | TypeScript type-check (tsc --noEmit) |
| `npm test` | Run all 140 tests (Vitest) |
| `npm run test:watch` | Watch mode for tests |
| `npm run test:coverage` | Coverage report (threshold: middleware 100%, routes >75%) |

---

## 🔐 Database Encryption (SQLCipher)

PinchPad supports **full SQLite database encryption at rest** using SQLCipher (AES-256-CBC). This protects the entire database file on disk, preventing unauthorized access to users, tokens, notes, and agent keys even if the host filesystem is compromised.

### Enabling Database Encryption

**Generate a 256-bit encryption key:**
```bash
openssl rand -base64 32
Output: → K7fGh2mNpQrXvYzA1bCdEfJkLnOpStUw+Xy9012/3==
```

**For npm development:**
Add the key to `.env.local`:
```bash
DB_ENCRYPTION_KEY=K7fGh2mNpQrXvYzA1bCdEfJkLnOpStUw+Xy9012/3==
npm run scuttle:dev-start
```

**For Docker deployment:**
Uncomment and set the key in `docker-compose.yml` or `docker-compose.dev.yml`:
```yaml
environment:
  - DB_ENCRYPTION_KEY=K7fGh2mNpQrXvYzA1bCdEfJkLnOpStUw+Xy9012/3==
docker compose up -d
```

### Important Notes

- **Key is required in production.** If `DB_ENCRYPTION_KEY` is not set, the database is stored in plaintext. The app will log a warning on startup. While you can run without encryption for production. It is highly advised and much more secure to run with encryption enabled.
- **First-run migration:** If you have an existing unencrypted database and set the key, PinchPad will automatically encrypt it on the next boot.
- **Key rotation:** There is no built-in key rotation mechanism. If you need to change the key, export the plaintext database, drop the old encrypted file, and re-import with the new key.

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

## 🛡️ Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting and key security practices.

---

<div align="center">

```text
       _..._
     .'     '.      HATCH YOUR PINCHPAD.
    /  _   _  \     PROTECT YOUR IDEAS.
    | (q) (p) |     PUNCH THE CLOUD.
    (_   Y   _)
     '.__W__.'
     Maintained by CrustAgent©™
```

</div>
