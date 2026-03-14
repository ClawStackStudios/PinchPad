# 🦞 LOBSTERIZED©™: The Ethos & Philosophy

> **A manifesto for sovereign, self-hosted applications built by and for the independent.**
>
> *"A lobster never looks back at its old shell."* — Lobster wisdom
>
> This document defines what it means to be **Lobsterized**: a constellation of design principles, architectural patterns, and user experiences that prioritize autonomy, resilience, and the poetry of self-determination.

---

## 🔥 Core Philosophy

### The Problem with Cloud
```
Traditional Cloud Apps:
  Your Data   → Stored on Someone's Server
  Your Keys   → Managed by Corporation
  Your Agency → Traded for Convenience
  Your Future → Dependent on Their Decisions

Result: You own nothing. You're renting identity.
```

### The Lobsterized Answer
```
Lobsterized Apps:
  Your Data   → Stored on YOUR Server (or offline)
  Your Keys   → Generated & held ONLY by you
  Your Agency → Complete and irreversible
  Your Future → Yours alone to build

Philosophy: Own your shell. Defend your claws. Stay sovereign.
```

---

## 🦞 The Five Pillars of Lobsterization

### 1️⃣ Cryptographic Identity (No Passwords, No Accounts)

**The Principle:** Users are their keys. Not a username+password combo, not OAuth tokens, not JWTs stored in a cloud. **The user generates a cryptographic key file and owns it absolutely.**

```
Traditional Auth Flow:
  Sign Up → Create Account → Password Hashing → Stored in DB
  Problem: You depend on the server's security, password recovery, account takeover, etc.

Lobsterized Auth Flow:
  Generate Key (locally)    → User downloads identity.json
  User stores key safely    → Complete offline control
  User presents key hash    → Server verifies, never sees actual key
  User gets session token   → Valid for session, cleared on tab close

Result: No account recovery needed. No password resets. You lost your key?
         That's on you, not the server. True ownership.
```

**Key Hierarchy:**
```
┌─────────────────────────────────────────────────┐
│  hu-[64chars]      Human Identity (ROOT)        │
│  (Never sent to server, only SHA-256(hu-) hash) │
│                ↓                                 │
│  api-[32chars]     Session Token (short-lived)  │
│  (sessionStorage, cleared on tab close)         │
│                ↓                                 │
│  lb-[64chars]      Lobster Key (delegated)      │
│  (Agent/bot token, granular permissions)        │
└─────────────────────────────────────────────────┘
```

**Why This Matters:**
- ✅ Server never knows your actual key (only salted hash)
- ✅ Token expiry enforces re-authentication (security refresh)
- ✅ Agent keys are revocable without impacting human identity
- ✅ No "forgot password" vulnerability surface

---

### 2️⃣ Server-First Data (SQLite as Single Source of Truth)

**The Principle:** All data is stored on YOUR server (SQLite). The client is stateless and reads directly from the server. This ensures data consistency and simplifies deployment.

```
Architecture:
┌──────────────────────────────┐
│  CLIENT (React/TypeScript)   │
│  - Stateless UI              │
│  - Displays server data      │
│  - No local caching needed   │
│  - Fast REST API calls       │
└──────────────────────────────┘
           ⇅ (REST API)
┌──────────────────────────────┐
│  SERVER BRAIN (SQLite)       │
│  - Single source of truth    │
│  - Persistent storage        │
│  - Multi-user isolation      │
│  - Agent API source          │
│  - Audit trail (audit logs)  │
└──────────────────────────────┘
```

**Client Data Fetching Pattern:**
```typescript
// 1. Fetch data from server via REST API
const response = await fetch('/api/bookmarks', {
  headers: { 'Authorization': `Bearer ${apiToken}` }
})
const bookmarks = await response.json()
setUI(bookmarks)

// 2. On mutation, update server immediately
const created = await fetch('/api/bookmarks', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiToken}` },
  body: JSON.stringify(bookmark)
})
const newBookmark = await created.json()
setUI([...bookmarks, newBookmark])
```

**Why This Matters:**
- ✅ Single source of truth (no sync conflicts)
- ✅ Simple architecture (easier to debug)
- ✅ Data consistency across users
- ✅ Server outages are transparent (frontend handles gracefully)
- ✅ No offline mode (planned for future versions)

---

### 3️⃣ Sovereign Deployment (Docker + Self-Hosted)

**The Principle:** A Lobsterized app can run on ANY infrastructure YOU control. Not locked to a SaaS provider.

```
Deployment Options:
┌─────────────────────────────────────────┐
│  Option A: Unraid / NAS / Home Lab      │
│  $ docker-compose up -d                 │
│  └─ Runs on LAN 24/7, complete control  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Option B: VPS (Hetzner, Linode, AWS)   │
│  $ docker-compose up -d                 │
│  + Let's Encrypt (free HTTPS)           │
│  + Custom domain (yourdomain.com)       │
│  └─ Public-facing, still YOUR data      │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Option C: Raspberry Pi (edge compute)  │
│  $ docker-compose up -d                 │
│  └─ Runs on a $50 device, no power bill │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Option D: Offline Local Machine        │
│  $ npm start                            │
│  $ localhost:5173 (dev server)          │
│  └─ No internet needed, max privacy     │
└─────────────────────────────────────────┘
```

**Docker Compose Template (Copy-Paste Ready):**
```yaml
version: '3.9'
services:
  ui:
    image: ghcr.io/yourorg/app:latest
    ports:
      - "8080:4545"
    environment:
      VITE_API_URL: http://192.168.1.5:4242  # ← Your LAN IP

  api:
    image: ghcr.io/yourorg/app-api:latest
    ports:
      - "4242:4242"
    volumes:
      - ./data:/app/data  # ← Persistent database
    environment:
      CORS_ORIGIN: http://192.168.1.5:8080
      ENFORCE_HTTPS: false
