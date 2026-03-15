---
agent: security-adversary
audit: COMPREHENSIVE
date: 2026-03-15
scope: auth/session fixes + full attack surface
status: FINDINGS DOCUMENTED
severity_counts:
  critical: 2
  high: 5
  medium: 6
  low: 4
---

# PinchPad - Comprehensive Security Audit

> Attack-first, exploitation-minded review of the full authentication/session surface and all adjacent systems.

---

## Executive Summary

The existing `AUDIT_SECURITY.md` scored this codebase 8-10/10 across the board. That score is wrong. This audit identified **2 critical**, **5 high**, **6 medium**, and **4 low** severity issues. Several of these are trivially exploitable and would result in full account compromise or complete authentication bypass in specific configurations.

The cryptographic primitives themselves (AES-GCM-256, HKDF, SHA-256) are correctly chosen. The vulnerabilities are in how the authentication *logic* is structured around them, how secrets are handled in process memory and logs, and how the server is configured. These are the exploitable gaps.

---

## CRITICAL Issues

---

### CRIT-01: keyHash Fallback Lookup Enables Authentication Bypass and User Enumeration

**File:** `src/server/routes/auth.ts:79-81`

**Vulnerability Description:**

The `/api/auth/token` endpoint implements a three-stage user lookup waterfall:
1. By UUID
2. By username
3. **By `keyHash` alone** (fallback)

The third fallback — "Look up by keyHash alone if nothing else matched" — fundamentally inverts the authentication model. Authentication should require: *who you are* (identity) + *proof you are them* (key). The fallback collapses these into a single factor: the keyHash itself becomes both the identity locator AND the credential. Anyone with a valid keyHash (but unknown identity) is authenticated.

**Attack Scenario:**

```
POST /api/auth/token
{
  "keyHash": "<sha256 of any valid hu- key>",
  "type": "human"
}
```

Step-by-step:
1. Attacker has intercepted or brute-forced a valid `keyHash` (the hash is stored in plaintext in the DB — see CRIT-02).
2. Attacker sends the above request with NO uuid and NO username.
3. Server hits the fallback at line 80: `SELECT * FROM users WHERE key_hash = ?`
4. User record is returned, `constantTimeCompare(keyHash, user.key_hash)` passes trivially because they are identical by construction.
5. A valid session token is issued.

A separate attack path: if the DB is ever read (insider, compromised container, backup leak), the `key_hash` column provides both the identity locator AND can be used to directly authenticate.

**Impact:** Full account takeover for any user whose `key_hash` is known. The `key_hash` is stored in plaintext in SQLite (CRIT-02), making this a compound exploit chain. Severity is reduced only if the attacker cannot read the DB — but the fallback means *any* knowledge of the hash is sufficient.

**Remediation:** Remove the `keyHash` fallback lookup entirely. Authentication without at least UUID or username should be rejected. The correct model: require at minimum one identity field, verify it resolves to a user, then validate the key against that resolved user.

**Severity Score:** 9/10

---

### CRIT-02: `key_hash` Stored in Plaintext in SQLite — Complete Credential Database

**File:** `src/server/db.ts:19-24`

**Vulnerability Description:**

The `key_hash` column in the `users` table holds SHA-256 hashes of `hu-` prefixed tokens. `hu-` tokens are structured as `hu-` + 64 base62 characters, giving a ~380-bit keyspace. SHA-256 of a high-entropy token is not itself a vulnerability *in isolation*. However, when combined with CRIT-01, the `key_hash` value directly authenticates a user. The hash IS the credential, stored in cleartext in `data/clawstack.db`.

Furthermore, the `lobster_keys` table stores `api_key_hash` values AND the `api_key` column containing the "ShellCrypted" (AES-GCM encrypted) raw agent key. While the agent key is encrypted, it is encrypted under the user's `shellKey`, which is derived from the `hu-` key. If an attacker reads the DB and knows one user's hu- key, they can decrypt all of that user's lobster keys.

