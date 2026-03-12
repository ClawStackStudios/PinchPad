---
name: clawstack-code-standards©™
description: Production-ready code standards for all ClawStack applications. Enforces logging discipline, error handling patterns, auth conventions, and security hardening across the ClawStack ecosystem.
status: ✅ Implemented & Enforced
---

# ClawStack Code Standards — Structural Scaffolding

## 🎯 Purpose

This skill defines the **non-negotiable code standards** that all ClawStack applications must follow to maintain consistency, security, and maintainability across the ecosystem. These standards are discovered through real implementation, tested in production, and documented here for all future applications.

When VibeCheck audits run across ClawStack apps, this skill defines what "correct" looks like.

---

## 📋 Standards Overview

| Category | Standard | Rationale |
|----------|----------|-----------|
| **Logging** | Zero `console.*` in production paths | Prevents sensitive data exposure (key hashes, usernames, tokens) |
| **Auth State** | `sessionStorage` with `cc_*` prefix | Consistent session key naming across all apps |
| **Error Handling** | State-based errors only (`setError()`) | Errors surfaced to UI, never buried in console |
| **Security** | No `process.env` in frontend | Environment variables don't exist in browser context |
| **Components** | ErrorBoundary wrapper on auth routes | Catch unhandled errors, prevent silent failures |
| **Validation** | Shared regex module | DRY: single source of truth for validation rules |
| **Auth Patterns** | Timing-safe comparison for tokens | Defend against timing attacks |

---

## 🚫 Logging Discipline — CRITICAL

### Rule: Zero `console.log` / `console.error` in Production Code

**Files affected:**
- `src/hooks/useAuth.tsx`
- `src/features/auth/components/*.tsx`
- `server/routes/authRoutes.js`
- `server/auth.js`

**Why this matters:**
- Debug logs expose sensitive data: key hashes (SHA-256), usernames, request payloads
- Production server logs can be scraped, exposing validation patterns to attackers
- Browser DevTools console history persists — users may share logs in support tickets, leaking credentials

### Implementation Pattern

**❌ WRONG:**
```typescript
// LoginForm.tsx
const handleAuth = async () => {
  const keyHash = await hashToken(pastedKey)
  console.log('Generated key hash:', keyHash)  // ❌ EXPOSES HASH
  console.log('Username:', username)           // ❌ EXPOSES USERNAME

  const response = await fetch('/api/auth/token', { ... })
  console.error('Auth failed:', response)      // ❌ UNCONTROLLED LOGGING
}
```

**✅ CORRECT:**
```typescript
// LoginForm.tsx — errors flow through state only
const handleAuth = async () => {
  try {
    setIsLoading(true)
    setError(null)

    const keyHash = await hashToken(pastedKey)
    const response = await fetch('/api/auth/token', { ... })
    const data = await response.json()

    login(data.username, data.uuid, data.token)
    navigate('/')
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Authentication failed')
  } finally {
    setIsLoading(false)
  }
}
```

### Exception: Development-Only Logging

Dev-only logging is acceptable when gated:

```typescript
// ✅ ACCEPTABLE for debugging in dev
if (import.meta.env.DEV) {
  console.log('[SetupWizard] Generated key:', key.slice(0, 10) + '...')
}
```

Or in React error boundaries (naturally dev-gated):

```typescript
// ✅ ACCEPTABLE — only fires in dev mode
export class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary] Caught error:', error) // ✅ OK
  }
}
```

### Backend Logging Pattern

**❌ WRONG:**
```javascript
// server/routes/authRoutes.js
router.post('/register', (req, res) => {
  const { username, key_hash } = req.body
  console.log('[Auth] Register request:', { username, key_hash })  // ❌ LOGS CREDENTIALS
  console.log('[Auth] Validation failed: username invalid -', username) // ❌ LEAKS USERNAME

  if (!USERNAME_REGEX.test(username)) {
    console.log('[Auth] Username validation failed:', username)    // ❌ AGAIN
    return res.status(400).json({ error: 'Invalid username' })
  }
})
```

**✅ CORRECT:**
```javascript
// server/routes/authRoutes.js — errors return JSON only
router.post('/register', (req, res) => {
  const { username, key_hash } = req.body

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: 'Invalid username format' })
  }

  if (!KEY_HASH_REGEX.test(key_hash)) {
    return res.status(400).json({ error: 'Invalid key hash format' })
  }

  // Proceed with registration...
})
```

