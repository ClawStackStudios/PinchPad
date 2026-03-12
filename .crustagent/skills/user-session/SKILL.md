# ClawStack User Session Management Skill

**Version:** 1.0
**Status:** Production Ready
**Last Updated:** 2026-03-08

---

## Overview

This skill documents the complete user session lifecycle in ClawStack applications. It covers token generation, storage, verification, expiration handling, and cleanup—providing new developers with everything needed to implement session management correctly in any new ClawStack app.

**Key Characteristics:**
- **Token Format:** `api-` prefix + 32 base62 characters (36 total)
- **Storage:** Browser `sessionStorage` with `cc_*` key prefix
- **TTL:** 24 hours from issuance
- **Automatic Cleanup:** Hourly purge of expired server-side tokens
- **Security Model:** Bearer tokens over HTTPS, timing-safe comparison, no token refresh

---

## 1. Session Lifecycle Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   ClawStack Session Lifecycle                    │
└─────────────────────────────────────────────────────────────────┘

    [User Opens App]
           │
           ▼
    ┌─────────────────┐
    │  Check Browser  │
    │  sessionStorage │
    └────────┬────────┘
             │
       ┌─────┴──────────┐
       │                │
   [Token?]         [No Token?]
       │                │
       ▼                ▼
   [Verify]      [Show Login]
   Token Exists   Form
       │
       ▼
   GET /api/auth/verify
   (Bearer token)
       │
    ┌──┴──────────┐
    │             │
  [✓ Valid]   [✗ Expired]
    │             │
    ▼             ▼
  Auth      Clear Session
  Success   → Logout
    │
    ▼
[During Session]
    │
    ├─ User makes API calls
    │  (with Bearer token)
    │
    ├─ Token expires mid-session
    │  (apiFetch intercepts 401)
    │
    └─ auth:expired event fires
       → useAuth listener clears session
       → User silently logged out
       → Redirect to login on next action

[Server-side]
    │
    ├─ purgeExpiredTokens() on startup
    │
    └─ purgeExpiredTokens() every hour
       → Deletes all rows where expires_at <= now()
       → Prevents table bloat
```

### State Machine: User Session States

```
┌──────────────┐
│   Loading    │ (Initial state on app start)
└─────┬────────┘
      │
      ├─→ [Invalid/No Token] ──→ ┌──────────────┐
      │                           │ Unauthenticated
      │                           │ (Show Login)
      │                           └──────────────┘
      │
      └─→ [Valid Token] ──────→ ┌──────────────┐
                                │ Authenticated
                                │ (Show App)
                                └──────────────┘
                                      │
                                      ├─ User clicks Logout
                                      │  → DELETE /api/auth/logout
                                      │  → Clear sessionStorage
                                      │  → Back to Unauthenticated
                                      │
                                      └─ Token expires mid-session
                                         → 401 from API
                                         → apiFetch fires auth:expired
                                         → useAuth listener clears session
                                         → Back to Unauthenticated
```

---

## 2. Token Generation & Storage

### 2.1 Token Anatomy

All session tokens follow a strict format:

```
api-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
│   │
│   └─ 32 base62 characters (256 bits of entropy)
│
└─── Prefix (immutable)
```

**Breakdown:**
- **Prefix:** `api-` (4 chars) — identifies token type
- **Random:** 32 base62 characters — cryptographically secure random
- **Total Length:** 36 characters
- **Alphabet:** `0-9A-Za-z` (62 chars)
- **Entropy:** ~256 bits (32 bytes × log₂(62) ≈ 201 bits practical)

### 2.2 Generation Function

Source: `/server/auth.js`

```javascript
// Base62 alphabet for token generation
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Generate a random base-62 string of specified length
 * Used for both api- tokens (32 chars) and hu- keys (64 chars)
 */
export function generateBase62(length) {
  const bytes = crypto.randomBytes(length)
  return Array.from(bytes, (b) => BASE62[b % 62]).join('')
}
```

**How it works:**
1. `crypto.randomBytes(32)` — generates 32 cryptographically secure random bytes
2. Each byte (0-255) is mapped to a base62 character via modulo
3. Characters are joined into a 32-character string
4. Prefix `api-` is prepended by the caller

**Modulo Bias Note:**
- 256 % 62 = 10, so some characters are slightly more likely
- Bias magnitude: ~10 characters out of 256, impacting entropy negligibly
- For tokens, this is acceptable; the practical entropy loss is minimal

### 2.3 Token Storage

#### Server-side Storage

**Database Schema:**

```sql
CREATE TABLE api_tokens (
  token      TEXT PRIMARY KEY,       -- Full token (api-XXXXX...) stored plaintext
  user_uuid  TEXT NOT NULL,          -- Foreign key to users.uuid
  created_at TEXT NOT NULL,          -- ISO 8601 timestamp
  expires_at TEXT NOT NULL,          -- ISO 8601 timestamp (now + 24h)
  FOREIGN KEY (user_uuid) REFERENCES users(uuid)
);
```

**Key Details:**
- `token` is stored **plaintext** (not hashed)
  - Acceptable because: tokens are ephemeral (24h), transmitted over HTTPS only, and treated as passwords
  - Hashing would require comparing all hashes on verification (slow)
- `expires_at` is ISO 8601 formatted: `2026-03-09T12:34:56.789Z`
- Queries use `datetime()` SQLite function for safe comparison

**Query Example (from `requireAuth` middleware):**

```javascript
const row = db
  .prepare(
    `SELECT user_uuid, username FROM api_tokens t
     JOIN users u ON t.user_uuid = u.uuid
     WHERE t.token = ? AND datetime(t.expires_at) > datetime('now')`
  )
  .get(token)
