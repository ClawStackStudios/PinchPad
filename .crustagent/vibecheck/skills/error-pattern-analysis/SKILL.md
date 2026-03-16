# Sovereign Error Pattern Analysis — PinchPad©™

This skill defines the "Debugging Reflex" for the PinchPad environment. Use it to scan for known codebase friction points whenever things move out of "Vibecheck Green" status.

## 🔍 PinchPad-Specific Patterns

### 401 Unauthorized (Auth Failures)
- **Wrong Token Prefix**: Token must start with `api-` (not `cc-`, `hu-`, `lb-`). Check `src/lib/crypto.ts:generateBase62()`
- **Expired Token Not Deleted**: Middleware should auto-delete expired tokens. Check `src/server/middleware/auth.ts` line 30-35
- **Missing Authorization Header**: Verify client sends `Authorization: Bearer <token>` (case-sensitive)
- **Lobster Permission Mismatch**: Ensure `JSON.parse(lobster_key.permissions)` doesn't fail. Check for double-stringified JSON in DB

### 403 Forbidden (Permission Denied)
- **Lobster Key Blocked**: Only humans bypass all checks. Verify `requireHuman()` is used for `/agents` routes
- **Missing Permission**: `requirePermission('canWrite')` blocks lobster without write perm. Check `lobster_keys.permissions` JSON has `canWrite: true`
- **Wrong User ID**: Notes filtered by `user_uuid`. Cross-user queries should 404, not 403

### 500 Internal Server Errors (The "Lobster Mismatch")
- **Field Name Drifts**: Check for renamed fields in DB schema vs service layer:
  - Notes: `id`, `title`, `content`, `starred`, `pinned`, `user_uuid`, `created_at`, `updated_at`
  - Agents: `id`, `name`, `permissions`, `is_active`, `created_at`, `expires_at`
  - Tokens: `key`, `owner_uuid`, `owner_type`, `expires_at`, `created_at`
- **JSON.parse Failures**: Permission column stored as JSON. Verify:
  ```ts
  const perms = JSON.parse(lobster_key.permissions);
  if (perms.canWrite) { /* allowed */ }
  ```
- **ReferenceErrors**: Variables renamed in service but not in route (e.g., `id` vs `uuid`)
- **ShellCryption™ Failures**: Nonce/tag mismatch on decrypt. Check `src/lib/shellCryption.ts` for correct IV format

### UI & Styling Friction
- **Z-Index Layering**: Modals behind dropdowns? Standardize on `z-[110]` for modals, `z-[50]` for dropdowns
- **Theme Persistence**: Light/dark mode flashing = mismatch between localStorage and DashboardContext
  - Verify ThemeContext reads localStorage on mount: `useEffect(() => { const theme = localStorage.getItem('theme'); ... }, [])`
- **View Transitions**: MoltTheme animations stuttering? Check Tailwind CSS 4 is installed and `@tailwindcss/vite` is in config

### 🛡️ Auth & Access
- **Token Format Check**: Run `curl -H "Authorization: Bearer api-..." http://localhost:8383/api/auth/verify`
  - Success = token valid and not expired
  - 401 = token invalid/expired (should be auto-deleted)
- **Port Conflicts**:
  - Frontend (Vite): `:8282` (if in use, Vite will increment)
  - Backend (tsx): `:8383` (if in use, app fails to start)
  - Use `lsof -i :8383` to find process, `kill -9 <pid>` to clear

### 🧪 Test Failures
- **Import Path Errors**: `test/server/routes/auth.lobster.test.ts` should import from `../../shared/app`, not `../shared/app`
- **Missing createTestApp()**: Middleware tests must use `createTestApp()` to get isolated DB, not import live `src/server/db.ts`
- **Crypto Global Missing**: Node 19+ has `globalThis.crypto` built-in. Don't add polyfill (read-only getter)
- **keyType vs type**: Middleware expects `req.user.keyType` (not `type`). Check test fixtures

## 🛠️ Root Cause Protocol
1. **Live Audit**:
   ```bash
   npm run dev:server 2>&1 | tee /tmp/debug.log
   npm run dev  # in another terminal
   ```
2. **Vertical Reproduction**: Use curl to test endpoint directly:
   ```bash
   curl -X POST http://localhost:8383/api/auth/token \
     -H "Content-Type: application/json" \
     -d '{"uuid":"...", "keyHash":"...", "type":"human"}'
   ```
3. **Database Inspection**:
   ```bash
   sqlite3 data/clawstack.db "SELECT * FROM api_tokens LIMIT 5;"
   sqlite3 data/clawstack.db "SELECT * FROM lobster_keys LIMIT 5;"
   ```
4. **Test Isolation Check**:
   ```bash
   npm test -- --reporter=verbose  # See which test is failing
   npm run test:coverage  # Full coverage report
   ```
5. **Pinch & Fix**: Propose a fix addressing root cause, not symptom
6. **Verified Signature**: Run `npm test && npm run test:coverage` to confirm all passing

## 🔧 Common Quick Fixes
| Error | Likely Cause | Fix |
|-------|-------------|-----|
| 401 Unauthorized | Token expired or invalid | Check `api_tokens` table, verify prefix is `api-` |
| 403 Forbidden | Missing permission | Verify `canWrite`/`canRead` in `lobster_keys.permissions` JSON |
| 500 parsing failure | Double-stringified JSON | Check `JSON.parse()` only called once, not twice |
| Module not found | Wrong import path | In `test/`, check relative paths are `../../src/...` not `../src/...` |
| EADDRINUSE :8383 | Port in use | `lsof -i :8383`, then `kill -9 <pid>` |
| Theme flashing | Context not loading from localStorage | Check DashboardContext useEffect runs on mount |

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
Maintained by CrustAgent©™