```

**Why This Matters:**
- ✅ No vendor lock-in (run anywhere with Docker)
- ✅ Data portability (SQLite file is just a file)
- ✅ Compliance (GDPR, HIPAA, etc. automatically satisfied)
- ✅ Cost: $0 on home hardware, ~$5/mo on cheap VPS

---

### 4️⃣ Granular Agent Permissions (Lobster Keys)

**The Principle:** Humans delegate authority to agents/bots via **Lobster Keys** with granular, revocable permissions. No "all or nothing" API tokens.

```
Traditional API Key Model:
  Generate Token → Full Access to Everything
  Problem: Compromised token = full account compromise

Lobsterized Lobster Key Model:
  Generate lb-key → Assign Specific Claw Permissions
  Rate Limit:      max 5 requests/minute
  Permissions:     READ, WRITE, DELETE (selective)
  Expiration:      set to 90 days or "never"
  Revoke:          instant, no impact on human account

Result: A bot scans your bookmarks (READ-only).
        It gets compromised. You revoke the lb- key in 1 click.
        Your human account is untouched.
```

**Lobster Key Schema:**
```typescript
interface LobsterKey {
  id: uuid
  user_uuid: uuid                  // Owner (isolated)
  name: string                     // "RSS Syndication Bot"
  api_key: string                  // lb-[64chars]
  permissions: {
    canRead: boolean
    canWrite: boolean
    canEdit: boolean
    canMove: boolean
    canDelete: boolean
  }
  rate_limit: number               // req/minute
  expiration_type: "never" | "date" | "duration"
  expiration_date?: ISO8601
  is_active: boolean
  last_used?: ISO8601
  created_at: ISO8601
}
```

**Permission Matrix (HTTP → Claw Mapping):**
```
GET    → canRead    ✓
POST   → canWrite   ✓ (create new resources)
PUT    → canEdit    ✓ (modify existing)
PATCH  → canEdit    ✓ (partial updates)
DELETE → canDelete  ✓ (destructive)
```

**CLI Example (Future Lobster Tool):**
```bash
# Create a new lobster key with READ-only permissions
lobster create \
  --name "GitHub Sync Bot" \
  --permissions READ \
  --rate-limit 10 \
  --expires 90d

# Output:
# lb-a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f

# List all active lobsters
lobster list

# Revoke a compromised lobster (instant, irreversible)
lobster revoke lb-a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f