**Attack Scenario:**

1. Attacker gains read access to `data/clawstack.db` (compromised host, path traversal in some other service sharing the filesystem, Docker volume misconfiguration, or the `data/` directory being exposed over HTTP in a misconfigured reverse proxy).
2. All `key_hash` values are immediately usable to authenticate via CRIT-01.
3. `SELECT uuid, username, key_hash FROM users` gives a complete credential dump.

**Impact:** Complete database of exploitable credentials. No password cracking required due to CRIT-01.

**Remediation:**
- Immediately eliminate CRIT-01 to break the exploit chain.
- Consider whether `key_hash` needs to be stored at all, or whether it could be replaced with a server-side Argon2/bcrypt-stretched hash that is prohibitively expensive to use as a direct authentication token. The current SHA-256 is fast to compute — not appropriate for credential storage.
- Ensure `data/` directory has OS-level permission restrictions (mode 700, owned by the server process user).

**Severity Score:** 8/10 (9/10 when chained with CRIT-01)

---

## HIGH Issues

---

### HIGH-01: constantTimeCompare Length-Leak Timing Attack

**File:** `src/server/routes/auth.ts:8-15`

**Vulnerability Description:**

```typescript
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;  // <-- EARLY RETURN
  ...
}
```

The function returns `false` immediately when lengths differ, before performing the constant-time XOR loop. This creates a timing oracle: an attacker can determine whether a submitted `keyHash` is the *correct length* by measuring response time. SHA-256 hashes are always 64 hex characters, so in this specific use case the length check always passes, which partially neutralizes this. However:

- If the input is *not* a SHA-256 hex string (client sends raw bytes, truncated hash, or otherwise malformed input), the early return leaks the expected length.
- Any future addition of variable-length credentials to this same comparison function will inherit this flaw.
- `String.prototype.charCodeAt` is not guaranteed to be constant-time across all JS engine implementations or platforms. The outer loop itself may leak timing information on strings with high-byte characters.

**Attack Scenario:** Timing-based oracle attack measuring microsecond-level response time differences. Requires many thousands of requests and network jitter mitigation — difficult remotely, trivial if co-located.

**Impact:** Potential credential oracle in adversarial network conditions.

**Remediation:** Use `crypto.timingSafeEqual` from Node.js `crypto` module on Buffer inputs. This is implemented in C and provides genuine constant-time comparison. The length check should compare using the same mechanism or pad to a fixed length before comparison.

**Severity Score:** 6/10

---

### HIGH-02: Lobster (Agent) Authentication Has No keyHash Validation

**File:** `src/server/routes/auth.ts:101-125`

**Vulnerability Description:**

When `type === 'lobster'`, the token flow performs:
1. UUID lookup to find the user
2. Lookup of the lobster key by `user_uuid + api_key_hash + is_active = 1`

There is no `constantTimeCompare` applied to the lobster key hash lookup. The DB query `WHERE user_uuid = ? AND api_key_hash = ?` performs the comparison inside SQLite, which is not constant-time. More critically, if the DB query returns a result, authentication succeeds. This is a DB-level timing attack surface and the authentication is fully delegated to SQLite's equality operator.

Additionally, a revoked key (`is_active = 0`) correctly fails. But there is no validation that `keyHash` itself is structurally valid (e.g., a 64-char hex string). A maliciously crafted `keyHash` value containing SQL-special characters could not inject SQL (the query is parameterized), but could exploit SQLite collation or encoding edge cases.

**Impact:** Agent key authentication lacks the timing protections applied to human key authentication.

**Remediation:** Extract the lobster key hash from the DB and run it through `crypto.timingSafeEqual` explicitly, rather than relying on SQLite's equality operator for authentication decisions.

**Severity Score:** 6/10

---

### HIGH-03: Insecure Direct JSON.parse on Identity File Without Schema Validation

**File:** `src/services/authService.ts:101-106`