**For critical errors only**, minimal logging:
```javascript
// server/auth.js — only errors that indicate problems
try {
  const user = db.prepare('SELECT ...').get(token)
  // ...
} catch (err) {
  console.error('[DB] Token lookup failed')  // ✅ Generic, no sensitive data
  res.status(500).json({ error: 'Server error' })
}
```

---

## 🔐 Session Storage Standards

### Rule: Use `sessionStorage` with `cc_*` Prefix

All ClawStack applications must use consistent session key names:

**File:** `src/hooks/useAuth.tsx`

```typescript
const SESSION_KEYS = {
  token: 'cc_api_token',           // API session token
  username: 'cc_username',         // Authenticated username
  uuid: 'cc_user_uuid',            // User UUID
  keyType: 'cc_key_type',          // Key type (always 'hu' for ClawKeys)
} as const
```

**Why this matters:**
- Consistent across all ClawStack apps (Studios, Chives, future apps)
- `cc_` prefix makes keys instantly recognizable in DevTools
- `sessionStorage` (not `localStorage`) — token cleared on tab close
- Type-safe access: `SESSION_KEYS.token` not magic strings `'cc_api_token'`

### ❌ Common Mistakes

```typescript
// ❌ WRONG — environment variable doesn't exist in browser
const SESSION_KEYS = {
  token: process.env.TOKEN,  // Always undefined in browser!
  ...
}

// ❌ WRONG — inconsistent naming
const STORAGE_KEYS = {
  token: 'authToken',
  user: 'currentUser',
  ...
}

// ❌ WRONG — localStorage instead of sessionStorage
localStorage.setItem('cc_api_token', token)  // Persists across sessions!
```

### ✅ Correct Usage

```typescript
// In login flow
const login = (username: string, uuid: string, token: string) => {
  sessionStorage.setItem(SESSION_KEYS.token, token)
  sessionStorage.setItem(SESSION_KEYS.username, username)
  sessionStorage.setItem(SESSION_KEYS.uuid, uuid)
  sessionStorage.setItem(SESSION_KEYS.keyType, 'hu')
  setAuthState({ isAuthenticated: true, isLoading: false, username, uuid })
}

// In logout flow
const logout = async () => {
  Object.values(SESSION_KEYS).forEach((k) => sessionStorage.removeItem(k))
  setAuthState({ isAuthenticated: false, isLoading: false, username: null, uuid: null })
}

// On refresh — verify token is still valid
const verifyToken = async () => {
  const token = sessionStorage.getItem(SESSION_KEYS.token)
  if (!token) return  // Not logged in

  const response = await fetch('/api/auth/verify', {
    headers: { Authorization: `Bearer ${token}` }
  })
  // ...
}
```

---

## 🛡️ Error Handling Standards

### Rule: All Errors Flow Through State, Never Silent

**Files affected:**
- `src/components/ErrorBoundary.tsx` (NEW)
- `src/App.tsx` (updated)
- `src/features/auth/components/*.tsx`
- `src/hooks/useAuth.tsx`

### Pattern 1: Component-Level Error State

```typescript
// LoginForm.tsx
export const LoginForm: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAuthenticate = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Async operation
      const response = await fetch('/api/auth/token', { ... })
      if (!response.ok) throw new Error('Auth failed')

      const data = await response.json()
      login(data.username, data.uuid, data.token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="text-red-600">{error}</div>}
      {isLoading && <LoadingSpinner />}
      <button onClick={handleAuthenticate}>Login</button>
    </div>
  )
}
```

### Pattern 2: App-Level Error Boundary

```typescript
// src/components/ErrorBoundary.tsx — catches ALL unhandled errors
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // Dev-only logging is fine
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught:', error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}

// App.tsx
<ErrorBoundary>
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* ... */}
      </Routes>
    </BrowserRouter>
  </AuthProvider>
</ErrorBoundary>
```

---

## ✅ Validation Module Pattern

### Rule: Single Source of Truth for Validation Regexes

**File:** `src/lib/validation.ts`

```typescript
// ✅ CORRECT — shared, DRY validation
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/
export const KEY_HASH_REGEX = /^[a-f0-9]{64}$/

export const validateUsername = (username: string): boolean =>
  USERNAME_REGEX.test(username)

export const validateKeyHash = (hash: string): boolean =>
  KEY_HASH_REGEX.test(hash)
```

