# Sovereign Codebase Navigation — PinchPad©™

This skill provides the "Deep Scan" blueprint of the PinchPad ecosystem. Use it to orient yourself within the CrustCode©™ architecture.

## 🗺️ Project Blueprint

### 🏗️ Core Infrastructure
- `server.ts`: Main entry point for Express backend (imports routes, middleware, db)
- `src/server/db.ts`: SQLite schema initialization, database connection, test utilities
- `vite.config.ts`: Frontend build config, React plugin, proxy (`:8282` → `:8383`)
- `vitest.config.ts`: Test framework config, glob patterns (`test/**/*.lobster.test.ts`), coverage settings
- `.github/workflows/docker-publish.yml`: CI/CD for GitHub Actions (run tests, then build/push image)

### 🦞 Backend Architecture (`src/server/`)
**Routes** (`routes/`):
- `auth.ts`: User registration, token generation, token verification, logout
  - `POST /api/auth/register`: Create new user with ClawKey™ hash
  - `POST /api/auth/token`: Generate session token (returns `api-` prefixed token)
  - `GET /api/auth/verify`: Verify current token, return user info
  - `POST /api/auth/logout`: Invalidate token, delete from DB
- `notes.ts`: Note CRUD with ShellCryption™ and permission gates
  - `GET /api/notes`: List user's notes (filters by `user_uuid`)
  - `POST /api/notes`: Create note (requires `canWrite`)
  - `PUT /api/notes/:id`: Update note (requires `canEdit`)
  - `PATCH /api/notes/:id`: Toggle starred/pinned (requires `canWrite`)
  - `DELETE /api/notes/:id`: Delete note (requires `canDelete`)
- `agents.ts`: LobsterKey™ CRUD for API key management
  - `GET /api/agents`: List user's API keys (requires human only)
  - `POST /api/agents`: Create new API key with permissions (requires human)
  - `PUT /api/agents/:id/revoke`: Revoke an API key (requires human)

**Middleware** (`middleware/`):
- `auth.ts`: Core auth gates
  - `requireAuth`: Extracts Bearer token, validates + attaches `req.user` (or 401)
  - `requirePermission(perm)`: Blocks lobster keys without permission (or 403)
  - `requireHuman`: Blocks all lobster keys (or 403)

**Services** (`src/services/`):
- `authService.ts`: Business logic for auth (register, token generation, verification)
- `noteService.ts`: Business logic for note CRUD + encryption
- `agentService.ts`: Business logic for LobsterKey™ CRUD + permission handling

### 🎨 Frontend Architecture (`src/`)
**Pages** (`pages/`) — Feature clusters:
- `Auth/`: Registration, login, ClawKey™ setup
- `Dashboard/`: Main authenticated landing
- `Pot/`: Notes editor (name = "Pot" = main container)
- `Agents/`: LobsterKey™ management and creation
- `Settings/`: User profile, theme, preferences
- `Landing/`: Unauthenticated home page

**Components** (`components/`):
- `Layout/`: DashboardLayout (wraps authenticated routes), Sidebar, AppHeader, Navbar
- `Theme/`: ThemeToggle (light/dark mode switcher)
- `Modals/`: AddPearlModal (create note), etc.
- `Branding/`: InteractiveBrand (logo/brand elements)

**Services** (`src/services/`):
- `authService.ts`: Frontend API client for auth endpoints
- `noteService.ts`: Frontend API client for note endpoints
- `agentService.ts`: Frontend API client for agent/API key endpoints

**Context** (`context/`):
- `AuthContext.tsx`: Auth state (user, token, login/logout logic)
- `DashboardContext.tsx`: Dashboard state (theme, sidebar visibility, etc.)

**Library** (`lib/`):
- `crypto.ts`: Cryptographic utilities (base62 generation, token hashing)
- `shellCryption.ts`: AES-256-GCM encryption for notes (ShellCryption™)
- `api.ts`: API base configuration
- `apiFetch.ts`: Fetch wrapper with auth headers

### 📂 Test Architecture (`test/`)
- `shared/`: Factories and setup
  - `setup.lobster.ts`: Minimal setup (crypto is global in Node 19+)
  - `app.ts`: Test app factory, `createTestApp()`, `createTestUser()`, `createTestToken()`, `createTestLobsterKey()`
- `lib/`: Unit tests for crypto and ShellCryption™
- `services/`: Unit tests for service layer
- `server/routes/`: Integration tests for routes via supertest
- `server/middleware/`: Middleware tests (direct calls + HTTP via supertest)
- `integration/`: End-to-end test scenarios (token lifecycle, cross-user isolation)

### 📦 Data & Configuration
- `data/`: SQLite database (bind-mounted in Docker)
  - `clawstack.db`: Production/local database
  - `backups/`: Manual backups (if any)
- `.env.local`: Development environment variables (GEMINI_API_KEY, etc.)
- `package.json`: Dependencies, scripts, project metadata

### 📄 Documentation
- `README.md`: Project overview, installation, usage
- `ROADMAP.md`: Feature roadmap and vision
- `CONTRIBUTING.md`: Development guidelines
- `SECURITY.md`: Security policy and ClawKeys™ protocol
- `CRUSTAGENT.md`: Project intelligence and agent directives
- `src/CRUSTAGENT.md`: Source-level patterns and stability locks

## 🧭 Navigation Reflex

### "I need to add a new route"
1. Create handler in `src/server/routes/[domain].ts`
2. Import and use in `server.ts`
3. Wrap with `requireAuth` + `requirePermission` (if needed)
4. Add test in `test/server/routes/[domain].lobster.test.ts`
5. Update `truthpack/routes.json` + `truthpack/contracts.json`

### "I need to fix auth middleware"
1. Edit `src/server/middleware/auth.ts`
2. Update `test/server/middleware/auth.lobster.test.ts`
3. Run `npm test` — all 140 tests must pass
4. Verify `npm run test:coverage` shows 100% for middleware

### "I need to add a frontend feature"
1. Create feature folder in `src/pages/[Feature]/` or `src/components/`
2. Use DashboardLayout wrapper for authenticated routes
3. Import AuthContext for auth state
4. Use service layer (`src/services/`) for API calls
5. Add tests in `test/lib/` or integration tests
6. Verify design matches MoltTheme + Tailwind standards

### "I need to debug a failing test"
1. Run `npm test -- --reporter=verbose` to see exact failure
2. Check test imports: `../../shared/app` not `../shared/app`
3. Verify test DB is isolated (uses `:memory:`)
4. Run `npm run test:coverage` to see coverage gaps
5. Use error-pattern-analysis skill to identify common friction points

### "I need to understand database schema"
1. Read `src/server/db.ts` for CREATE TABLE statements
2. Check `truthpack/stability-locks.json` for constraints
3. Verify FK relationships in test data (app factory)
4. Use `sqlite3 data/clawstack.db` for live inspection

### "I need to deploy to Docker"
1. Ensure all tests pass: `npm test`
2. Verify Dockerfile builds correctly: `docker build -t pinchpad .`
3. Check GitHub Actions workflow: `.github/workflows/docker-publish.yml`
4. Push to main → CI runs tests → builds image → pushes to GHCR

## 📊 Project Statistics
- **Frontend**: React 19, ~8 pages, ~15 components, 3 service clients
- **Backend**: Express, 3 route files, 3 service files, 2 middleware
- **Database**: SQLite, ~5 tables, 4 foreign keys, 2 unique constraints
- **Tests**: 140+ assertions across 9 files (100% middleware, >90% routes/notes)
- **CI/CD**: GitHub Actions docker-publish workflow with test gate

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
Maintained by CrustAgent©™