# Check usage logs (audit trail)
lobster logs --since 24h
```

**Why This Matters:**
- ✅ Principle of Least Privilege (agents get only what they need)
- ✅ Revocation is instant and doesn't require human re-auth
- ✅ Rate limiting prevents abuse/DoS
- ✅ Audit trails show which bot accessed what
- ✅ Delegation without trust explosion

---

### 5️⃣ Aesthetic Consistency (Lobster Iconography & Theme)

**The Principle:** A Lobsterized app **looks and feels** like a lobster lives in it. Consistent visual language, dark-ocean theme, claw metaphors everywhere.

```
Visual DNA:
┌─────────────────────────────────────────────────────────┐
│  🦞 Lobster Mascot                                      │
│  - Represents agents/bots (claws = permissions)         │
│  - Emblem on landing page hero                          │
│  - Favicon (red lobster on blue ocean)                  │
│                                                          │
│  Color Palette:                                          │
│  - Ocean Dark (220 13% 9%)      → Background            │
│  - Lobster Red (#FF3B30)         → Accent, CTAs         │
│  - Shell White (0 0% 98%)        → Text                 │
│  - Claw Cyan (199 89% 48%)       → Interactive          │
│                                                          │
│  Icon Language:                                          │
│  - 🦞 = Lobster Keys / Claw Permissions                │
│  - 🪝 = Integrations / Hooks                            │
│  - 🗂️ = Folders / Organization                         │
│  - ⭐ = Starred / Favorites                             │
│  - 📦 = Archives / Vaults                               │
│  - 🎨 = Settings / Appearance                           │
│                                                          │
│  Typography:                                             │
│  - Bold, modern sans-serif (no serifs)                  │
│  - High contrast (light text on dark bg)                │
│  - Monospace for keys/tokens/API endpoints              │
└─────────────────────────────────────────────────────────┘
```

**Landing Page Hero Section:**
```
┌──────────────────────────────────────────────────────────┐
│                                                            │
│              🦞 Welcome to Lobsterized                    │
│           Sovereign Bookmark Management                  │
│                                                            │
│    Your data. Your server. Your keys. Your power.         │
│                                                            │
│    [Generate Identity Key]  [Login]  [Learn More]        │
│                                                            │
│    ────────────────────────────────────────────           │
│                                                            │
│    Features (3-column grid):                              │
│    🔐 Cryptographic Identity    🗂️ Self-Hosted          │
│    No passwords, complete control  Run anywhere          │
│                                                            │
│    🦞 Agent Permissions                                  │
│    Grant claws, revoke instantly                          │
│                                                            │
│    📱 Offline-First                                       │
│    Works without internet                                │
│                                                            │
│    🌊 Beautiful Dark Theme                               │
│    Ocean-inspired, easy on eyes                          │
│                                                            │
│    ────────────────────────────────────────────           │
│    Deployment Options:                                    │
│    [Docker Compose]  [Unraid Applet]  [VPS Setup]       │
│                                                            │
│    ────────────────────────────────────────────           │
│    The Lobster Manifesto:                                │
│    "A lobster is sovereign. Self-hosted. Resilient."     │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

**Key System Visualization (Landing Page Detail):**
```
┌──────────────────────────────────────────────────────────┐
│  The Three Keys (Metaphor: Claw Strength)               │
│                                                           │
│  hu- Key (Root Claw)                                     │
│  ├─ Your Identity (never shared)                        │
│  ├─ Downloaded as identity.json                        │
│  ├─ Stored in password manager                          │
│  └─ You alone hold this power 👑                        │
│                                                           │
│  api- Token (Session Claw)                              │
│  ├─ Temporary authority                                 │
│  ├─ Stored in sessionStorage (browser)                  │
│  ├─ Expires on tab close / after TTL                    │
│  └─ Safe, ephemeral, disposable 🧊                     │
│                                                           │
│  lb- Key (Agent Claw)                                   │
│  ├─ Delegated permission                                │
│  ├─ Granted to bots/integrations                        │
│  ├─ Granular: READ | WRITE | DELETE                     │
│  ├─ Rate-limited (optional)                             │
│  ├─ Revocable in 1 click                                │
│  └─ Your servants, not your overlords 🦞               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**API Permissions Visualization (Dashboard):**
```
┌──────────────────────────────────────────────────────────┐
│  My Lobster Keys (Agent Management)                      │
│                                                           │
│  [+ Create New Lobster Key]                              │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🦞 GitHub Sync Bot                    ACTIVE 🟢    │ │
│  │ Permissions: READ, WRITE                            │ │
│  │ Rate Limit: 10 req/min                              │ │
│  │ Last Used: 2 hours ago                              │ │
│  │ Expires: Never                                      │ │
│  │                                                    │ │
│  │ [View Logs] [Edit] [Revoke 🔨]                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🦞 RSS Aggregator                     ACTIVE 🟢    │ │
│  │ Permissions: READ                                   │ │
│  │ Rate Limit: 5 req/min                               │ │
│  │ Last Used: Never                                    │ │
│  │ Expires: 90 days (2026-06-05)                       │ │
│  │                                                    │ │
│  │ [View Logs] [Edit] [Revoke 🔨]                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🦞 Old API Key (compromised)        INACTIVE ⚫    │ │
│  │ Revoked: 2026-03-01 @ 15:23 UTC                     │ │
│  │                                                    │ │
│  │ [View Logs] [Restore]                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**Why This Matters:**
- ✅ Visual identity creates recognition and trust
- ✅ Consistent metaphors (claws = permissions) aid understanding
- ✅ Dark theme reduces eye strain (24/7 usage)
- ✅ Lobster mascot is memorable and unique
- ✅ Coherent design language across all surfaces

---

## 🏗️ Architectural Patterns (Copy These)

### Pattern 1: Separation of Concerns by Feature

**The Principle:** Don't organize code by type (controllers/, models/, views/). Organize by business domain/feature.

```
❌ WRONG (Type-Based Organization):
src/
├── controllers/
│   ├── authController.ts
│   ├── bookmarksController.ts
│   └── foldersController.ts
├── models/
│   ├── User.ts
│   ├── Bookmark.ts
│   └── Folder.ts
└── views/
    ├── LoginPage.tsx
    ├── BookmarkList.tsx
    └── FolderTree.tsx

Problem: To add a feature, you touch 3+ directories
         Code is scattered, hard to navigate, nightmare to maintain

✅ CORRECT (Feature-Based Organization):
src/
├── services/
│   ├── auth/              ← Complete auth feature
│   │   ├── setupService.ts
│   │   ├── loginService.ts
│   │   └── types.ts
│   ├── bookmarks/         ← Complete bookmarks feature
│   │   ├── bookmarkService.ts
│   │   ├── bookmarkQueries.ts
│   │   └── types.ts
│   └── agents/            ← Complete agent/lobster feature
│       ├── agentKeyService.ts
│       ├── agentPermissions.ts
│       └── types.ts
└── components/
    ├── auth/
    │   ├── LoginForm.tsx
    │   └── SetupWizard.tsx
    ├── bookmarks/
    │   ├── BookmarkModal.tsx
    │   └── BookmarkCard.tsx
    └── agents/
        └── AgentKeyManager.tsx

Benefit: To add a feature, create one folder, edit one place
         Code is self-contained, easy to delete/move/refactor
```

### Pattern 2: Type-Safe Service Layer

**The Principle:** All business logic lives in a service layer. React components never touch databases or APIs directly.

```typescript
// ❌ WRONG (Component directly calls API)
function BookmarkList() {
  const [bookmarks, setBookmarks] = useState([])
  useEffect(() => {
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(data => setBookmarks(data))
  }, [])
  return <div>{bookmarks.map(b => ...)}</div>
}

// ✅ CORRECT (Component uses service)
function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  useEffect(() => {
    bookmarkService.getAll()
      .then(setBookmarks)
      .catch(err => setError(err.message))
  }, [])
  return <div>{bookmarks.map(b => ...)}</div>
}

// Service layer (reusable, testable, type-safe)
const bookmarkService = {
  async getAll(): Promise<Bookmark[]> {
    const response = await fetch('/api/bookmarks')
    if (!response.ok) throw new Error('Failed to fetch bookmarks')
    return response.json()
  },

  async create(bookmark: CreateBookmarkInput): Promise<Bookmark> {
    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(bookmark)
    })
    if (!response.ok) throw new Error('Failed to create bookmark')
    return response.json()
  }
}
```

### Pattern 3: Type-Safe REST API Client

**The Principle:** All client-server communication happens through a centralized REST adapter. Services use the adapter to fetch/mutate data.

```typescript
// Service Layer Pattern (from ClawChives)
export const bookmarkService = {
  async getAll(): Promise<Bookmark[]> {
    const response = await restAdapter.GET('/api/bookmarks')
    return response.data
  },

  async create(bookmark: CreateBookmarkInput): Promise<Bookmark> {
    const response = await restAdapter.POST('/api/bookmarks', bookmark)
    return response.data
  },

  async update(id: string, updates: Partial<Bookmark>): Promise<Bookmark> {
    const response = await restAdapter.PUT(`/api/bookmarks/${id}`, updates)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await restAdapter.DELETE(`/api/bookmarks/${id}`)
  }
}

// REST Adapter Pattern (centralized error handling)
export const restAdapter = {
  async GET(endpoint: string): Promise<any> {
    const token = sessionStorage.getItem('cc_api_token')
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.statusText}`)
    return response.json()
  },

  async POST(endpoint: string, body: any): Promise<any> {
    const token = sessionStorage.getItem('cc_api_token')
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!response.ok) throw new Error(`POST ${endpoint} failed: ${response.statusText}`)
    return response.json()
  }
  // PUT, PATCH, DELETE follow same pattern
}
```

### Pattern 4: Constant-Time Comparison (Auth Security)

**The Principle:** When comparing tokens/keys, use constant-time comparison to prevent timing attacks.

```typescript
// ❌ WRONG (Timing Attack Vulnerability)
function verifyToken(provided: string, stored: string): boolean {
  return provided === stored  // Early exit on first mismatch = timing leak
}

