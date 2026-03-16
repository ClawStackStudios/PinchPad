# Sovereign Stack Recipes — PinchPad©™

This skill contains verified "Stability Locks" for the PinchPad codebase. Follow these patterns strictly to maintain CrustCode©™ standards and prevent codebase sprawl.

## 🧪 Testing Patterns (Vitest 4.1.0)
- **Test Structure**: `test/` directory (sibling to `src/`), organized as `test/[domain]/[feature].lobster.test.ts`
  - Test files: `test/lib/crypto.lobster.test.ts`, `test/services/authService.lobster.test.ts`, `test/server/routes/auth.lobster.test.ts`, etc.
  - Setup: `test/shared/setup.lobster.ts` (minimal crypto initialization)
  - Factory: `test/shared/app.ts` provides `createTestApp()`, `createTestUser()`, `createTestToken()`, `createTestLobsterKey()`
- **Backend**: Use `supertest` for route testing via `createTestApp()`. Test real routes, not mocks.
  - Isolated DBs: Each test file gets its own `:memory:` database (zero cross-test pollution)
  - No direct `db.ts` imports: Use `createTestApp().db` instead
- **Middleware**: Unit test direct middleware calls with mocked `req`/`res`. HTTP tests via `supertest`.
- **Coverage Targets**: Middleware 100%, Routes >75%, Tests 140+ assertions across 9 files

## 🎨 UI & Components (React 19 + Tailwind 4)
- **Architecture**: Feature-based clusters in `src/pages/` and `src/components/`
  - Feature pages: `src/pages/Auth/`, `src/pages/Notes/`, `src/pages/Agents/`, `src/pages/Settings/`, `src/pages/Dashboard/`
  - Layout: All authenticated routes wrapped in `DashboardLayout` (Sidebar + Main structure)
  - Shared: `src/components/` for reusable UI (Navbar, DashboardLayout, Sidebar, AppHeader, Modals, Theme)
- **Styling**: Vanilla Tailwind utility classes only. Use MoltTheme for view transitions.
- **Conditional Classes**: Use the `cn()` utility (`src/lib/utils.ts`) for class composition.
- **Theme Integration**: Light/dark mode via ThemeContext, stored in localStorage

## 🛤️ API & Routing (Express + TSX)
- **Routes**: `src/server/routes/auth.ts`, `src/server/routes/notes.ts`, `src/server/routes/agents.ts`
  - Auth: register, token, verify, logout (public + session-gated)
  - Notes: CRUD with ShellCryption™ (canRead/canWrite/canEdit/canDelete permissions)
  - Agents: Lobster Key CRUD with granular permissions and revocation
- **Middleware**: `src/server/middleware/auth.ts` provides `requireAuth`, `requirePermission`, `requireHuman`
  - `requireAuth`: Extracts + validates API token (Bearer header), attaches `req.user`
  - `requirePermission('canWrite')`: Ensures human OR lobster with permission
  - `requireHuman`: Blocks lobster keys, humans only
- **Services**: `src/services/` contain business logic (authService, agentService, noteService)
  - No direct route logic: All queries/updates go through services
- **Contracts**: All endpoints documented in `truthpack/contracts.json`. Update before implementing.
- **Error Handling**: Return `{ error: "message" }` with appropriate status codes (401, 403, 404, 500)

## 🔐 Security & Crypto (ClawKeys™ Protocol)
- **Session Tokens**: `api-<base62[32]>` format, 24h expiration
- **ClawKeys™**: `hu-<base62[64]>` generated client-side, hashed on server (SHA-256)
- **LobsterKeys™**: `lb-<base62[64]>` (revocable API keys), stored with permissions JSON
- **ShellCryption™**: AES-256-GCM for note title/content, keys stored hashed
- **Token Storage**: `api_tokens` table with TTL-based auto-delete; FK cascade on user delete

## 💾 Database (SQLite + better-sqlite3)
- **Schema**: Defined in `src/server/db.ts`, initialized on server startup
  - Tables: `users`, `api_tokens`, `notes`, `lobster_keys`, `shared_note_access`
  - Constraints: Foreign keys ON, WAL mode, UNIQUE(username), UNIQUE(key_hash)
- **Prepared Statements**: Use `db.prepare()` for all queries (better-sqlite3 synchronous API)
- **Transactions**: Use `db.transaction()` for multi-step operations (create user + token, revoke key + delete tokens)
- **Testing**: Use `:memory:` databases per test file via `createTestApp()`

## 🚀 npm Scripts
```bash
npm run dev              # Vite frontend (port 8282)
npm run dev:server      # tsx server (port 8383) with --watch
npm run scuttle:dev-start  # Both in parallel (&)
npm run build           # Vite production build
npm test                # vitest run (140 tests)
npm run test:coverage   # v8 coverage report
npm run test:watch      # vitest watch mode
```

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
Maintained by CrustAgent©™