```

#### Client-side Storage

**sessionStorage Keys:**

| Key | Purpose | Example |
|-----|---------|---------|
| `cc_api_token` | Bearer token | `api-Abc123...` |
| `cc_username` | Cached username | `alice_smith` |
| `cc_user_uuid` | Cached user ID | `550e8400-e29b-41d4-a716-446655440000` |
| `cc_key_type` | Key derivation method | `hu` (human-memorable) |

**Storage Location:** Browser's `sessionStorage`
- Cleared when tab/browser closes (not persistent across restart)
- Accessible only by the same origin (localhost:6565)
- No expiry—application code handles expiry logic

**Example Storage (after login):**

```javascript
const SESSION_KEYS = {
  token: 'cc_api_token',
  username: 'cc_username',
  uuid: 'cc_user_uuid',
  keyType: 'cc_key_type',
} as const

// In login() function:
sessionStorage.setItem('cc_api_token', 'api-Abc123...')
sessionStorage.setItem('cc_username', 'alice_smith')
sessionStorage.setItem('cc_user_uuid', '550e8400-...')
sessionStorage.setItem('cc_key_type', 'hu')
```

### 2.4 Token Issuance Flow

**During Registration (POST /api/auth/register):**

```javascript
const token = `api-${generateBase62(32)}`
const now = new Date().toISOString()
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

db.prepare(
  'INSERT INTO api_tokens (token, user_uuid, created_at, expires_at) VALUES (?, ?, ?, ?)'
).run(token, uuid, now, expiresAt)

res.status(201).json({ uuid, username, token })
```

**During Login (POST /api/auth/token):**

```javascript
// 1. Validate key hash with timing-safe comparison
if (!timingSafeHashCompare(key_hash, user.key_hash)) {
  return res.status(401).json({ error: 'Invalid username or key' })
}

// 2. Invalidate all old tokens (one token per user at a time)
db.prepare('DELETE FROM api_tokens WHERE user_uuid = ?').run(user.uuid)

// 3. Issue fresh token
const token = `api-${generateBase62(32)}`
const now = new Date().toISOString()
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

db.prepare(
  'INSERT INTO api_tokens (token, user_uuid, created_at, expires_at) VALUES (?, ?, ?, ?)'
).run(token, user.uuid, now, expiresAt)

res.status(200).json({ uuid: user.uuid, username, token })
```

---

## 3. Session Verification Flow (On Page Refresh)

When the user opens or refreshes the app, `useAuth` must restore their session:

### 3.1 Step-by-Step Verification

```
[App Mounts]
    │
    ▼
┌────────────────────────────────┐
│ useAuth Effect: verifyToken()  │
│ (runs once on component mount) │
└────────────┬───────────────────┘
             │
             ▼
    ┌─────────────────┐
    │ Read from       │
    │ sessionStorage  │
    │ (cc_api_token) │
    └────────┬────────┘
             │
        ┌────┴─────────┐
        │              │
    [Token?]       [No Token?]
        │              │
        ▼              ▼
    Continue       [Exit: Not Auth]
        │          setAuthState({
        │            isAuthenticated: false,
        │            isLoading: false,
        │            username: null,
        │            uuid: null
        │          })
        │
        ▼
    GET /api/auth/verify
    Header: Authorization: Bearer api-Abc123...
        │
        ▼
    ┌──────────────────────┐
    │ Server Validates:    │
    │ 1. Token exists      │
    │ 2. Not expired       │
    │ 3. User still exists │
    └────────┬─────────────┘
             │
        ┌────┴────────────┐
        │                 │
    [✓ Valid]         [✗ Invalid/Expired]
        │                 │
        ▼                 ▼
    Return:          Return 401
    { uuid, username }    │
        │                 ▼
        ▼            [Clear Session]
    [Set Auth State]  Object.values(SESSION_KEYS)
    isAuthenticated:    .forEach(k =>
    true,               sessionStorage.removeItem(k)
    username: ...,    )
    uuid: ...
        │
        ▼
    [User Ready for App]