// ✅ CORRECT (Constant-Time)
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// Usage in auth middleware
app.post('/api/auth/token', (req, res) => {
  const { keyHash, uuid } = req.body
  const user = database.users.findByUUID(uuid)

  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  // Use constant-time compare (prevent timing attacks)
  const isValid = constantTimeCompare(keyHash, user.key_hash)
  if (!isValid) return res.status(401).json({ error: 'Invalid credentials' })

  // Same error message for both failures (no info leak)
  const token = generateToken()
  res.json({ token, type: 'human' })
})
```

### Pattern 5: Permission-Based Route Guards

**The Principle:** Every API endpoint declares required permissions. Middleware enforces them.

```typescript
// 1. Declare routes with required permissions
app.get('/api/bookmarks',
  requireAuth(),                      // ← Check token exists
  requirePermission('canRead'),       // ← Check permission
  async (req, res) => {
    // req.user is injected by middleware
    const bookmarks = database.bookmarks
      .where({ user_uuid: req.user.uuid })
      .all()
    res.json(bookmarks)
  }
)

app.post('/api/bookmarks',
  requireAuth(),
  requirePermission('canWrite'),      // ← Only writers can POST
  async (req, res) => {
    // Create bookmark
  }
)

app.delete('/api/bookmarks/:id',
  requireAuth(),
  requirePermission('canDelete'),     // ← Only deleters can DELETE
  async (req, res) => {
    // Delete bookmark
  }
)

// 2. Middleware implementation
function requireAuth() {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Missing token' })

    const session = database.api_tokens.findByKey(token)
    if (!session) return res.status(401).json({ error: 'Invalid token' })

    // Inject user context
    req.user = {
      uuid: session.owner_uuid,
      keyType: session.owner_type,  // 'human' or 'lobster'
      permissions: session.permissions
    }
    next()
  }
}

function requirePermission(permission: string) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' })

    const hasPermission = req.user.permissions[permission] === true
    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