**Vulnerability Description:**

```typescript
const identity = JSON.parse(identityFileContent);
const huKey = identity.token || identity.huKey; // Handle both formats
const uuid = identity.uuid;
```

`identityFileContent` is the raw text of an uploaded `.json` file from the user's filesystem (via `FileReader` in `src/pages/Auth/Login.tsx:53-65`). The parse is completely unconstrained. There is no:
- Schema validation
- Type checking beyond the `startsWith('hu-')` check on `huKey`
- Null/undefined safety beyond the falsy check on `uuid || huKey`
- Size limit on the uploaded file

**Attack Scenario (Prototype Pollution):**

A maliciously crafted identity file:
```json
{
  "__proto__": { "isAdmin": true, "polluted": "yes" },
  "token": "hu-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

While modern V8's JSON.parse is hardened against `__proto__` prototype pollution via direct JSON deserialization (the key is treated as an own property of the parsed object, not the prototype), the `constructor` and `constructor.prototype` patterns remain exploitable in certain library contexts. More practically, the application will happily process a file containing:
```json
{
  "token": "hu-AAAA...",
  "uuid": "any-string-here-no-uuid-format-validation"
}
```

The `uuid` value is passed directly to the server as `body.uuid`, which is then used in a parameterized SQL query. While SQL injection is prevented, an arbitrary UUID value allows an attacker to attempt authentication against a non-existent UUID, causing the fallback to `username` and then `keyHash` (CRIT-01).

**Attack Scenario (File Size DoS):** The client reads an arbitrarily large file with `FileReader.readAsText()`. A 500MB JSON file will block the JS thread during parsing.

**Impact:** Prototype pollution (limited but present), UUID spoofing feeding CRIT-01, DoS via large file.

**Remediation:** Validate file size before reading (<10KB is sufficient for a valid identity file). Validate all parsed fields against expected types and formats (UUID regex, `hu-` prefix + length 67, no extra fields). Use `Object.create(null)` pattern or a JSON schema validator.

**Severity Score:** 7/10

---

### HIGH-04: Session Token Stored in localStorage — XSS Results in Full Account Compromise

**File:** `src/services/authService.ts:90-94`

**Vulnerability Description:**

```typescript
localStorage.setItem(SESSION_KEYS.token, pearl.token);
localStorage.setItem(SESSION_KEYS.username, pearl.username);
localStorage.setItem(SESSION_KEYS.uuid, pearl.uuid);
localStorage.setItem(EXPIRY_KEY, String(Date.now() + 86400000));
```

The session token (`api-` + 32 base62 characters), username, UUID, and session expiry are all stored in `localStorage`. `localStorage` is accessible to any JavaScript executing in the same origin. This means:

1. Any XSS vulnerability (in this app, in an injected extension, or via a shared origin) can exfiltrate the complete session.
2. The attacker obtains a 24-hour session token that can be used to read/write all notes and manage lobster keys from any location.
3. Unlike `httpOnly` cookies, there is no browser mechanism to protect `localStorage` from script access.

**Attack Scenario:** If any component ever renders user-controlled content via `innerHTML` or `dangerouslySetInnerHTML` (currently none found, but the application is under active development), or if a third-party script is compromised (supply chain), the complete session is exfiltrated in one `localStorage.getItem` call.

**Impact:** Complete session hijacking. Attacker can read all encrypted notes (via the API, which returns the encrypted ciphertext — decryption requires the `shellKey` which is NOT in localStorage, so note content is not immediately readable) and revoke/create agent keys.

**Remediation:** Move session tokens to `httpOnly; Secure; SameSite=Strict` cookies. The current architecture (separate frontend origin + backend origin with CORS) complicates this but does not prevent it. At minimum, document the accepted XSS risk. If localStorage must be used, shorten the token TTL significantly from 24 hours.

**Severity Score:** 7/10

---

### HIGH-05: Unvalidated Permissions JSON Stored and Deserialized Without Schema Enforcement

**File:** `src/server/middleware/auth.ts:35` and `src/pages/Agents/Agents.tsx:103`

**Vulnerability Description:**

In the auth middleware:
```typescript
permissions = JSON.parse(lobster.permissions);
```

In the frontend:
```typescript
Permissions: {Object.keys(JSON.parse(polyP.permissions)).join(', ')}
```

The `permissions` field stored in `lobster_keys` is a raw JSON string that originated from `JSON.stringify(permissions)` in the agents route. The client submits the permissions object, the server stringifies it and stores it, and the middleware deserializes it back. There is no schema validation on:
- What keys are permitted in the permissions object
- Whether the values are strictly boolean
- Whether the object has a bounded number of keys
- Whether nested objects are present

**Attack Scenario (Permission Key Injection):**

An authenticated user could submit a lobster key creation request with:
```json
{
  "permissions": {
    "canRead": true,
    "canWrite": true,
    "canDelete": true,
    "__proto__": { "canAdmin": true },
    "constructor": { "prototype": { "isAdmin": true } }
  }
}
```

In `requirePermission`:
```typescript
const hasPermission = req.user.permissions && req.user.permissions[permission] === true;
```

This checks `req.user.permissions[permission]` — if `permission` is a value not in the schema (e.g., `"isAdmin"`, `"canAdmin"`, `"toString"`), and the pollution succeeded, the check passes. While V8's `JSON.parse` is generally resistant to `__proto__` pollution, the `constructor.prototype` path has been exploited in past Node.js versions. The risk is version-dependent.

More immediately: there is no validation that the permission keys are from an allowlist. A user could grant a lobster key `{ "canDeleteEverything": true }` and if any route ever checks `requirePermission('canDeleteEverything')`, it would pass.

**Frontend XSS Vector:** `Object.keys(JSON.parse(polyP.permissions)).join(', ')` renders permission key names into the DOM. If the stored permissions contain key names like `<img src=x onerror=alert(1)>`, React will escape this in JSX text content — BUT the `JSON.parse` + `Object.keys` pattern trusts the server response completely. React's text node escaping prevents XSS here, but only because of React's architecture, not any intentional sanitization.

**Impact:** Prototype pollution risk (version-dependent), unbounded permission scope, latent XSS if rendering pattern changes.

**Remediation:** Validate permissions against an explicit allowlist (`['canRead', 'canWrite', 'canEdit', 'canDelete']`) at both the creation route and the middleware deserialization point. Reject any unknown keys. Use `Object.create(null)` or freeze the permissions object after deserialization.

**Severity Score:** 6/10

---

## MEDIUM Issues

---

### MED-01: Debug Logging Leaks Authentication-Critical Data

**File:** `src/server/routes/auth.ts:56, 93, 142`

```typescript
console.log('[Auth] /token called with:', { uuid: uuid?.slice(0, 8), username, keyHash: keyHash?.slice(0, 16), type });
console.log('[Auth] Hash comparison:', hashMatch ? 'match' : 'mismatch');
console.log('[Auth] Token created successfully for user:', user.username);
```

The logs emit:
- First 16 characters of the `keyHash`. SHA-256 output is hex, so this is the first 8 bytes of the hash, reducing the attacker's search space from 64 hex chars to 48.
- Full plaintext `username` on every token request (successful or failed).
- `uuid` prefix on every token request.
- Authentication success/failure oracle per-user via log correlation.

In production deployments (Docker, cloud logging services like CloudWatch, GCP Cloud Logging, Datadog), these logs are often stored in external systems with broader access than the application itself. Server operators who can read logs can trivially enumerate all users (usernames + UUID prefixes) and observe authentication patterns.

**Attack Scenario:** Insider attacker or compromised logging infrastructure reads auth logs. Extracts username list + partial hash prefixes for offline analysis. Correlates timing patterns to identify high-value targets.

**Remediation:** Remove all authentication-specific debug logs from production paths. If logging is required for audit trails, log only opaque identifiers (e.g., a hash of the UUID) and success/failure codes, never usernames or hash fragments. Use structured logging with log-level gating (`DEBUG` vs `AUDIT`).

**Severity Score:** 5/10

---

### MED-02: CORS Origin is Hardcoded to `localhost:8282` — Broken in Production

**File:** `server.ts:26-29`

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8282',
  credentials: true,
}));
```