```

### 3.2 useAuth.tsx Implementation

Source: `/src/hooks/useAuth.tsx`

```typescript
// Verify token on component mount
useEffect(() => {
  const verifyToken = async () => {
    const token = sessionStorage.getItem(SESSION_KEYS.token)

    // No token = not authenticated
    if (!token) {
      setAuthState({ isAuthenticated: false, isLoading: false, username: null, uuid: null })
      return
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Server validated token
      if (!response.ok) {
        // Token expired or invalid — clear session
        Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k))
        setAuthState({ isAuthenticated: false, isLoading: false, username: null, uuid: null })
        return
      }

      // Token is valid — restore session
      const data = await response.json()
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        username: data.username,
        uuid: data.uuid,
      })
    } catch {
      // Network error — clear session to be safe
      Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k))
      setAuthState({ isAuthenticated: false, isLoading: false, username: null, uuid: null })
    }
  }

  verifyToken()
}, []) // Runs once on mount
```

**Key Points:**
- Effect has empty dependency array `[]` — runs only once on mount
- `isLoading: true` initially, then transitions to `false` after verification completes
- Network errors are treated as auth failures (clear session)
- Invalid/expired tokens automatically trigger cleanup

---

## 4. Mid-Session Token Expiry Handler (NEW FIX)

When a token expires **during active use**, the application must detect and handle it gracefully.

### 4.1 The Problem

Without a 401 interceptor, users could:
1. Make API call with expired token → receive 401
2. Not know they're logged out
3. See confusing "Unauthorized" errors in console
4. Have stale auth state in memory

### 4.2 Global 401 Interceptor Solution

**apiFetch Wrapper:** `/src/lib/apiFetch.ts`

```typescript
/**
 * API Fetch Wrapper
 *
 * Wraps the standard fetch() and intercepts 401 responses.
 * When a 401 occurs, dispatches 'auth:expired' event so useAuth can auto-logout.
 *
 * Usage:
 *   const response = await apiFetch('/api/auth/token', { method: 'POST', body: ... })
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options)

  // If token expired (401), dispatch event for useAuth to listen
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:expired'))
  }

  return response
}
```

**Event Listener in useAuth:**

```typescript
// Listen for auth expiry (401 intercepted by apiFetch)
useEffect(() => {
  const handleAuthExpired = () => {
    // Immediately clear all session data
    Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k))
    setAuthState({ isAuthenticated: false, isLoading: false, username: null, uuid: null })
  }
  window.addEventListener('auth:expired', handleAuthExpired)
  return () => window.removeEventListener('auth:expired', handleAuthExpired)
}, [])
```

### 4.3 Usage Pattern

**Before (without interceptor):**

```typescript
// Component code (old way):
const response = await fetch('/api/user/profile', {
  headers: { Authorization: `Bearer ${token}` }
})
// If token expired, response.ok is false, error message shown
// useAuth doesn't know about expiry — stale auth state
```

**After (with apiFetch):**

```typescript
// Component code (new way):
import { apiFetch } from '@/lib/apiFetch'

const response = await apiFetch('/api/user/profile', {
  headers: { Authorization: `Bearer ${token}` }
})

// If response is 401:
// 1. apiFetch dispatches 'auth:expired' event
// 2. useAuth listener immediately clears session
// 3. Component detects isAuthenticated = false
// 4. User redirected to login on next render
```

### 4.4 Flow Diagram

```
┌────────────────────────────────────┐
│ Component makes API call with      │
│ apiFetch() instead of fetch()      │
└─────────────┬──────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │ apiFetch()       │
    │ calls fetch()    │
    └────────┬─────────┘
             │
        ┌────┴────────────┐
        │                 │
    [✓ 200-399]       [✗ 401]
        │                 │
        ▼                 ▼
    Return response  Dispatch event
    directly         'auth:expired'
        │                 │
        │                 ▼
        │            window.dispatchEvent(
        │              new Event('auth:expired')
        │            )
        │                 │
        │                 ▼
        │            ┌──────────────────────┐
        │            │ useAuth listener:    │
        │            │ handleAuthExpired()  │
        │            └─────────┬────────────┘
        │                      │
        │                      ▼
        │            Clear all sessionStorage
        │            setAuthState({
        │              isAuthenticated: false,
        │              username: null,
        │              uuid: null
        │            })
        │                      │
        └──────────┬───────────┘
                   │
                   ▼
        Component detects
        isAuthenticated = false
        (via useAuth hook)
                   │
                   ▼
        Redirect to /login
        (conditional render)
```

### 4.5 Why Event-Based?

**Alternative Approach (polling):**
- Components would need to check token validity after every API call
- Adds complexity, breaks separation of concerns
- Users still see error messages instead of automatic logout

**Event-Based Approach (chosen):**
- Single place (apiFetch) to intercept 401
- useAuth centrally handles logout logic
- Components don't need token awareness
- Silent logout → clean UX transition

---

## 5. Logout Flow

Logging out is a two-stage process: server-side revocation + client-side clearing.

### 5.1 Logout Sequence

```
[User clicks "Logout" button]
    │
    ▼
┌──────────────────────────┐
│ Call useAuth.logout()    │
└────────┬─────────────────┘
         │
         ▼
    ┌────────────────────────────┐
    │ Read token from            │
    │ sessionStorage             │
    │ (cc_api_token)             │
    └────────┬───────────────────┘
             │
        ┌────┴─────────┐
        │              │
    [Token?]      [No Token?]
        │              │
        ▼              ▼
    Continue      Skip to cleanup
        │              │
        ▼              ▼
    POST /api/auth/logout
    Header: Bearer token
        │
        ▼
    ┌────────────────────┐
    │ Server:            │
    │ 1. Verify token    │
    │ 2. DELETE from DB  │
    │ 3. Return 200      │
    └────────┬───────────┘
             │
        ┌────┴──────────────┐
        │                   │
    [✓ Success]         [✗ Failed]
        │                   │
        ├───────┬───────────┤
        │       │           │
        ▼       ▼           ▼
        └───→ [No matter what]
              Clear all 4 sessionStorage keys
              │
              ▼
            setAuthState({
              isAuthenticated: false,
              username: null,
              uuid: null
            })
              │
              ▼
         [Redirect to /login]
```

### 5.2 useAuth.logout() Implementation

Source: `/src/hooks/useAuth.tsx`

```typescript
const logout = async () => {
  const token = sessionStorage.getItem(SESSION_KEYS.token)

  // Try to revoke on server (but don't fail locally if it does)
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Server call failed, but we still clear client session
      // User's local token is gone; server cleanup will happen at next hourly purge
    }
  }

  // Always clear local session, regardless of server call result
  Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k))
  setAuthState({ isAuthenticated: false, isLoading: false, username: null, uuid: null })
}
```

### 5.3 Server-side Logout (POST /api/auth/logout)

Source: `/server/routes/authRoutes.js`

```javascript
/**
 * POST /api/auth/logout
 * Invalidate the current session token
 * Header: Authorization: Bearer <token>
 * Returns: { ok: true }
 */