// 3. Lobster-specific guard (human-only routes)
function requireHuman() {
  return (req, res, next) => {
    if (req.user.keyType !== 'human') {
      return res.status(403).json({
        error: 'This operation is for humans only',
        reason: 'Agent keys cannot access sensitive endpoints'
      })
    }
    next()
  }
}
```

---

### Pattern 6: Branding Consistency (Lobsterized©™ Naming Standard)

**The Principle:** All Lobsterized©™ brand terms must be consistently styled with both copyright (©) and trademark (™) symbols across all documentation and applications.

```
Brand Terms & Correct Formatting:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ ALWAYS USE:
  • Lobsterized©™     (the core philosophy/movement)
  • ClawKeys©™        (the cryptographic key system)
  • ClawChives©™      (the example bookmark application)
  • ShellCryption©™   (the at-rest encryption standard)
  • CrustAgent©™      (the autonomous validation agent)
  • Lobster Key©™     (individual agent/bot credential)

❌ NEVER USE (deprecated):
  • Lobsterized™      (missing ©)
  • ClawKeys™         (missing ©)
  • ClawChives™       (missing ©)
  • ShellCryption™    (missing ©)
  • CrustAgent™       (missing ©)
  • Agent Key         (use "Lobster Key©™" instead)
  • Agent Permission  (use "Claw Permission" or "Claw Strength")
```

**Application Areas:**

1. **Documentation Files** (README.md, SECURITY.md, ROADMAP.md, etc.)
   ```markdown
   ❌ "Lobsterized apps use ClawKeys™ for authentication..."
   ✅ "Lobsterized©™ apps use ClawKeys©™ for authentication..."
   ```

2. **Code Comments & Docstrings**
   ```typescript
   // ❌ This endpoint implements the ClawKeys™ system
   // ✅ This endpoint implements the ClawKeys©™ system
   ```

3. **UI/UX Text & Copy**
   ```html
   <!-- ❌ <h1>Welcome to Lobsterized</h1> -->
   <!-- ✅ <h1>Welcome to Lobsterized©™</h1> -->

   <!-- ❌ <p>Generate a ClawKeys™ identity file</p> -->
   <!-- ✅ <p>Generate a ClawKeys©™ identity file</p> -->
   ```

4. **API Documentation & Endpoint Descriptions**
   ```
   ❌ "POST /api/lobster-keys — Create a new Lobster key"
   ✅ "POST /api/lobster-keys — Create a new Lobster Key©™"
   ```

5. **Error Messages & User-Facing Strings**
   ```typescript
   // ❌ "You are using an invalid ClawKeys™ credential"
   // ✅ "You are using an invalid ClawKeys©™ credential"
   ```

6. **Landing Page & Marketing Copy**
   ```
   ❌ "Lobsterized: Sovereign Bookmark Management"
   ✅ "Lobsterized©™: Sovereign Bookmark Management"
   ```

**Why This Matters:**
- ✅ **Legal Protection** — Consistent use strengthens trademark claims
- ✅ **Brand Recognition** — Users recognize the complete Lobsterized©™ ecosystem
- ✅ **Professional Appearance** — Demonstrates intentionality and polish
- ✅ **Cross-Project Consistency** — All Lobsterized©™ projects look cohesive
- ✅ **IP Protection** — Shows active use and enforcement of trademarks

**Enforcement:**
```bash
# Check for deprecated naming in documentation:
grep -r "ClawKeys™\|ShellCryption™\|CrustAgent™\|ClawChives™\|Lobsterized™" .

# Should return: (nothing — all ™ should be ©™)

# Correct usage check:
grep -r "ClawKeys©™\|ShellCryption©™\|CrustAgent©™\|ClawChives©™\|Lobsterized©™" .