The fallback origin `http://localhost:8282` is HTTP (not HTTPS). If `CORS_ORIGIN` is not set in production:
1. The API will reject cross-origin requests from the production domain.
2. If someone deliberately uses `localhost:8282` on a shared server or in a cloud environment, they could make cross-origin API requests.
3. The `credentials: true` setting means cookies and Authorization headers are included in cross-origin requests to matching origins. Combined with the hardcoded localhost, this is a misconfiguration waiting for a production deployment.

Additionally, there is no validation that `process.env.CORS_ORIGIN` is a valid URL or that it matches an allowlist. A misconfigured `CORS_ORIGIN=*` combined with `credentials: true` would be rejected by browsers as an invalid configuration — but `CORS_ORIGIN=null` or `CORS_ORIGIN=https://evil.example.com` would silently pass.

**Remediation:** Validate `CORS_ORIGIN` at startup against an allowlist of known deployment domains. Fail hard if it is not set in production (`NODE_ENV=production`). Document in `.env.example`.

**Severity Score:** 5/10

---

### MED-03: ContentSecurityPolicy Disabled — Removes XSS Mitigation Layer

**File:** `server.ts:22-24`

```typescript
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for Vite HMR in dev
}));
```

The comment says "for Vite HMR in dev" but CSP is disabled globally, including in production (the same `server.ts` serves prod static files). Without CSP:
- Any XSS that bypasses React's escaping can load arbitrary external scripts.
- `eval()` and `new Function()` are unrestricted.
- Data exfiltration via `fetch()` or `img src=` to arbitrary external origins is unrestricted.