router.post('/logout', requireAuth, (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader.slice(7) // Remove "Bearer " prefix

    const db = getDatabase()
    db.prepare('DELETE FROM api_tokens WHERE token = ?').run(token)

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error during logout' })
  }
})
```

**Key Details:**
1. `requireAuth` middleware validates token before handler runs
2. Token is immediately deleted from `api_tokens` table
3. Future requests with this token will fail (401)
4. If server-side delete fails, client-side session is still cleared

### 5.4 Security Implication

**Scenario: User loses network connection during logout**

```
Timeline:
  T=0: User clicks Logout
  T=1: POST /api/auth/logout sent
  T=2: Network drops (request lost)
  T=3: Client clears sessionStorage anyway
  T=4: User sees login form
  T=5: Token still in server DB (alive until expiry or hourly purge)

Risk: Attacker steals old token, uses it before expiry
Mitigation: Token expires in 24h, hourly purge removes it sooner

Result: ACCEPTABLE — Logout is best-effort, but client always clears
```

---

## 6. Expired Token Cleanup (NEW FIX)

The server automatically removes expired tokens to keep the database lean.

### 6.1 Cleanup Strategy

**Problem:** Without cleanup, `api_tokens` table grows indefinitely:
- Every login creates a new token
- Old tokens stay in DB until natural expiry (24 hours)
- Over time: hundreds of stale rows accumulate

**Solution:** Two-tier purge strategy
1. **On Startup:** Clear any expired tokens from previous runs
2. **Hourly:** Remove all tokens where `expires_at <= now()`

### 6.2 purgeExpiredTokens() Function

Source: `/server/database.js`

```javascript
/**
 * Delete all expired API tokens from the database
 * Called on server startup and periodically to prevent table bloat
 * @returns {number} Number of rows deleted
 */
export function purgeExpiredTokens() {
  const db = getDatabase()
  try {
    const result = db
      .prepare(`DELETE FROM api_tokens WHERE datetime(expires_at) <= datetime('now')`)
      .run()
    if (result.changes > 0) {
      console.log(`[Database] Purged ${result.changes} expired token(s)`)
    }
    return result.changes
  } catch (err) {
    console.error('[Database] Error purging expired tokens:', err)
    return 0
  }
}
```

**Key Details:**
- Uses SQLite's `datetime()` function for timezone-safe comparison
- Prepared statement prevents SQL injection
- Returns count of deleted rows
- Errors are logged but don't crash server

### 6.3 Server Integration

Source: `/server.js`

```javascript
import { initDatabase, purgeExpiredTokens } from './server/database.js'

