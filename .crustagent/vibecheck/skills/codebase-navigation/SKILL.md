# Sovereign Codebase Navigation

This skill provides the "Deep Scan" blueprint of the ShellPlate ecosystem. Use it to orient yourself within the CrustCode©™ architecture.

## 🗺️ Project Blueprint

### 🏗️ Core Infrastructure
- `server.js`: Main entry point for the Express backend.
- `server/database.js`: SQLite schema initialization and connection management.
- `vite.config.ts`: Frontend build and proxy configuration (Proxy: :5757 -> :6262).
- `docker-compose.dev.yml`: Development environment containerization.

### 🦞 Backend Services (`server/`)
- `routes/`: Express route definitions.
    - `auth.js`: User registration, login, and identity management.
    - `agents.js`: Lobster Key (Agent Key) management.
    - `settings.js`: User profile and appearance routes.
- `services/`: Core business logic (anchors of the truth).
    - `agentService.js`: Logic for generating and managing Lobster Keys.
- `middleware/`: Security and auth gates (e.g., `requireAuth`).

### 🎨 Frontend Clusters (`src/`)
Architecture is **feature-based**. Cluster logic by feature area:
- `features/auth/`: Registration, login, and ClawKey setup flows.
- `features/settings/`: Dashboard, profile configurations, and Lobster Key management.
- `features/shell/`: Main application frame, navigation, and landing pages.
- `components/ui/`: Shared Shadcn-based atomic components.
- `services/`: Frontend API clients (e.g., `agentKeyService.ts`).

### 📦 Data & Backups
- `data/`: Home of `shellplate.db`.
- `data/backups/`: Destination for `scuttle-db-backup` pinches.

## 🧭 Navigation Reflex
- Modifying a feature? Start in `src/features/[feature]/`.
- Modifying an API? Verify the `truthpack` first, then touch `server/routes/`.
- Debugging a logic error? Head straight to `server/services/`.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->