**Remediation:** Re-enable CSP with an appropriate policy for production. Use `NODE_ENV` to conditionally disable it in development only. A minimal production policy: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' <api-origin>`.

**Severity Score:** 5/10

---

### MED-04: Client-Side Session Expiry is Unilaterally Trustable

**File:** `src/services/authService.ts:33-40`

```typescript
if (expiry) {
  const expiryTime = parseInt(expiry, 10);
  if (Date.now() > expiryTime) {
    Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  }
}
```

The session expiry is stored in `localStorage` and validated client-side. An attacker with XSS (or physical access to the browser) can:
1. Extend their session indefinitely: `localStorage.setItem('cc_session_expiry', '9999999999999')`
2. Prevent expiry checks by removing the key: `localStorage.removeItem('cc_session_expiry')`

When `expiry` is null (key removed), `readSession()` returns the session with no expiry check applied — the token still works as long as the server-side `expires_at` has not passed. The server-side expiry IS enforced (checked on `/api/auth/verify` and in `requireAuth`), but the client-side logic gives a false sense of expiry enforcement.

**Impact:** An attacker who can modify localStorage (XSS, browser extension) can manipulate the client-perceived session lifetime.

**Severity Score:** 4/10

---

### MED-05: Race Condition in Token Deletion During Authentication

**File:** `src/server/routes/auth.ts:131`

```typescript
db.prepare('DELETE FROM api_tokens WHERE owner_uuid = ? AND owner_type = ?').run(user.uuid, type);
```

This line deletes ALL existing tokens for the user before inserting a new one, as part of the `/token` endpoint. If two concurrent login requests arrive simultaneously for the same user, the sequence may be:

```
Request A: DELETE existing tokens
Request B: DELETE existing tokens (no-op, already deleted)
Request A: INSERT token A
Request B: INSERT token B
```