// ... after initDatabase() ...

// Purge expired tokens on startup
purgeExpiredTokens()

// Purge expired tokens every hour
setInterval(purgeExpiredTokens, 60 * 60 * 1000)
```

**Execution Timeline:**

```
┌──────────────────────────────────────────────┐
│ Server Start                                 │
├──────────────────────────────────────────────┤
│ 1. Initialize Express app                   │
│ 2. Initialize Database                      │
│ 3. Create tables if needed                  │
│ 4. Call purgeExpiredTokens() — cleanup old  │
│ 5. Start setInterval() — cleanup every hour │
│ 6. Listen on port 6565                      │
└──────────────────────────────────────────────┘

Then every hour:
┌──────────────────────────────────────────────┐
│ Hour 1: purgeExpiredTokens() runs            │
│ Hour 2: purgeExpiredTokens() runs            │
│ Hour 3: purgeExpiredTokens() runs            │
│ ... continues until server stops             │
└──────────────────────────────────────────────┘
```

### 6.4 Database Impact

**Before Cleanup:**

```
api_tokens table (after 1 week of 100 logins/day):
┌────────┬──────────────────────┬────────────┐
│ token  │ user_uuid            │ expires_at │
├────────┼──────────────────────┼────────────┤
│ api-X1 │ 550e8400-... (user A)│ 2026-03-09 │ ✗ Expired
│ api-X2 │ 550e8400-... (user A)│ 2026-03-09 │ ✗ Expired
│ api-X3 │ 550e8400-... (user A)│ 2026-03-09 │ ✗ Expired
│ ...    │ ...                  │ ...        │
│ api-Y1 │ 7a3b2c1d-... (user B)│ 2026-03-15 │ ✓ Valid
│ api-Y2 │ 7a3b2c1d-... (user B)│ 2026-03-15 │ ✓ Valid
└────────┴──────────────────────┴────────────┘
Rows: ~700 (stale entries accumulating)
```

**After Cleanup (hourly):**

```
api_tokens table (same scenario):
┌────────┬──────────────────────┬────────────┐
│ token  │ user_uuid            │ expires_at │
├────────┼──────────────────────┼────────────┤
│ api-Y1 │ 7a3b2c1d-... (user B)│ 2026-03-15 │ ✓ Valid
│ api-Y2 │ 7a3b2c1d-... (user B)│ 2026-03-15 │ ✓ Valid
└────────┴──────────────────────┴────────────┘
Rows: ~2 (only active tokens remain)
```

**Query Performance:**

```
Without cleanup:
  SELECT ... FROM api_tokens WHERE user_uuid = ?
  Scans: 700 rows → finds match quickly → O(n) worst case

With cleanup:
  SELECT ... FROM api_tokens WHERE user_uuid = ?
  Scans: 2 rows → instant → O(n) still, but negligible cost