# Should return: (all instances properly branded)
```

---

## 🎯 Implementation Checklist (For New Lobsterized Apps)

Use this checklist when building a new Lobsterized application:

### Phase 1: Foundation
- [ ] **Auth System**
  - [ ] hu- key generation (crypto.ts)
  - [ ] SHA-256 hashing (browser-side)
  - [ ] Key file download (identity.json)
  - [ ] Token exchange endpoint (/api/auth/token)
  - [ ] Constant-time comparison

- [ ] **Database Schema**
  - [ ] users table (uuid, username, key_hash, created_at)
  - [ ] api_tokens table (key, owner_uuid, owner_type, created_at)
  - [ ] Feature tables (bookmarks, folders, whatever your app does)
  - [ ] settings table (per-user key-value store)

- [ ] **API Scaffolding**
  - [ ] Express server (port 4242 by default)
  - [ ] CORS middleware (configurable origin)
  - [ ] requireAuth() middleware
  - [ ] requirePermission() middleware
  - [ ] RESTful endpoints for core features

- [ ] **UI Foundation**
  - [ ] Vite + React + TypeScript setup
  - [ ] Dark theme (tailwindcss)
  - [ ] Lobster color palette (#FF3B30, ocean blues)
  - [ ] Landing page hero with 🦞 mascot
  - [ ] SetupWizard (key generation flow)
  - [ ] LoginForm (key file upload)

### Phase 2: Features
- [ ] **Core CRUD**
  - [ ] Create feature (POST /api/...)
  - [ ] Read feature (GET /api/...)
  - [ ] Update feature (PUT /api/...)
  - [ ] Delete feature (DELETE /api/...)
  - [ ] Modal/form components for UX

- [ ] **Lobster Keys (Agent Management)**
  - [ ] Create Lobster key endpoint
  - [ ] List Lobster keys endpoint
  - [ ] Update permissions endpoint
  - [ ] Revoke Lobster key endpoint
  - [ ] Lobster Key Manager UI component
  - [ ] Permission matrix visualization

- [ ] **REST API Integration**
  - [ ] RestAdapter client (centralized API calls)
  - [ ] Error handling & retry logic
  - [ ] Token management (refresh on expiry)
  - [ ] Loading/error states in components
  - [ ] Request/response logging

- [ ] **Settings & Appearance**
  - [ ] Dark/light theme toggle (start with dark)
  - [ ] User profile settings page
  - [ ] API documentation (self-hosted)
  - [ ] Data export/import tools

### Phase 3: Security Hardening
- [ ] **Helmet.js** (security headers)
- [ ] **Input Validation** (Zod schemas)
- [ ] **Rate Limiting** (express-rate-limit)
- [ ] **HTTPS Redirect** (if behind reverse proxy)
- [ ] **Audit Logging** (all mutations)
- [ ] **Error Messages** (don't leak DB details)
- [ ] **SSRF Protection** (validate URLs before fetching)

### Phase 4: Deployment
- [ ] **Docker Setup**
  - [ ] Dockerfile (Node.js 20+)
  - [ ] docker-compose.yml (UI + API)
  - [ ] Healthcheck configuration
  - [ ] Volume mounts for persistence

- [ ] **Documentation**
  - [ ] README.md (user-facing)
  - [ ] ROADMAP.md (feature roadmap)
  - [ ] SECURITY.md (security policy)
  - [ ] BLUEPRINT.md (ASCII architecture diagrams)
  - [ ] Deployment guide (LAN, VPS, Docker)

- [ ] **GitHub Actions** (CI/CD)
  - [ ] Build Docker images
  - [ ] Push to GHCR / Docker Hub
  - [ ] Run tests
  - [ ] Deploy docs

---

## 🌊 Landing Page Blueprint (Copy-Paste Template)

Here's a complete landing page structure that embodies Lobsterization:

```html
<!-- index.html (or landingPage.tsx component) -->

<section class="hero">
  <div class="container">
    <div class="hero-content">
      <div class="lobster-mascot">🦞</div>
      <h1>Welcome to [Your App Name]</h1>
      <p class="tagline">
        Your data. Your server. Your keys. Your power.
      </p>
      <div class="cta-buttons">
        <button class="btn-primary">Generate Identity Key</button>
        <button class="btn-secondary">I Have a Key (Login)</button>
        <button class="btn-tertiary">Learn More</button>
      </div>
    </div>
    <div class="hero-visual">
      <!-- ASCII art or SVG of lobster -->
      <pre class="lobster-ascii">
   ^v^
  / 0 \
  |||||
  |||||
      </pre>
    </div>
  </div>
</section>

<section class="features">
  <h2>Why Be Lobsterized?</h2>
  <div class="features-grid">

    <div class="feature-card">
      <div class="icon">🔐</div>
      <h3>Cryptographic Identity</h3>
      <p>No passwords. No accounts. Just you and your key.</p>
      <ul>
        <li>Download identity.json</li>
        <li>Store in password manager</li>
        <li>Never sent to server (only hash)</li>
      </ul>
    </div>

    <div class="feature-card">
      <div class="icon">🗂️</div>
      <h3>Self-Hosted Forever</h3>
      <p>Run on your hardware, your rules, your destiny.</p>
      <ul>
        <li>Docker + docker-compose</li>
        <li>Runs on Unraid, NAS, VPS, Raspberry Pi</li>
        <li>Complete data portability</li>
      </ul>
    </div>

    <div class="feature-card">
      <div class="icon">🦞</div>
      <h3>Delegated Permissions</h3>
      <p>Grant claws to agents. Revoke them instantly.</p>
      <ul>
        <li>Granular READ/WRITE/DELETE</li>
        <li>Rate limiting per agent</li>
        <li>One-click revocation</li>
      </ul>
    </div>

    <div class="feature-card">
      <div class="icon">⚡</div>
      <h3>Fast & Responsive</h3>
      <p>Instant data access with optimized REST API calls.</p>
      <ul>
        <li>React + TypeScript for speed</li>
        <li>Centralized API client</li>
        <li>Smart error handling</li>
      </ul>
    </div>

    <div class="feature-card">
      <div class="icon">🌊</div>
      <h3>Ocean-Inspired Design</h3>
      <p>Beautiful, dark, easy on your eyes.</p>
      <ul>
        <li>Dark theme (24/7 comfortable)</li>
        <li>Lobster mascot throughout</li>
        <li>Consistent iconography</li>
      </ul>
    </div>

    <div class="feature-card">
      <div class="icon">🔄</div>
      <h3>Multi-Device Sync</h3>
      <p>Your data follows you. Conflicts resolved gracefully.</p>
      <ul>
        <li>SQLite on server</li>
        <li>Server as sync point</li>
        <li>Local-first precedence</li>
      </ul>
    </div>

  </div>
