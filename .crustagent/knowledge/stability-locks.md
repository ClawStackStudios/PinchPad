# Project Knowledge & Stability Locks

This document maintains the detailed stability locks and architectural constraints that ensure ShellPlate remains robust. These are maintained as CrustAgent knowledge.

## Networking & Ports
- **Port Standardization**: The canonical application port string is `5757` across the Vite Dev Server, Express proxy target, and Docker container exposure.

## Database & SQLite
- **SQLite Constraints**: Always catch `SQLITE_CONSTRAINT_UNIQUE` in Express routes to prevent `500 Internal Server Error` crashes. Gracefully return a `409 Conflict` (e.g., for duplicate usernames or ClawKeys).

## Build & Test Configuration
- **Vite/Vitest Config**: When adding Vitest configurations to `vite.config.ts`, avoid using `import { defineConfig } from 'vitest/config'` as it creates type conflicts with `@vitejs/plugin-react`. Instead, use intersection types on the base Vite config object: `as UserConfig & { test: any }` to maintain strict typing elsewhere without breaking Vite's plugin layer.