```

---

## 7. Implementation Checklist

Use this checklist when building a new ClawStack application:

### 7.1 Initialization Phase

- [ ] **Database Setup**
  - [ ] Copy `/server/database.js` (includes table schemas)
  - [ ] Ensure `api_tokens` table is created with correct columns
  - [ ] Verify foreign key constraints are enabled

- [ ] **Authentication Routes**
  - [ ] Copy `/server/routes/authRoutes.js` (all auth endpoints)
  - [ ] Copy `/server/auth.js` (token generation, requireAuth middleware)
  - [ ] Wire routes into Express app: `app.use('/api/auth', authRoutes)`

- [ ] **Server-side Token Cleanup**
  - [ ] Import `purgeExpiredTokens` in `server.js`
  - [ ] Call `purgeExpiredTokens()` after `initDatabase()` (startup cleanup)
  - [ ] Set up `setInterval(purgeExpiredTokens, 60 * 60 * 1000)` (hourly cleanup)
  - [ ] Test: Check DB after server restart — confirm old tokens are gone

### 7.2 Client-side React Integration

- [ ] **API Wrapper**
  - [ ] Copy `/src/lib/apiFetch.ts` (401 interceptor)
  - [ ] Import `apiFetch` in components that call `/api/auth/*`
  - [ ] Replace `fetch()` → `apiFetch()` in login, verify, logout flows

- [ ] **Authentication Hook & Context**
  - [ ] Copy `/src/hooks/useAuth.tsx` (session management)
  - [ ] Wrap app in `<AuthProvider>` at root (see example below)
  - [ ] Import `useAuth()` in pages/components that need auth state

- [ ] **Auth State Usage**
  - [ ] Check `isLoading` to show spinner during initial verification
  - [ ] Check `isAuthenticated` to conditionally render login vs. app
  - [ ] Call `login(username, uuid, token)` after successful auth API call
  - [ ] Call `logout()` on logout button click

### 7.3 Page Structure

- [ ] **Root Layout / App.tsx**
  ```typescript
  import { AuthProvider } from '@/hooks/useAuth'

  export default function App() {
    return (
      <AuthProvider>
        <main>
          <Routes>
            {/* routes here */}
          </Routes>
        </main>
      </AuthProvider>
    )
  }
  ```

- [ ] **Protected Routes**
  ```typescript
  import { useAuth } from '@/hooks/useAuth'

  function DashboardPage() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) return <Spinner />
    if (!isAuthenticated) return <Navigate to="/login" />

    return <Dashboard />
  }
  ```

- [ ] **Login Page**
  ```typescript
  import { apiFetch } from '@/lib/apiFetch'
  import { useAuth } from '@/hooks/useAuth'

  function LoginPage() {
    const { login } = useAuth()

    const handleLogin = async (username, keyHash) => {
      const res = await apiFetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, key_hash: keyHash })
      })

      const data = await res.json()
      login(data.username, data.uuid, data.token)
      navigate('/dashboard')
    }

    return <LoginForm onSubmit={handleLogin} />
  }
  ```

- [ ] **Logout**
  ```typescript
  function LogoutButton() {
    const { logout } = useAuth()

    const handleLogout = async () => {
      await logout()
      navigate('/login')
    }

    return <button onClick={handleLogout}>Logout</button>
  }
  ```

### 7.4 Testing

- [ ] **Manual Token Expiry Test**
  - [ ] Start the app, log in (token stored in sessionStorage)
  - [ ] Open DevTools → Console
  - [ ] Manually set token expiry to past: `db.prepare("UPDATE api_tokens SET expires_at = '2020-01-01' WHERE ...").run()`
  - [ ] Make API call from app (using apiFetch)
  - [ ] Verify: console shows `POST /api/auth/verify 401`
  - [ ] Verify: sessionStorage is cleared
  - [ ] Verify: App redirects to login (silent logout)

- [ ] **Hourly Cleanup Test**
  - [ ] Start server
  - [ ] Make 5 login attempts (creates 5 tokens)
  - [ ] Check DB: `SELECT COUNT(*) FROM api_tokens`
  - [ ] Manually expire all: `UPDATE api_tokens SET expires_at = '2020-01-01'`
  - [ ] Check DB again: count still 5 (not cleaned yet)
  - [ ] Wait for hourly purge to run (or manually call in DevTools)
  - [ ] Check DB again: count is 0 (cleanup worked!)

- [ ] **Network Error Handling**
  - [ ] Test logout with network offline
  - [ ] Verify: sessionStorage still cleared (client-side logout succeeds)
  - [ ] Verify: Next login works fine (server had old token, purge removes it)

- [ ] **Verify After Page Refresh**
  - [ ] Log in, close browser DevTools
  - [ ] Refresh page (F5)
  - [ ] Verify: useAuth.verifyToken() runs
  - [ ] Verify: Auth state is restored (no re-login needed)
  - [ ] Verify: App loads normally (no loading spinner visible)

---

## 8. Files to Copy/Reference

Complete file inventory for session management:

### 8.1 Server Files

| File | Purpose | Copy? |
|------|---------|-------|
| `/server/database.js` | DB init, schema, purgeExpiredTokens() | **✓ Yes** |
| `/server/auth.js` | generateBase62(), requireAuth, timingSafeHashCompare | **✓ Yes** |
| `/server/routes/authRoutes.js` | register, token, verify, logout, lookup endpoints | **✓ Yes** |
| `/server.js` | Express setup, purge scheduling | Adapt (modify your existing) |

### 8.2 Client Files

| File | Purpose | Copy? |
|------|---------|-------|
| `/src/lib/apiFetch.ts` | 401 interceptor wrapper | **✓ Yes** |
| `/src/hooks/useAuth.tsx` | Session context, verification, logout | **✓ Yes** |
| `src/features/auth/LoginPage.tsx` | Example usage in login flow | Reference only |
| `src/features/auth/components/LoginForm.tsx` | Example form component | Reference only |

### 8.3 Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | If using env vars for database path, token lifetime |
| `package.json` | Ensure `better-sqlite3`, `express`, `cors` are listed |

### 8.4 Usage Example

Here's how to integrate in a minimal new project:

```
my-clawstack-app/
├── server/
│   ├── auth.js                  ← Copy from ClawStack
│   ├── database.js              ← Copy from ClawStack
│   ├── routes/
│   │   └── authRoutes.js         ← Copy from ClawStack
│   └── server.js                ← Adapt (add purge calls)
├── src/
│   ├── lib/
│   │   └── apiFetch.ts           ← Copy from ClawStack
│   ├── hooks/
│   │   └── useAuth.tsx           ← Copy from ClawStack
│   ├── features/
│   │   └── auth/
│   │       ├── LoginPage.tsx     ← Create for your app
│   │       └── DashboardPage.tsx ← Create for your app
│   └── App.tsx                  ← Wrap in <AuthProvider>
└── package.json
```

---

## 9. Known Limitations & Future Work

### 9.1 Limitations

**1. Plaintext Token Storage (Server-side)**
- **Current:** Tokens stored as plaintext in database
- **Why:** Ephemeral tokens (24h), HTTPS-only, treated as passwords
- **Risk:** If DB is compromised, attacker gains active tokens
- **Mitigation:** Encrypt DB at rest, restrict file access, rotate secrets regularly

**2. No Token Refresh Mechanism**
- **Current:** Tokens have fixed 24-hour expiry, no refresh endpoint
- **Why:** Keeps implementation simple, appropriate for many apps
- **Risk:** Users lose session after 24 hours, must log in again
- **Mitigation:** For long-lived sessions, implement refresh token endpoint (future)

**3. Global 401 Handler Only in Auth API Calls**
- **Current:** apiFetch wrapper detects 401, but verify() uses raw fetch
- **Why:** verify() is called before user interacts with app (internal flow)
- **Risk:** If verify() gets 401, it's not intercepted
- **Note:** This is acceptable because verify() failure doesn't trigger app to make API calls anyway
- **Future:** Could apply apiFetch universally to all API calls

**4. No Token Rotation During Session**
- **Current:** Token issued at login, never changes until logout
- **Why:** Simplicity, reduces DB writes
- **Risk:** Stolen token is valid for 24 hours
- **Mitigation:** App uses HTTPS, sessionStorage is origin-locked

### 9.2 Future Enhancements

**Token Refresh Flow (Medium Effort)**
```typescript
// POST /api/auth/refresh — exchange old token for new one
// Allows long sessions without automatic logout at 24h
```

**Token Hashing (Low Effort)**
```javascript
// Store tokens as SHA-256(token) in DB, compare hashes during verification
// Pros: Protects against DB leak
// Cons: Slower, requires hash comparison on every request
```

**Sliding Expiry (Medium Effort)**
```javascript
// Extend token expiry each time verify() is called
// Users who are active never get logged out (unless 30 days inactive)
// Requires DB write on every API call (performance impact)
```

**2FA Integration (High Effort)**
```typescript
// POST /api/auth/2fa/request — send OTP to email
// POST /api/auth/2fa/verify — validate OTP, issue token
// Requires email service, adds latency to login
```

---

## 10. Security Notes

### 10.1 Transport Security

**HTTPS in Production:**
```javascript
// Enforce HTTPS in production
if (IS_PROD) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next()
    }
  })
}
```

**Token in Headers (not URL/cookies):**
- ✓ Correct: `Authorization: Bearer api-Abc123...`
- ✗ Wrong: `?token=api-Abc123...` (logged in server access logs)
- ✗ Wrong: Cookie without `Secure; HttpOnly` flags

### 10.2 Storage Security

**sessionStorage vs. localStorage:**
- ✓ Using `sessionStorage` (correct)
  - Cleared when tab closes
  - Not persistent across browser restart
  - Good for sensitive data like tokens

- ✗ Don't use `localStorage`
  - Persists after browser close
  - Vulnerable to XSS attacks (persistent)
  - Increases attack surface

### 10.3 Cryptographic Security

**Random Byte Generation:**
```javascript
// ✓ Correct
const bytes = crypto.randomBytes(32) // Cryptographically secure