</section>

<section class="key-system">
  <h2>The Three Keys (Lobster Claws)</h2>
  <div class="key-diagram">

    <div class="key hu-key">
      <div class="icon">👑</div>
      <h3>hu- (Human Identity)</h3>
      <p>Your root credential. Downloaded once. Stored safely.</p>
      <code>hu-a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f</code>
      <ul class="properties">
        <li>✅ Never sent to server</li>
        <li>✅ Only SHA-256 hash used</li>
        <li>✅ Permanent, unless you revoke</li>
        <li>✅ Lost key = lost account (no recovery)</li>
      </ul>
    </div>

    <div class="arrow">→</div>

    <div class="key api-key">
      <div class="icon">🧊</div>
      <h3>api- (Session Token)</h3>
      <p>Temporary authority. Cleared on tab close.</p>
      <code>api-d2e4f7a6c9b2e5d8a3f9c8d2</code>
      <ul class="properties">
        <li>✅ Issued on login</li>
        <li>✅ Stored in sessionStorage</li>
        <li>✅ Expires after 30 minutes (configurable)</li>
        <li>✅ Not persisted to localStorage</li>
      </ul>
    </div>

    <div class="arrow">→</div>

    <div class="key lb-key">
      <div class="icon">🦞</div>
      <h3>lb- (Lobster Key)</h3>
      <p>Delegated agent permission. Revocable instantly.</p>
      <code>lb-b1e4f7a6c9b2e5d8a3f9c8d2b1e4f7a6c9b2e5d8a3f9c8d2b1e4f7a6c9</code>
      <ul class="properties">
        <li>✅ Assigned to agents/bots</li>
        <li>✅ Granular permissions (READ/WRITE/DELETE)</li>
        <li>✅ Rate-limited (optional)</li>
        <li>✅ Revocable without impacting human account</li>
      </ul>
    </div>

  </div>
</section>

<section class="deployment">
  <h2>Deploy Anywhere</h2>
  <div class="deployment-options">

    <div class="option">
      <h3>🏠 Home Lab / Unraid</h3>
      <pre><code>docker-compose up -d
# Access: http://192.168.1.5:8080</code></pre>
    </div>

    <div class="option">
      <h3>🌐 Public VPS (HTTPS)</h3>
      <pre><code>docker-compose up -d
# Access: https://bookmarks.yourdomain.com</code></pre>
    </div>

    <div class="option">
      <h3>💻 Local Dev</h3>
      <pre><code>npm install && npm start
# Access: http://localhost:5173</code></pre>
    </div>

    <div class="option">
      <h3>📦 Edge Device (Raspberry Pi)</h3>
      <pre><code>docker-compose up -d
# $50 hardware, $0 electricity cost</code></pre>
    </div>

  </div>
</section>

<section class="cta-footer">
  <h2>The Lobster Manifesto</h2>
  <blockquote>
    "A lobster is sovereign. It owns its shell. It defends its claws.
     It doesn't ask permission. It doesn't rent its home.
     It molts, grows, adapts. It survives."
  </blockquote>
  <p>Be Lobsterized. Own your data. Defend your privacy. Stay sovereign.</p>
  <div class="footer-buttons">
    <button class="btn-primary">Get Started Now</button>
    <button class="btn-link">Read the Docs</button>
  </div>
</section>