Both tokens are created. This violates the "single active session" invariant the code intends to enforce. In practice: a user is now logged in from two locations simultaneously.

This is low-risk for most use cases but creates a session management inconsistency that could be exploited for session cloning if combined with timing attacks.

**Severity Score:** 4/10

---

### MED-06: Import Mock in Settings Accepts Any File and Signals False Success

**File:** `src/pages/Settings/Settings.tsx:135-143`

```typescript
const simulateImport = () => {
  if (!importFile) return;
  setIsImporting(true);
  setImportSuccess(false);
  setTimeout(() => {
    setIsImporting(false);
    setImportSuccess(true);
    setImportFile(null);
  }, 1500);
};
```

The import function is a mock that accepts any file (including `.json`, `.csv`, `.md`, `.txt`) and always signals success after 1500ms. Users are led to believe their import succeeded when nothing happened. This is a functional issue but also a security concern: when real import logic is eventually implemented, the file handling surface is wide open with no demonstrated validation pattern in place. A future developer is likely to `JSON.parse` the file content without size limits or schema validation (mirroring the pattern already seen in HIGH-03).

**Severity Score:** 3/10

---

## LOW Issues

---

### LOW-01: Rate Limiting on Auth Routes is Too Permissive

**File:** `server.ts:34-38`

```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});
```