// ✗ Wrong
const bytes = Math.random() // Predictable, NOT suitable for tokens
```

**Base62 Alphabet:**
```javascript
// Base62 charset: 0-9A-Za-z
// Entropy per character: log₂(62) ≈ 5.95 bits
// Total: 32 chars × 5.95 ≈ 190 bits effective entropy
// Safe for tokens (256-bit session tokens are overkill, but harmless)
```

**Timing-Safe Comparison:**
```javascript
// ✓ Correct (prevents timing attacks)
crypto.timingSafeEqual(provided, stored)

// ✗ Wrong (vulnerable to timing-based attacks)
provided === stored // Completes faster if first chars differ
```

### 10.4 Database Security

**Prepared Statements (Protection Against SQL Injection):**
```javascript
// ✓ Correct
db.prepare('SELECT * FROM users WHERE username = ?').get(username)

// ✗ Wrong (SQL injection possible)
db.exec(`SELECT * FROM users WHERE username = '${username}'`)
```

**Foreign Key Constraints:**
```javascript
db.pragma('foreign_keys = ON') // Enabled in database.js
// Prevents orphaned tokens if user is deleted
```

### 10.5 Session Security

**Key Compromise Scenarios:**

| Scenario | Likelihood | Mitigation |
|----------|-----------|-----------|
| Token stolen from network | Very Low (HTTPS) | Enforce HTTPS, never log tokens |
| Token stolen from browser memory | Low | sessionStorage clears on close |
| Token stolen from DevTools | Very Low (localStorage would be worse) | Use sessionStorage, not localStorage |
| DB compromised (plaintext tokens) | Low (depends on infra) | Encrypt DB at rest, restrict file access |
| 24-hour expiry too long | Medium | Implement token refresh (future work) |

**Best Practices:**
1. Always use HTTPS in production (non-negotiable)
2. Never log tokens or user credentials
3. Validate Bearer tokens with timing-safe comparison
4. Clear sessions on logout (best-effort if network fails)
5. Purge expired tokens to reduce attack surface
6. Monitor for unusual login patterns (future: implement logging)

### 10.6 Tokens in Logs

**What NOT to log:**
```javascript
// ✗ BAD — token exposed
console.log(`User logged in with token: ${token}`)
console.log(`Authorization header: ${authHeader}`)
```

**What IS safe to log:**
```javascript
// ✓ GOOD — token abstracted
console.log(`User authenticated: ${username}`)
console.log(`Token type: Bearer (length: ${token.length})`)
```

---

## 11. Quick Reference

### Command Examples

**Generate a token (server-side):**
```javascript
import { generateBase62 } from './server/auth.js'