**Usage in components:**
```typescript
// SetupWizardStep2Profile.tsx
import { validateUsername, USERNAME_REGEX } from '../../../lib/validation'

export const SetupWizardStep2Profile = ({ username, onUsernameChange }) => {
  const isValid = validateUsername(username)

  return (
    <input
      value={username}
      onChange={(e) => onUsernameChange(e.target.value)}
      pattern={USERNAME_REGEX.source}
    />
  )
}
```

**Usage on server:**
```javascript
// server/routes/authRoutes.js
import { USERNAME_REGEX } from '../lib/validation.js'

router.post('/register', (req, res) => {
  const { username } = req.body

  if (!USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: 'Invalid username format' })
  }
  // ...
})
```

---

## 🔑 ClawKeys Security Patterns

### Timing-Safe Token Comparison

**File:** `server/auth.js`

```typescript
// ✅ CORRECT — use crypto.timingSafeEqual
export function timingSafeHashCompare(provided: string, stored: string): boolean {
  const providedBuf = Buffer.from(provided, 'hex')
  const storedBuf = Buffer.from(stored, 'hex')

  // Skip length check — inputs are pre-validated as /^[a-f0-9]{64}$/
  // Both will always be exactly 32 bytes

  return crypto.timingSafeEqual(providedBuf, storedBuf)
}

// Token verification in auth middleware
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Single DB query — database is timing-safe
  const row = db.prepare(`
    SELECT user_uuid, username FROM api_tokens
    WHERE token = ? AND datetime(expires_at) > datetime('now')
  `).get(token)

  if (!row) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  req.user = { uuid: row.user_uuid, username: row.username }
  next()
}
```

### Identity File Format

```typescript
// crypto.ts — identity file contains the raw hu- key
export function downloadIdentityFile(username: string, uuid: string, key: string) {
  const identity = {
    username,
    uuid,
    key,           // Raw hu-* key for re-login
    createdAt: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(identity, null, 2)])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${username}-identity.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## 📋 Audit Checklist

Use this checklist when implementing new ClawStack applications:

### Pre-Implementation
- [ ] Copy `.project/skills/` directory from existing ClawStack app
- [ ] Copy `src/lib/validation.ts` from ClawStack Studios or Chives
- [ ] Copy `src/components/ErrorBoundary.tsx`
- [ ] Copy `src/hooks/useAuth.tsx` template

### Code Review (Pre-Commit)
- [ ] Search codebase for `console.log` → should find zero
- [ ] Search codebase for `console.error` → should find zero (except in ErrorBoundary)
- [ ] Search frontend code for `process.env` → should find zero (not in React components)
- [ ] Verify `SESSION_KEYS` uses `cc_*` prefix naming
- [ ] Verify all errors use `setError()` state pattern
- [ ] Verify auth middleware uses timing-safe comparison or DB-level query
- [ ] Verify identity file contains raw `hu-*` key, not token
- [ ] Verify `sessionStorage` is used, NOT `localStorage`

### Run VibeCheck
```bash
# This should pass with zero findings in logging/auth standards
npm run vibecheck auth logging security
```

### Manual Testing
- [ ] Register new identity — no console logs exposed
- [ ] Login with file upload — no console logs exposed
- [ ] Login with paste key — no console logs exposed
- [ ] Logout — session cleared, all `cc_*` keys removed
- [ ] Refresh page while logged in — token verified silently, no console logs
- [ ] Trigger an unhandled error — ErrorBoundary catches it, shows UI

---

## 🔗 Related Skills

- `clawkeys-setup` — Setup wizard implementation (uses these standards)
- `clawkeys-login` — Login flow implementation (uses these standards)
- `clawkeys-complete` — Full auth system (reference implementation)
- `crustaudit` — Security audit patterns (enforces these standards)

---

## 📝 Changes Log

| Date | Change | Apps Affected |
|------|--------|---------------|
| 2026-03-08 | Initial standard documented | ClawStack Studios, ClawChives (retroactive) |
| TBD | Remove timing-safe loop from `auth.js` | All apps (simplification) |
| TBD | Add rate limiting to `/register`, `/token` | All apps (security hardening) |

---

## 🎯 Future Extensions (Planned)

These standards will expand to cover:
- **02** — Logging framework (structured logs, audit trails)
- **04** — Rate limiting patterns
- **06** — Input validation (Zod schema integration)
- **07** — HTTPS redirect enforcement
- **09** — Token expiration patterns

---

**Last Updated:** 2026-03-08
**Status:** ✅ Actively Enforced
**Next Review:** When new ClawStack application is created
