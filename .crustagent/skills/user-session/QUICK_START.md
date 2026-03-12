# User Session Management — Quick Start

**TL;DR for implementing sessions in a new ClawStack app.**

---

## 1. Copy These Files

```bash
# From existing ClawStack project:

# Server files
cp server/auth.js                  → your-app/server/auth.js
cp server/database.js              → your-app/server/database.js
cp server/routes/authRoutes.js     → your-app/server/routes/authRoutes.js

# Client files
cp src/lib/apiFetch.ts             → your-app/src/lib/apiFetch.ts
cp src/hooks/useAuth.tsx           → your-app/src/hooks/useAuth.tsx
```

---

## 2. Wire Up the Server

**In `server.js`:**

```javascript
import { initDatabase, purgeExpiredTokens } from './server/database.js'
import authRoutes from './server/routes/authRoutes.js'

// Initialize DB (do this early)
initDatabase()

// Wire routes
app.use('/api/auth', authRoutes)

// Cleanup old tokens
purgeExpiredTokens()
setInterval(purgeExpiredTokens, 60 * 60 * 1000)

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on :${PORT}`)
})
```

---

## 3. Wrap Your App

**In `App.tsx`:**

```typescript
import { AuthProvider } from '@/hooks/useAuth'
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </AuthProvider>
  )
}
```

---

## 4. Build Your Login Page

```typescript
import { apiFetch } from '@/lib/apiFetch'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (username: string, keyHash: string) => {
    const response = await apiFetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        key_hash: keyHash
      })
    })

    if (!response.ok) {
      console.error('Login failed')
      return
    }

    const { username: u, uuid, token } = await response.json()
    login(u, uuid, token)
    navigate('/dashboard')
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const username = (e.currentTarget.elements.namedItem('username') as HTMLInputElement).value
      const keyHash = (e.currentTarget.elements.namedItem('key_hash') as HTMLInputElement).value
      handleLogin(username, keyHash)
    }}>
      <input name="username" type="text" placeholder="Username" required />
      <input name="key_hash" type="text" placeholder="Key Hash" required />
      <button type="submit">Login</button>
    </form>
  )
}
```

---

## 5. Protect Routes

```typescript
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'

function ProtectedPage() {
  const { isAuthenticated, isLoading, username } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div>
      <h1>Welcome, {username}!</h1>
      {/* Your content here */}
    </div>
  )
}
```

---

## 6. Use apiFetch for API Calls

**Any authenticated endpoint should use apiFetch, not fetch():**

```typescript
import { apiFetch } from '@/lib/apiFetch'
import { useAuth } from '@/hooks/useAuth'

function UserProfile() {
  const { uuid } = useAuth()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await apiFetch(`/api/users/${uuid}`)
      if (response.ok) {
        setUser(await response.json())
      }
    }
    fetchProfile()
  }, [uuid])

  // If token expired during fetch, apiFetch dispatches auth:expired
  // useAuth listener catches it, clears session, user sees login page

  return <div>{user?.name}</div>
}
```

---

## 7. Implement Logout

```typescript
function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout() // Clears session, best-effort server call
    navigate('/login')
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

---

## 8. Test

### Quick Test Checklist

- [ ] **User logs in**
  ```bash
  POST /api/auth/token { username, key_hash }
  → Returns { uuid, username, token }
  → sessionStorage has cc_api_token, cc_username, cc_user_uuid
  ```

- [ ] **Page refresh restores session**
  ```bash
  Refresh browser
  → useAuth.verifyToken() runs
  → GET /api/auth/verify (Bearer token)
  → Auth state restored, no re-login needed
  ```

- [ ] **Token expiry is silent**
  ```bash
  Manually expire token: UPDATE api_tokens SET expires_at = '2020-01-01'
  → Make API call from app
  → Get 401 response
  → apiFetch dispatches auth:expired event
  → useAuth listener clears sessionStorage
  → App redirects to login (no error message)
  ```

- [ ] **Cleanup runs hourly**
  ```bash
  Check server logs on startup
  → Should see "[Database] Purged X expired token(s)"
  → Check again after 1 hour
  → Old tokens are gone from DB
  ```

---

## Session Keys Reference

| Key | Purpose |
|-----|---------|
| `cc_api_token` | Bearer token (`api-XXXXX...`) |
| `cc_username` | Username string |
| `cc_user_uuid` | UUID string |
| `cc_key_type` | Key type (`hu`, `app`, etc.) |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account + issue token |
| POST | `/api/auth/token` | Login with key hash → issue token |
| GET | `/api/auth/verify` | Check if Bearer token is valid |
| POST | `/api/auth/logout` | Revoke Bearer token |
| POST | `/api/auth/lookup` | Find user by key hash |

---

## Troubleshooting

**Q: User gets logged out randomly**
A: Check that apiFetch is being used (not raw fetch). Add logging to auth:expired event.

**Q: Token not restored after page refresh**
A: Verify GET /api/auth/verify is being called. Check network tab—should see 200 response.

**Q: Logout doesn't work**
A: Check that useAuth.logout() is being called. Verify token is being deleted from DB.

**Q: Database keeps growing with old tokens**
A: purgeExpiredTokens() isn't running. Check server startup logs, verify setInterval is set.

---

**Next Steps:**
1. Copy the 5 core files
2. Follow steps 2-7 above
3. Run tests from step 8
4. Read full `SKILL.md` for deep dives

**For questions:** Refer to `SKILL.md` sections 2-10.