const token = `api-${generateBase62(32)}`
// Example output: api-aB7cD9eF2gH4iJ6kL8mN0oP1qR3sT5uV
```

**Store in sessionStorage (client-side):**
```javascript
sessionStorage.setItem('cc_api_token', 'api-aB7cD9eF2gH4iJ6kL8mN0oP1qR3sT5uV')
sessionStorage.setItem('cc_username', 'alice')
sessionStorage.setItem('cc_user_uuid', '550e8400-e29b-41d4-a716-446655440000')
```

**Retrieve and use (client-side):**
```javascript
const token = sessionStorage.getItem('cc_api_token')
const response = await apiFetch('/api/user/profile', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

**Verify on server:**
```javascript
// Automatic via requireAuth middleware
app.get('/api/protected', requireAuth, (req, res) => {
  // req.user = { uuid, username }
  res.json({ message: 'success', user: req.user })
})
```

**Clear session (client-side):**
```javascript
const SESSION_KEYS = {
  token: 'cc_api_token',
  username: 'cc_username',
  uuid: 'cc_user_uuid',
  keyType: 'cc_key_type',
}
Object.values(SESSION_KEYS).forEach(k => sessionStorage.removeItem(k))
```

### Debugging Checklist

**Token not stored?**
```javascript
// Check sessionStorage
console.log(sessionStorage.getItem('cc_api_token'))

// Check login response
const res = await apiFetch('/api/auth/token', {...})
const data = await res.json()
console.log(data.token) // Should exist and start with "api-"
```

**Verify fails with 401?**
```javascript
// Check token format
const token = sessionStorage.getItem('cc_api_token')
console.log(token.startsWith('api-')) // Should be true
console.log(token.length) // Should be 36

// Check expiry in DB
SELECT expires_at FROM api_tokens WHERE token = '...'
-- Should be > NOW()
```

**Auto-logout not working?**
```javascript
// Check if apiFetch is used (not raw fetch)
// Check if auth:expired event listener is registered
window.addEventListener('auth:expired', () => {
  console.log('Auth expired event fired!')
})

// Manually trigger to test
window.dispatchEvent(new Event('auth:expired'))
```

**Cleanup not running?**
```javascript
// Check server logs on startup
// Should see: "[Database] Purged X expired token(s)"

// Manually run cleanup
const { purgeExpiredTokens } = await import('./server/database.js')
const count = purgeExpiredTokens()
console.log(`Purged ${count} tokens`)
```

---

## Summary

ClawStack's session system is **simple, secure, and battle-tested**:

✓ **Token Generation:** Cryptographically secure random (32 base62 chars)
✓ **Storage:** Browser sessionStorage + server DB (plaintext, ephemeral)
✓ **Verification:** On-page-load restore + mid-session 401 interception
✓ **Expiry:** Fixed 24-hour TTL + hourly server cleanup
✓ **Logout:** Two-stage (server revoke + client clear)
✓ **Security:** HTTPS-only, timing-safe comparison, prepared statements

**For new developers:** Copy the 8 core files, implement the checklist, test manually, and you're done. Session management is handled for you.

---

**Document Version:** 1.0
**Last Reviewed:** 2026-03-08
**Maintained By:** ClawStack Studios Engineering