100 requests per 15 minutes per IP allows ~6.7 requests per second. For authentication endpoints, this provides negligible protection against:
- Online brute-force of UUIDs (which are UUIDs, not secret — they're visible in the identity file and logged)
- Credential stuffing attacks using stolen `keyHash` values
- Automated identity enumeration via the `/register` endpoint (username taken vs. available leaks existence)

The rate limit is also IP-based only. Behind a NAT or VPN exit node, many attackers share the same IP and would share the rate limit, making it trivially bypassable with IP rotation.

**Remediation:** Reduce to 10 requests per 15 minutes for `/token` and `/register`. Add per-username rate limiting in addition to per-IP. Add exponential backoff after 3 failed attempts per username.

**Severity Score:** 4/10

---

### LOW-02: Username Existence Oracle via Error Response Differentiation

**File:** `src/server/routes/auth.ts:86-90`

```typescript
return res.status(401).json({
  error: 'Invalid identity or key',
  suggestion: 'Try providing your username for better error details.'
});
```

And later at line 96-99:
```typescript
return res.status(401).json({
  error: 'Invalid identity or key',
  suggestion: 'Key hash does not match.'
});
```

Two different error paths return different `suggestion` strings:
- "Try providing your username for better error details." — user does not exist
- "Key hash does not match." — user exists but key is wrong

This is a user enumeration oracle. An attacker can determine whether a username exists by submitting a token request and comparing the `suggestion` field. Combined with the low rate limit (LOW-01), usernames can be enumerated.

Additionally, the auth flow's three-step lookup (UUID, username, keyHash) leaks further information via the debug logs (MED-01): "UUID lookup: found", "Username lookup: found", etc. In production with centralized logging, this is a continuous enumeration log.

**Remediation:** Normalize all 401 responses to an identical message and error structure regardless of failure reason. Remove the `suggestion` field from error responses in production.

**Severity Score:** 3/10

---

### LOW-03: Identity File Download Contains Raw `huKey` as `token` Field

**File:** `src/lib/crypto.ts:24-41`

```typescript
export function downloadIdentityFile(username: string, uuid: string, token: string) {
  const identity = {
    username,
    uuid,
    token,       // <-- raw hu- key stored here
    createdAt: new Date().toISOString()
  };
  ...
}
```

The identity file uses the field name `token` for the `huKey`. The `authService.login()` function reads this as `identity.token || identity.huKey`, handling both formats. This dual-format ambiguity means:
1. The field name `token` suggests it is a session token (short-lived), not a long-lived credential. Users may treat it with less care.
2. If a user ever accidentally shares their identity file (paste in a chat, include in a bug report), they share a permanent credential, not a temporary session token.

The file should use a field name like `huKey` or `clawKey` to clearly communicate its nature as a long-lived credential requiring protection equivalent to a password.

**Severity Score:** 2/10

---

### LOW-04: Server Binds to `0.0.0.0` — Exposed on All Interfaces

**File:** `server.ts:58`

```typescript
app.listen(PORT, '0.0.0.0', () => { ... });
```

The server listens on all network interfaces. In a Docker deployment without explicit port binding restrictions, or on a multi-interface host, the API is reachable from all networks the host is connected to, not just localhost. The Vite dev server does the same (`npm run dev`). Combined with the permissive CORS default (MED-02), the attack surface extends beyond the intended local deployment.

**Remediation:** For development, bind to `127.0.0.1`. For production Docker deployments, expose only the intended port and rely on Docker's network isolation. Document this in the deployment guide.

**Severity Score:** 2/10

---

## Positive Security Findings

These are implemented correctly and should be preserved:

- **SQL Injection: None Found.** All database queries across `auth.ts`, `notes.ts`, `agents.ts`, and `db.ts` use parameterized statements via `better-sqlite3`'s `prepare().run()/get()/all()` pattern. No string concatenation into queries detected.
- **AES-GCM-256 with HKDF:** The `shellCryption.ts` implementation is cryptographically sound. HKDF key derivation with UUID salt and a versioned info string, 12-byte random IV per encryption, AAD binding ciphertext to record identity — all correct.
- **Client-side key generation:** `crypto.getRandomValues` with rejection sampling in `src/lib/crypto.ts:6-13` (the client version) is correctly implemented.
- **Server-side key generation:** `crypto.randomInt(62)` in `auth.ts` and `agents.ts` is unbiased.
- **Foreign key cascades:** DB schema uses `ON DELETE CASCADE`, preventing orphaned tokens/notes when users are deleted.
- **Token invalidation on login:** Old tokens are deleted before new ones are issued (minor race condition noted in MED-05, but the intent is correct).
- **`httpOnly` concern mitigated by design:** The `shellKey` (AES-GCM CryptoKey) is never stored in localStorage or any persistent storage — it lives only in React state and is lost on refresh, requiring re-derivation. This means XSS cannot steal the encryption key.

---

## Attack Chain Summary

The most dangerous compound attack:

```
1. Attacker reads data/clawstack.db (insider, compromised host, backup leak)
   └─> Obtains: uuid, username, key_hash for all users

2. Attacker sends: POST /api/auth/token { keyHash: "<stolen_hash>", type: "human" }
   └─> CRIT-01 fallback lookup authenticates via hash alone

3. Attacker receives: valid api-XXXX... session token

4. Attacker reads: GET /api/notes (returns encrypted note ciphertext)
   └─> Cannot decrypt without hu- key (shellKey not recoverable from DB alone)

5. Attacker manages agents: POST /api/agents (creates new lobster keys)
   └─> Can create new agent keys under victim's account

6. Attacker exfiltrates encrypted data, waits for hu- key leak to decrypt
```

Priority remediation order: **CRIT-01 > CRIT-02 > HIGH-03 > HIGH-04 > HIGH-01**

---

## File Reference Index

| File | Issues |
|------|--------|
| `src/server/routes/auth.ts` | CRIT-01, HIGH-01, HIGH-02, MED-01, LOW-02 |
| `src/server/db.ts` | CRIT-02 |
| `src/services/authService.ts` | HIGH-03, HIGH-04, MED-04 |
| `src/server/middleware/auth.ts` | HIGH-05 |
| `src/pages/Agents/Agents.tsx` | HIGH-05 |
| `server.ts` | MED-02, MED-03, LOW-01, LOW-04 |
| `src/services/authService.ts` | MED-05 |
| `src/pages/Settings/Settings.tsx` | MED-06 |
| `src/lib/crypto.ts` | LOW-03 |

---

**Maintained by CrustAgent©™**