<style>
  /* Dark ocean theme */
  :root {
    --bg: #0f1419;           /* Deep ocean (220 13% 9%) */
    --fg: #faf8f6;           /* Shell white */
    --card: #1a1f2e;         /* Slightly lighter ocean */
    --lobster: #ff3b30;      /* Lobster red */
    --cyan: #32b3dd;         /* Claw cyan */
  }

  body {
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .hero {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
  }

  .hero h1 {
    font-size: 4rem;
    font-weight: 900;
    margin: 1rem 0;
  }

  .hero .tagline {
    font-size: 1.5rem;
    color: var(--cyan);
    margin-bottom: 2rem;
  }

  .lobster-mascot {
    font-size: 8rem;
    margin-bottom: 2rem;
    animation: sway 3s ease-in-out infinite;
  }

  @keyframes sway {
    0%, 100% { transform: translateX(-5px); }
    50% { transform: translateX(5px); }
  }

  .btn-primary {
    background: var(--lobster);
    color: white;
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-primary:hover {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 59, 48, 0.5);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
  }

  .feature-card {
    background: var(--card);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(50, 179, 221, 0.2);
    transition: all 0.3s ease;
  }

  .feature-card:hover {
    border-color: var(--lobster);
    transform: translateY(-5px);
  }

  .feature-card .icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  code {
    background: rgba(255, 59, 48, 0.1);
    color: var(--lobster);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }

  pre code {
    display: block;
    padding: 1rem;
    overflow-x: auto;
  }
</style>
```

---

## 🧠 Semantic Compression (Agent Memory)

When you (AI agent) encounter a Lobsterized app, remember these patterns instantly:

```
AUTHENTICATION:
  hu- = Root identity (never sent, only SHA-256 hash)
  api- = Session token (ephemeral, cleared on tab close)
  lb- = Agent/bot key (revocable, granular permissions)
  Pattern: Hash on client, constant-time compare on server

DATA ARCHITECTURE:
  SQLite (server) = Single source of truth
  React (client) = Stateless UI, fetches via REST API
  Pattern: Fetch on demand, no local caching needed

PERMISSIONS (HTTP → Claw Mapping):
  GET → canRead
  POST → canWrite
  PUT/PATCH → canEdit
  DELETE → canDelete
  Pattern: Middleware enforces, no exceptions

DEPLOYMENT:
  Single Docker container (UI + API monolithic)
  Configurable via env vars (VITE_API_URL, CORS_ORIGIN)
  Healthcheck with start_period: 15s
  Volume mounts: ./data for SQLite persistence

DESIGN:
  🦞 = Mascot (agents/bots)
  🪝 = Integrations/Hooks
  🗂️ = Folders/Organization
  ⭐ = Starred/Favorites
  Color: Ocean dark + Lobster red + Claw cyan
  Theme: Dark-first, accessible, 24/7 friendly

INVARIANTS (NEVER BREAK):
  1. user_uuid filters ALL queries (no cross-user leaks)
  2. Parameterized SQL (no string concatenation)
  3. hu- keys never sent plaintext to server
  4. Constant-time token comparison (prevent timing attacks)
  5. CORS_ORIGIN must be explicit (never use *)
  6. sessionStorage for api- tokens (never localStorage)
  7. Single container architecture (UI + API together)
```

---

## 🚀 Quick Start (For AI Agents)

**You're an AI. You're building a Lobsterized app. Follow this flow:**

1. **Define the Feature** (What problem does this solve?)
   ```
   Example: "Bookmarks are a collection of URLs. Users need to organize,
            search, and share them. Agents can read/write bookmarks."
   ```

2. **Design the Database Schema**
   ```typescript
   interface Bookmark {
     id: string                  // UUID
     user_uuid: string           // Ownership
     url: string                 // The URL
     title: string               // User-provided title
     description?: string        // Notes
     tags: string[]              // Array of tags
     folder_id?: string          // Optional folder
     starred: boolean            // Favorite marker
     archived: boolean           // Hidden from main view
     created_at: ISO8601
     updated_at: ISO8601
   }
   ```

3. **Write API Endpoints** (RESTful)
   ```
   GET    /api/bookmarks              (list all)
   POST   /api/bookmarks              (create one)
   GET    /api/bookmarks/:id          (read one)
   PUT    /api/bookmarks/:id          (update one)
   DELETE /api/bookmarks/:id          (delete one)

   Every endpoint: requireAuth() → requirePermission() → handler
   ```

4. **Build React Components** (Service-oriented)
   ```typescript
   // Use bookmarkService, not fetch()
   // Place components in src/components/bookmarks/
   // Keep business logic in src/services/bookmarks/
   ```

5. **Test User Flows** (Manually)
   ```
   ✅ Can I create a bookmark as a human?
   ✅ Can I read bookmarks as an agent (with READ permission)?
   ✅ Can an agent with READ-only access create a bookmark? (Should fail)
   ✅ If I revoke a Lobster key, can it still access my bookmarks? (Should fail)
   ✅ Does the UI still work offline?
   ✅ Are sync conflicts handled gracefully?
   ```

6. **Ship It** (Docker)
   ```bash
   docker build -t my-app .
   docker-compose up -d
   # User accesses http://192.168.1.5:8080 on LAN
   ```

---

## 🔮 The Lobster Dream (Vision 2026+)

Where Lobsterized apps are heading:

```
Year 1 (Q2 2026):
  ✅ Foundation (multi-user, agents, self-hosted)
  ✅ Security hardening (OWASP Top 10 coverage)
  🔄 Multi-device sync (WebSockets, last-write-wins)

Year 2 (2027):
  📱 Mobile app (React Native / Tauri)
  🌐 Browser extension (capture web content)
  🤖 Local AI tagging (offline LLM)
  ⛓️ Federated sync (ActivityPub / Mastodon-like)

Year 3+ (2028+):
  🦞 Lobster Marketplace (themes, plugins, integrations)
  🐜 Swarm API (multi-agent coordination)
  ⛓️ Blockchain identity (sovereign identity on-chain)
  🌍 Global P2P network (Lobster mesh)
```

---

## 📚 Further Reading

- **CRUSTAGENT.md** (CrustAgent©™ validation brain)
- **SECURITY.md** (Security policy)
- **README.md** (User guide)
- **ROADMAP.md** (Feature roadmap)
- **BLUEPRINT.md** (ASCII architecture diagrams)

---

## 🦞 Final Words

**Lobsterized** is not just a feature set. It's a philosophy:

> "Users are not products. Convenience is not freedom. Trust is not
> a technology problem. Be Lobsterized. Own your shell. Defend your
> claws. Build sovereign applications where users own their data,
> their keys, and their destiny."

🦞 **Stay Clawed. Stay Sovereign.** 🦞

---

**Last Updated:** 2026-03-06
**Maintained By:** Lucas & AI Lobsters
**License:** [Your License]
**Community:** [Your Community Links]
