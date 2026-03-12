---
name: clawkeys-complete©™
description: The COMPLETE, end-to-end ClawKeys©™ identity system. Full-stack implementation from database schema through production Docker deployment. One-go implementation guide.
---

# ClawKeys©™ Complete Implementation — The Ocean Floor Blueprint

## 🚀 Overview

This is the **COMPREHENSIVE** skill file for implementing the entire ClawKeys©™ system from zero to production in one coherent pass. It combines all components (backend, frontend, database, crypto, Docker) into a single, logically-ordered sequence.

**Use this skill when:** You need to implement the complete identity system and understand every piece.

**Do NOT use this skill when:** You only need to debug or enhance a single component (use the specialized skills instead).

---

## 📋 Pre-Implementation Checklist

Before starting, verify your environment:

```
✅ Node.js 20+ installed (check: node --version)
✅ npm installed (check: npm --version)
✅ Docker installed (check: docker --version)
✅ git initialized in project (check: git status)
✅ Project structure exists:
   - src/ (React components)
   - server/ (Express backend)
   - public/ (static assets)
   - Dockerfile (multi-stage build)
   - docker-compose.yml (services orchestration)
   - vite.config.ts (frontend config)
✅ Package.json exists with:
   - react, react-dom
   - typescript
   - vite, @vitejs/plugin-react
   - express
   - better-sqlite3 (v11.x for Node 25+)
   - crypto (Node.js built-in)
✅ No existing sessions in sessionStorage (clear browser data if testing)
✅ SQLite database will be created automatically by server on first run
```

---

## 🎯 Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                      CLAWKEYS©™ ARCHITECTURE                         │
└───────────────────────────────────────────────────────────────────────┘

FRONTEND (Vite/React)
┌──────────────────────────────────────────────────────┐
│ src/                                                  │
│ ├── components/                                       │
│ │   ├── auth/                                         │
│ │   │   ├── SetupWizard.tsx      (4-step hatch)    │
│ │   │   ├── LoginForm.tsx        (upload/paste)     │
│ │   │   ├── ProtectedRoute.tsx   (session guard)    │
│ │   │   └── AuthContext.tsx      (state mgmt)       │
│ │   └── Dashboard.tsx            (main app)         │
│ ├── lib/                                              │
│ │   ├── crypto.ts               (client-side hash)  │
│ │   └── identityFile.ts         (JSON validation)   │
│ ├── hooks/                                            │
│ │   └── useAuth.ts              (session hook)      │
│ ├── config/                                           │
│ │   └── apiConfig.ts            (API URL resolution)│
│ └── App.tsx                     (routes, layout)    │
└──────────────────────────────────────────────────────┘
           ↓ HTTP requests (/api/*)
           ↓ Vite proxy: /api → localhost:4242

BACKEND (Express/Node)
┌──────────────────────────────────────────────────────┐
│ server/                                               │
│ ├── db.ts                       (SQLite connection)  │
│ ├── routes/                                           │
│ │   ├── auth.ts                 (register, token)    │
│ │   └── health.ts               (liveness probe)     │
│ ├── middleware/                                       │
│ │   ├── auth.ts                 (bearer token)       │
│ │   └── diagnostics.ts          (request logging)    │
│ └── types.ts                    (TypeScript defs)    │
└──────────────────────────────────────────────────────┘
           ↓ INSERT/SELECT
           ↓
DATABASE (SQLite)
┌──────────────────────────────────────────────────────┐
│ clawchives.db (auto-created on first run)           │
│ ├── users table                                       │
│ │   ├── uuid (PK)                                     │
│ │   ├── username (UNIQUE)                             │
│ │   ├── key_hash (SHA-256 of hu-key)                  │
│ │   └── created_at (ISO-8601)                         │
│ └── api_tokens table                                  │
│     ├── token (PK, api-[32chars])                     │
│     ├── user_uuid (FK → users.uuid)                   │
│     └── created_at (ISO-8601)                         │
└──────────────────────────────────────────────────────┘

DOCKER
┌──────────────────────────────────────────────────────┐
│ Dockerfile (2-stage)                                 │
│ ├── Stage 1: builder (npm install, npm run build)   │
│ └── Stage 2: production (node server.js)             │
│                                                       │
│ docker-compose.yml                                    │
│ ├── frontend: Vite dev server (port 6262)           │
│ ├── backend: Express server (port 4242)             │
│ └── sqlite-volume: persistent DB                     │
└──────────────────────────────────────────────────────┘
```

---

## 📦 Step 1: Package Setup

### Step 1a: Update package.json

Ensure these dependencies exist. If starting fresh, create/update:

```json
{
  "name": "clawchives",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "npm run dev:vite & npm run dev:server",
    "dev:vite": "vite --host 0.0.0.0 --port 6262",
    "dev:server": "node server.js",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node server.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "express": "^4.18.2",
    "better-sqlite3": "^11.1.2",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/express": "^4.17.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/node": "^20.0.0"
  }
}
```

**Critical:** `better-sqlite3` version MUST be **11.x or higher** for Node.js 25 compatibility.

### Step 1b: Install Dependencies

```bash
npm install
```

---

## 🗄️ Step 2: Database Initialization

### Step 2a: Create `server/db.ts`

```typescript
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use environment variable or default to './clawchives.db'
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'clawchives.db')

const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')

// Initialize schema on first run
export function initializeDatabase() {
  // Users table — stores identity info
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uuid TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      key_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // API Tokens table — session tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_tokens (
      token TEXT PRIMARY KEY,
      user_uuid TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_uuid) REFERENCES users(uuid)
    )
  `)

  console.log('✓ Database initialized at:', dbPath)
}

export default db
```

### Step 2b: Verify Schema

When the server starts for the first time, the database file (`clawchives.db`) will be created. You can inspect it:

```bash
# Install sqlite3 CLI if needed
apt-get install sqlite3

# Query the schema
sqlite3 clawchives.db ".schema"

# Expected output:
# CREATE TABLE users (
#   uuid TEXT PRIMARY KEY,
#   username TEXT UNIQUE NOT NULL,
#   key_hash TEXT NOT NULL,
#   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
# );
# CREATE TABLE api_tokens (
#   token TEXT PRIMARY KEY,
#   user_uuid TEXT NOT NULL,
#   created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
#   FOREIGN KEY (user_uuid) REFERENCES users(uuid)
# );
```

---

## 🔐 Step 3: Backend Cryptography & Auth Routes

### Step 3a: Create `server/types.ts`

```typescript
// Request/response type definitions

export interface RegisterRequest {
  uuid: string
  username: string
  keyHash: string
}

export interface RegisterResponse {
  message: string
}

export interface TokenRequest {
  type: 'human' | 'agent'
  uuid: string
  keyHash: string
}

export interface TokenResponse {
  token: string
}

export interface HealthResponse {
  status: 'ok'
  timestamp: string
}

export interface IdentityFile {
  username: string
  uuid: string
  token: string  // raw hu-[64chars] key
  createdAt: string
}
```

### Step 3b: Create `server/routes/health.ts`

```typescript
import { Router, Request, Response } from 'express'

const router = Router()

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  })
})

export default router
```

### Step 3c: Create `server/middleware/diagnostics.ts`

```typescript
import { Request, Response, NextFunction } from 'express'

export function diagnosticLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  const { method, path, body } = req

  // Log request
  console.log(`[${new Date().toISOString()}] ${method} ${path}`)
  if (body && Object.keys(body).length > 0) {
    console.log(`  Body:`, {
      ...body,
      keyHash: body.keyHash ? `${body.keyHash.substring(0, 16)}...` : undefined,
      token: body.token ? `${body.token.substring(0, 10)}...` : undefined
    })
  }

  // Log response
  const originalSend = res.send
  res.send = function (data: any) {
    const duration = Date.now() - startTime
    console.log(`  Response: ${res.statusCode} (+${duration}ms)`)
    return originalSend.call(this, data)
  }

  next()
}

export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.message)
  if (process.env.DEBUG) {
    console.error(err.stack)
  }
  next(err)
}
```

### Step 3d: Create `server/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express'

export interface AuthenticatedRequest extends Request {
  userUuid?: string
  token?: string
}

export function bearerTokenAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.substring(7) // Remove "Bearer "
  req.token = token
  // Token validation happens at the route level (query the database)
  next()
}
```

### Step 3e: Create `server/routes/auth.ts` — Core Auth Logic

```typescript
import { Router, Response } from 'express'
import { timingSafeEqual, randomBytes } from 'crypto'
import db from '../db.js'
import { AuthenticatedRequest, bearerTokenAuth } from '../middleware/auth.js'
import { diagnosticLogger } from '../middleware/diagnostics.js'
import {
  RegisterRequest,
  RegisterResponse,
  TokenRequest,
  TokenResponse,
} from '../types.js'

const router = Router()

// Public endpoint — no auth required
// Step 1 of setup wizard: register user with username + key hash
router.post('/auth/register', diagnosticLogger, async (req, res) => {
  try {
    const { uuid, username, keyHash } = req.body as RegisterRequest

    // Validate inputs
    if (!uuid || !username || !keyHash) {
      return res.status(400).json({
        error: 'Missing required fields: uuid, username, keyHash'
      })
    }

    if (typeof uuid !== 'string' || typeof username !== 'string' || typeof keyHash !== 'string') {
      return res.status(400).json({
        error: 'All fields must be strings'
      })
    }

    // Attempt to insert user
    try {
      const stmt = db.prepare(`
        INSERT INTO users (uuid, username, key_hash, created_at)
        VALUES (?, ?, ?, ?)
      `)
      stmt.run(uuid, username, keyHash, new Date().toISOString())

      const response: RegisterResponse = {
        message: 'User registered successfully'
      }
      res.status(201).json(response)
    } catch (dbError: any) {
      // Check for uniqueness violation
      if (dbError.message.includes('UNIQUE constraint failed')) {
        return res.status(409).json({
          error: 'Username or UUID already registered'
        })
      }
      throw dbError
    }
  } catch (err: any) {
    console.error('[ERROR] /api/auth/register:', err.message)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

// Public endpoint — no auth required
// Step 2 of setup wizard: validate key hash, issue session token
router.post('/auth/token', diagnosticLogger, async (req, res) => {
  try {
    const { type, uuid, keyHash } = req.body as TokenRequest

    // Validate inputs
    if (!type || !uuid || !keyHash) {
      return res.status(400).json({
        error: 'Missing required fields: type, uuid, keyHash'
      })
    }

    if (type !== 'human' && type !== 'agent') {
      return res.status(400).json({
        error: 'type must be "human" or "agent"'
      })
    }

    // Retrieve user by UUID
    const stmt = db.prepare('SELECT * FROM users WHERE uuid = ?')
    const user = stmt.get(uuid) as { uuid: string; key_hash: string } | undefined

    if (!user) {
      // Return generic 404 to avoid enumeration
      return res.status(404).json({
        error: 'User not found'
      })
    }

    // Constant-time comparison of key hashes
    const incomingHashBuffer = Buffer.from(keyHash, 'hex')
    const storedHashBuffer = Buffer.from(user.key_hash, 'hex')

    try {
      timingSafeEqual(incomingHashBuffer, storedHashBuffer)
    } catch {
      // timingSafeEqual throws if lengths don't match
      return res.status(401).json({
        error: 'Invalid key hash'
      })
    }

    // Generate new api-token (format: "api-" + 32 random chars)
    const tokenBytes = randomBytes(24) // 24 bytes = 32 base62 chars approx
    const tokenChars = tokenBytes
      .toString('base64')
      .replace(/[+/=]/g, 'x')  // Replace unsafe chars
      .substring(0, 32)

    const apiToken = `api-${tokenChars}`

    // Store token in database
    const insertStmt = db.prepare(`
      INSERT INTO api_tokens (token, user_uuid, created_at)
      VALUES (?, ?, ?)
    `)
    insertStmt.run(apiToken, uuid, new Date().toISOString())

    const response: TokenResponse = {
      token: apiToken
    }
    res.status(200).json(response)
  } catch (err: any) {
    console.error('[ERROR] /api/auth/token:', err.message)
    res.status(500).json({
      error: 'Internal server error'
    })
  }
})

export default router
```

---

## 🎨 Step 4: Frontend Crypto Utilities

### Step 4a: Create `src/lib/crypto.ts`

```typescript
const BASE62_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const KEY_LENGTH = 64

/**
 * Generate a random human-readable key.
 * Format: "hu-" + 64 random Base-62 characters
 * Total entropy: ~381 bits
 */
export function generateHumanKey(): string {
  const bytes = new Uint8Array(KEY_LENGTH)
  crypto.getRandomValues(bytes)

  const chars = bytes.map(b => BASE62_CHARSET[b % 62])
  return 'hu-' + String.fromCharCode(...chars)
}

/**
 * Generate RFC-4122 v4 UUID.
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Hash a token (key) using SHA-256.
 * Input: "hu-[64chars]" (the raw key)
 * Output: 64-character hex string (256 bits)
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate an identity file structure.
 * Throws if invalid.
 */
export interface IdentityFile {
  username: string
  uuid: string
  token: string
  createdAt: string
}

export function validateIdentityFile(parsed: unknown): IdentityFile {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Identity file must be a JSON object')
  }

  const { username, uuid, token, createdAt } = parsed as Record<string, unknown>

  if (typeof token !== 'string') {
    throw new Error('token field must be a string')
  }
  if (!token.startsWith('hu-')) {
    throw new Error('token must start with "hu-"')
  }
  if (token.length !== 67) {
    throw new Error('token must be exactly 67 characters (hu- + 64 chars)')
  }

  if (typeof uuid !== 'string' || !uuid) {
    throw new Error('uuid is required and must be a non-empty string')
  }
  if (typeof username !== 'string' || !username) {
    throw new Error('username is required and must be a non-empty string')
  }

  return {
    username,
    uuid,
    token,
    createdAt: String(createdAt ?? '')
  }
}
```

### Step 4b: Create `src/config/apiConfig.ts`

```typescript
/**
 * Resolve the API base URL for the current environment.
 *
 * Dev:  http://localhost:4242 (via Vite proxy)
 * Prod: relative root path / (served by same Node instance)
 */
export function getApiBaseUrl(): string {
  // In dev mode (Vite), use the proxied URL
  if (import.meta.env.DEV) {
    // Vite dev server proxies /api to localhost:4242
    // So we can use relative paths, or explicit localhost URL
    // Using '' (relative) is safest for containerized environments
    return ''  // Relative path; Vite proxy handles it
  }

  // In production, the frontend and backend are in the same Docker container
  // served by the same Node instance, so use relative paths
  return ''  // Relative path; browser will use current origin
}

/**
 * Make an authenticated API request.
 * Includes Authorization header if token is in sessionStorage.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`

  const token = sessionStorage.getItem('cc_api_token')
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, {
    ...options,
    headers
  })
}
```

---

## 🔌 Step 5: Auth Context & Hooks

### Step 5a: Create `src/auth/AuthContext.tsx`

```typescript
import React, { createContext, useState, useEffect, ReactNode } from 'react'

export interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  userUuid: string | null
  keyType: 'human' | 'agent' | null
  apiToken: string | null
  login: (username: string, uuid: string, token: string, keyType: 'human' | 'agent') => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const [userUuid, setUserUuid] = useState<string | null>(null)
  const [keyType, setKeyType] = useState<'human' | 'agent' | null>(null)
  const [apiToken, setApiToken] = useState<string | null>(null)

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('cc_api_token')
    const savedUsername = sessionStorage.getItem('cc_username')
    const savedUuid = sessionStorage.getItem('cc_user_uuid')
    const savedKeyType = sessionStorage.getItem('cc_key_type') as 'human' | 'agent' | null

    if (savedToken && savedUsername && savedUuid) {
      setApiToken(savedToken)
      setUsername(savedUsername)
      setUserUuid(savedUuid)
      setKeyType(savedKeyType || 'human')
      setIsAuthenticated(true)
    }
  }, [])

  const login = (username: string, uuid: string, token: string, keyType: 'human' | 'agent') => {
    sessionStorage.setItem('cc_api_token', token)
    sessionStorage.setItem('cc_username', username)
    sessionStorage.setItem('cc_user_uuid', uuid)
    sessionStorage.setItem('cc_key_type', keyType)

    setApiToken(token)
    setUsername(username)
    setUserUuid(uuid)
    setKeyType(keyType)
    setIsAuthenticated(true)
  }

  const logout = () => {
    sessionStorage.removeItem('cc_api_token')
    sessionStorage.removeItem('cc_username')
    sessionStorage.removeItem('cc_user_uuid')
    sessionStorage.removeItem('cc_key_type')

    setApiToken(null)
    setUsername(null)
    setUserUuid(null)
    setKeyType(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      username,
      userUuid,
      keyType,
      apiToken,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Step 5b: Create `src/hooks/useAuth.ts`

```typescript
import { useContext } from 'react'
import { AuthContext, AuthContextType } from '../auth/AuthContext'

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

---

## 🧙 Step 6: Setup Wizard Component

### Step 6a: Create `src/components/auth/SetupWizard.tsx`

This is the 4-step identity hatching flow. **Very long file — here's the complete implementation:**

```typescript
import React, { useState } from 'react'
import { generateHumanKey, generateUUID, hashToken } from '../../lib/crypto'
import { getApiBaseUrl } from '../../config/apiConfig'
import { useAuth } from '../../hooks/useAuth'

type Step = 'welcome' | 'profile' | 'generating' | 'complete'

interface SetupWizardProps {
  onComplete: () => void
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const { login } = useAuth()
  const [step, setStep] = useState<Step>('welcome')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generatedUUID, setGeneratedUUID] = useState<string | null>(null)
  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Step 1: Welcome screen
  const renderWelcome = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4">Before we begin...</h1>
      <div className="space-y-4 text-gray-700">
        <p>
          <strong>No password required.</strong> Your identity lives in a single, unique key file.
        </p>
        <p>
          <strong>This file IS your account.</strong> Lose it, and your account is gone forever — there is no recovery.
        </p>
        <p>
          <strong>Store it safely.</strong> Keep copies in secure locations (password manager, encrypted drive).
        </p>
        <p>
          <strong>You are in control.</strong> No cloud, no accounts, no servers deciding your fate. Your key, your ocean.
        </p>
      </div>
      <button
        onClick={() => setStep('profile')}
        className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>
  )

  // Step 2: Profile entry
  const renderProfile = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Create Your Identity</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="alice"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Alice"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={() => handleGenerateKey()}
        disabled={username.trim() === '' || isProcessing}
        className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Generating...' : 'Generate Key'}
      </button>

      {error && <div className="mt-4 text-red-500">{error}</div>}
    </div>
  )

  // Step 2 handler: trigger generating state
  const handleGenerateKey = () => {
    setIsProcessing(true)
    setError(null)
    setStep('generating')
  }

  // Step 3: Generating spinner
  const renderGenerating = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mb-4"></div>
      <h1 className="text-2xl font-bold mb-2">Hatching your identity...</h1>
      <p className="text-gray-600">Generating cryptographic keys from the chaos of randomness.</p>
    </div>
  )

  // Trigger key generation after 800ms
  React.useEffect(() => {
    if (step === 'generating') {
      const timer = setTimeout(async () => {
        try {
          const key = generateHumanKey()
          const uuid = generateUUID()
          setGeneratedKey(key)
          setGeneratedUUID(uuid)
          setStep('complete')
        } catch (err: any) {
          setError(err.message)
          setStep('profile')
        }
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [step])

  // Step 4: Complete — show key, button to download, button to finish setup
  const renderComplete = () => (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Identity Hatched!</h1>

      <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Username</p>
          <p className="font-mono text-sm">{username}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">ClawKey</p>
          <p className="font-mono text-xs break-words">
            {generatedKey?.substring(0, 20)}…
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">UUID</p>
          <p className="font-mono text-xs">{generatedUUID}</p>
        </div>
      </div>

      <button
        onClick={() => copyClawKey()}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-2"
      >
        Copy ClawKey
      </button>

      <button
        onClick={() => downloadIdentityFile()}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mb-3"
      >
        Download Identity File
      </button>

      <button
        onClick={() => completeSetup()}
        disabled={!hasDownloaded || isProcessing}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-2"
      >
        {isProcessing ? 'Setting up...' : 'Complete Setup'}
      </button>

      <button
        onClick={() => handleBackToReef()}
        className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Back to Reef
      </button>

      {!hasDownloaded && (
        <p className="mt-3 text-xs text-gray-600 text-center">
          Download the identity file before proceeding.
        </p>
      )}

      {error && <div className="mt-4 text-red-500">{error}</div>}
    </div>
  )

  // Copy ClawKey to clipboard
  const copyClawKey = async () => {
    if (!generatedKey) return
    try {
      await navigator.clipboard.writeText(generatedKey)
      // Show "Copied!" confirmation for 2 seconds
      setClipboardMessage('Copied!')
      setTimeout(() => setClipboardMessage(''), 2000)
    } catch (err: any) {
      setError('Failed to copy to clipboard: ' + err.message)
    }
  }

  // Download identity file
  const downloadIdentityFile = () => {
    if (!generatedKey || !generatedUUID) return

    const identityFile = {
      username,
      uuid: generatedUUID,
      token: generatedKey,
      createdAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(identityFile, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clawchives_identity_${username}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setHasDownloaded(true)
  }

  // Navigate back to home
  const handleBackToReef = () => {
    onComplete() // Triggers navigation to landing page
  }

  // Complete setup: call API endpoints and log in
  const completeSetup = async () => {
    if (!generatedKey || !generatedUUID || !hasDownloaded) return

    setIsProcessing(true)
    setError(null)

    try {
      // Hash the key
      const keyHash = await hashToken(generatedKey)

      // Call register endpoint
      const registerUrl = `${getApiBaseUrl()}/api/auth/register`
      const registerResponse = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: generatedUUID,
          username,
          keyHash
        })
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      // Call token endpoint
      const tokenUrl = `${getApiBaseUrl()}/api/auth/token`
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'human',
          uuid: generatedUUID,
          keyHash
        })
      })

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json()
        throw new Error(errorData.error || 'Token exchange failed')
      }

      const { token } = await tokenResponse.json()

      // Log in via context
      login(username, generatedUUID, token, 'human')

      // Trigger completion callback
      onComplete()
    } catch (err: any) {
      setError(err.message || 'Setup failed. Check server connectivity.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {step === 'welcome' && renderWelcome()}
      {step === 'profile' && renderProfile()}
      {step === 'generating' && renderGenerating()}
      {step === 'complete' && renderComplete()}
    </div>
  )
}

export default SetupWizard
```

---

## 🔑 Step 7: Login Form Component

### Unified Login Form Design

The login form uses a **unified, consistent structure** across all ClawStack applications with **theme-aware color randomization**. This ensures visual consistency while allowing each application to express its brand.

#### Form Structure (EXACT Layout)

```
┌──────────────────────────────────────────────────────┐
│  ← Back to Home   [Small outlined button]            │
│                                                      │
│           🦞                                        │
│    [Gradient box with logo]                         │
│                                                      │
│         Welcome Back                                 │
│   Login with your ClawChives©™ identity              │
│                                                      │
│  [Upload File] | [Paste ClawKey©™]                  │
│   [Tab toggle with active underline]                │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  [File upload area or textarea]                │ │
│  │  [Drag-drop or paste instructions]             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ⚠️  Can't find your identity file?                 │
│  [Warning message with Lock icon]                   │
│                                                      │
│  [🔑 Login with Identity File]                      │
│  [Primary gradient button]                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Theme Colors (Application-Driven)

Define three colors based on application theme:

| Role | ClawStack | Purpose |
|------|-----------|---------|
| PRIMARY_COLOR | cyan | Border, tab active, button |
| ACCENT_COLOR | red | Logo gradient, shadows |
| WARNING_COLOR | amber | Security warning box |

**Implementation Note:** When implementing for different applications, the AI chooses colors from the app's palette (e.g., blue, teal, crimson, orange, etc.) to maintain visual harmony.

#### Component Elements

1. **Container**: White/dark bg, rounded-2xl, shadow-xl, border-2 in PRIMARY_COLOR
2. **Back Button**: ArrowLeft + text, small outlined style, top-left
3. **Logo Section**: 🦞 emoji in ACCENT_COLOR gradient box, centered
4. **Header Text**: "Welcome Back" title + subtitle
5. **Tab Toggle**: Upload File | Paste ClawKey buttons (flex, no divider)
6. **Content Area**: File upload (upload mode) or textarea (paste mode)
7. **Warning Box**: AMBER (or WARNING_COLOR) background with Lock icon
8. **Login Button**: PRIMARY_COLOR gradient, full width, Key icon + text

---

### Step 7a: Create `src/components/auth/LoginForm.tsx` — Unified Design

```typescript
import React, { useState } from 'react'
import { validateIdentityFile, hashToken } from '../../lib/crypto'
import { getApiBaseUrl } from '../../config/apiConfig'
import { useAuth } from '../../hooks/useAuth'

type LoginMode = 'upload' | 'paste'

interface LoginFormProps {
  onSuccess: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth()
  const [mode, setMode] = useState<LoginMode>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pastedKey, setPastedKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please select a .json identity file')
      return
    }
    setSelectedFile(file)
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-50')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-50')
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Validate pasted key format (real-time)
  const validateKeyFormat = (key: string): boolean => {
    return key.startsWith('hu-') && key.length === 67
  }

  const handleLogin = async () => {
    if (mode === 'upload' && !selectedFile) return
    if (mode === 'paste' && !validateKeyFormat(pastedKey)) return

    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'upload') {
        // UPLOAD MODE: Read identity file
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsText(selectedFile!)
        })

        // Parse and validate identity file
        const parsed = JSON.parse(text)
        const identity = validateIdentityFile(parsed)

        // Hash key
        const keyHash = await hashToken(identity.token)

        // Exchange for session token
        const response = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'human',
            uuid: identity.uuid,
            keyHash
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Login failed')
        }

        const { token } = await response.json()

        // Log in and navigate
        login(identity.username, identity.uuid, token, 'human')
        onSuccess()
      } else {
        // PASTE MODE: Use lookup endpoint to get uuid
        const keyHash = await hashToken(pastedKey)

        // First, look up uuid + username by keyHash
        const lookupResponse = await fetch(`${getApiBaseUrl()}/api/auth/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyHash })
        })

        if (!lookupResponse.ok) {
          const errorData = await lookupResponse.json()
          throw new Error(errorData.error || 'Key not found')
        }

        const { uuid, username } = await lookupResponse.json()

        // Then exchange for session token
        const tokenResponse = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'human',
            uuid,
            keyHash
          })
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error || 'Authentication failed')
        }

        const { token } = await tokenResponse.json()

        // Log in and navigate
        login(username, uuid, token, 'human')
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Re-enter the Ocean</h1>

      {/* Upload Mode Button */}
      <button
        onClick={() => setMode('upload')}
        className={`w-full px-4 py-3 mb-3 rounded font-semibold transition ${
          mode === 'upload'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Upload ClawKey
      </button>

      {/* Paste Mode Button */}
      <button
        onClick={() => setMode('paste')}
        className={`w-full px-4 py-3 mb-4 rounded font-semibold transition ${
          mode === 'paste'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Paste ClawKey
      </button>

      {/* Upload Mode Content */}
      {mode === 'upload' && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition mb-4"
          >
            <p className="text-gray-600 mb-2">Drop your identity file here</p>
            <p className="text-sm text-gray-400 mb-4">or click to browse</p>

            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="text-blue-600 hover:text-blue-700">Select JSON File</div>
            </label>

            {selectedFile && (
              <p className="mt-4 text-sm font-semibold text-green-600">
                ✓ {selectedFile.name}
              </p>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedFile || isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Authenticating...' : 'Login with File'}
          </button>
        </>
      )}

      {/* Paste Mode Content */}
      {mode === 'paste' && (
        <>
          <textarea
            value={pastedKey}
            onChange={(e) => setPastedKey(e.target.value)}
            placeholder="Paste your hu-[64 character key] here..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 font-mono text-sm"
            rows={4}
          />

          {pastedKey && (
            <div className="mb-4 text-sm">
              {validateKeyFormat(pastedKey) ? (
                <p className="text-green-600">✓ Valid ClawKey format</p>
              ) : (
                <p className="text-red-600">
                  ✗ Must start with "hu-" and be exactly 67 characters
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!validateKeyFormat(pastedKey) || isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-2"
          >
            {isLoading ? 'Authenticating...' : 'Login with Key'}
          </button>
        </>
      )}

      {error && <div className="mt-4 text-red-500 text-sm text-center">{error}</div>}

      {/* Back to Reef Button */}
      <button
        onClick={() => window.location.href = '/'}
        className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Back to Reef
      </button>
    </div>
  )
}

export default LoginForm
```

---

## 🛡️ Step 8: Protected Routes & Auth Checks

### Step 8a: Create `src/components/auth/ProtectedRoute.tsx`

```typescript
import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import LoginForm from './LoginForm'
import SetupWizard from './SetupWizard'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const [showSetup, setShowSetup] = React.useState(false)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {showSetup ? (
            <>
              <SetupWizard onComplete={() => setShowSetup(false)} />
              <button
                onClick={() => setShowSetup(false)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              >
                Already have an identity? Log in
              </button>
            </>
          ) : (
            <>
              <LoginForm onSuccess={() => {}} />
              <button
                onClick={() => setShowSetup(true)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              >
                Create new identity
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
```

---

## 🏗️ Step 9: Main App Layout

### Step 9a: Create `src/App.tsx`

```typescript
import React from 'react'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Dashboard from './components/Dashboard'

function AppContent() {
  const { username, logout } = useAuth()

  return (
    <div>
      {username && (
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">ClawChives</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Logout
            </button>
          </div>
        </nav>
      )}
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

### Step 9b: Create `src/components/Dashboard.tsx`

```typescript
import React from 'react'
import { useAuth } from '../hooks/useAuth'

const Dashboard: React.FC = () => {
  const { username, userUuid, keyType } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold mb-6">Welcome to ClawChives!</h2>

        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Username</p>
            <p className="font-mono text-lg font-semibold">{username}</p>
          </div>

          <div>
            <p className="text-gray-600">User UUID</p>
            <p className="font-mono text-sm">{userUuid}</p>
          </div>

          <div>
            <p className="text-gray-600">Key Type</p>
            <p className="font-mono text-lg">
              {keyType === 'human' ? '🦞 Human' : keyType === 'agent' ? '🤖 Agent' : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            You are authenticated and can access ClawChives features. Your session is stored in
            browser sessionStorage and will be cleared when you close this tab or log out.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
```

---

## 🚀 Step 10: Backend Server Entrypoint

### Step 10a: Create `server.js` (root directory)

```javascript
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import db, { initializeDatabase } from './server/db.js'
import authRoutes from './server/routes/auth.js'
import healthRoutes from './server/routes/health.js'
import { diagnosticLogger, errorLogger } from './server/middleware/diagnostics.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 4242

// Initialize database
initializeDatabase()

// Middleware
app.use(express.json())
app.use(diagnosticLogger)

// API Routes
app.use('/api', healthRoutes)
app.use('/api', authRoutes)

// Serve static frontend (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

// Error handling
app.use(errorLogger)

// Start server
app.listen(PORT, () => {
  console.log(`✓ ClawChives server running on port ${PORT}`)
  console.log(`✓ API available at http://localhost:${PORT}/api`)
})
```

---

## 🐳 Step 11: Docker Configuration

### Step 11a: Verify `Dockerfile` Includes All Assets

```dockerfile
# ✅ CORRECT Dockerfile (as in project root)

FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY index.html vite.config.ts tsconfig*.json ./
COPY postcss.config.js tailwind.config.js ./
COPY src/ ./src/
COPY server/ ./server/

# ✅ REQUIRED: Include public/ folder with static assets
COPY public/ ./public/

RUN npm run build

# Production image
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY server/ ./server/
COPY server.js ./

EXPOSE 6262
CMD ["node", "server.js"]
```

### Step 11b: Create `docker-compose.yml`

```yaml
version: '3.9'

services:
  clawchives:
    build: .
    ports:
      - "6262:6262"
    environment:
      NODE_ENV: production
      PORT: 6262
      DATABASE_PATH: /data/clawchives.db
    volumes:
      - clawchives-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6262/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  clawchives-data:
```

---

## 🧪 Step 12: Testing & Verification

### Complete E2E Test Checklist

```bash
# 1. Start dev servers
npm run dev
# Expect: Vite on 6262, Express on 4242

# 2. Open browser at http://localhost:6262
# Expect: Login form or Setup wizard appears

# 3. Click "Create new identity"
# Expect: 4-step wizard appears

# 4. Complete setup
# - Enter username "testuser"
# - Click "Get Started" → "Generate Key" → wait for generating → "Download" → "Complete Setup"
# Expect: Redirects to Dashboard showing username

# 5. Database verification
sqlite3 clawchives.db "SELECT username FROM users WHERE username='testuser';"
# Expect: testuser

# 6. Logout and log back in
# Click "Logout"
# Expect: Login form appears
# Click "Login with Identity File", select the downloaded JSON file
# Expect: Redirects to Dashboard

# 7. Production build
npm run build
# Expect: dist/ folder with HTML, JS bundles, images

# 8. Docker build
docker build -t clawchives:latest .
docker run -p 6262:6262 clawchives:latest
# Expect: Server starts on port 6262

# 9. Docker test
curl http://localhost:6262/api/health
# Expect: { "status": "ok", "timestamp": "..." }

# 10. Browser test on Docker
# Open http://localhost:6262
# Repeat setup and login flow
# Expect: All works as in dev
```

---

## ⚠️ Key Implementation Rules

### Rule 1: Never Send Raw Key to Server

```typescript
// ❌ WRONG
const response = await fetch('/api/auth/token', {
  body: JSON.stringify({ rawKey: generatedKey })  // DO NOT DO THIS
})

// ✅ CORRECT
const keyHash = await hashToken(generatedKey)
const response = await fetch('/api/auth/token', {
  body: JSON.stringify({ keyHash })
})
```

### Rule 2: Use Constant-Time Comparison on Server

```typescript
// ❌ WRONG (vulnerable to timing attacks)
if (incoming === stored) { /* grant access */ }

// ✅ CORRECT
import { timingSafeEqual } from 'crypto'
timingSafeEqual(incomingBuffer, storedBuffer)  // throws on mismatch
```

### Rule 3: Sessions Are Tab-Scoped

sessionStorage is not persisted across tabs. Users must log in again after:
- Closing browser tab
- Browser restart
- Page refresh

This is intentional. For persistent sessions, use localStorage (not recommended for sensitive tokens).

### Rule 4: Always Validate on Both Client and Server

```typescript
// Client validation (fast feedback)
validateIdentityFile(parsed)

// Server validation (security)
if (!uuid || typeof keyHash !== 'string') {
  return res.status(400).json({ error: '...' })
}
```

### Rule 5: Use Root-Relative Paths for Assets

```typescript
// ✅ CORRECT
<img src="/images/logo.png" alt="Logo" />

// ❌ WRONG
<img src="./images/logo.png" alt="Logo" />
<img src="../images/logo.png" alt="Logo" />
```

---

## 🚨 Troubleshooting

### Issue: `npm install` fails with `better-sqlite3` error

**Cause:** Wrong version of better-sqlite3 (< 11) on Node 25

**Fix:**
```bash
npm install better-sqlite3@11.x
```

### Issue: Dev server runs but pages show "Cannot GET /"

**Cause:** Vite not configured correctly, or SPA fallback missing

**Fix:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6262,
    proxy: {
      '/api': {
        target: 'http://localhost:4242',
        changeOrigin: true
      }
    }
  }
})
```

### Issue: Login succeeds but dashboard doesn't show

**Cause:** useAuth hook not finding AuthContext provider

**Fix:** Wrap your app with `<AuthProvider>` at root level
```typescript
// src/main.tsx
import { AuthProvider } from './auth/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
```

### Issue: API calls 404 in production

**Cause:** Missing `express.static('dist')` in server.js

**Fix:**
```javascript
// server.js
app.use(express.static('dist'))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
```

### Issue: Downloaded identity file is empty or corrupted

**Cause:** Blob creation or download logic error

**Fix:** Verify file creation:
```typescript
const blob = new Blob([JSON.stringify(identityFile, null, 2)], {
  type: 'application/json'
})
console.log('Blob size:', blob.size)  // Should be > 0
```

---

## 🦞 Lobster Wisdom

*"A complete identity is like a complete molt — every piece must be carefully arranged, from the tip of the claw to the last segment of the tail. Rush the process, and you'll emerge broken. Take your time, follow each step, and you'll emerge stronger. The ocean rewards the thorough, not the hasty."*

---

## 📚 Related Skills

- `clawkeys-setup`: Just the 4-step wizard flow
- `clawkeys-login`: Just the login form flow
- `asset-management`: Managing static assets (images, fonts)
- `docker-skills`: Docker and container operations

---

*This SKILL.md is the complete, production-ready ClawKeys©™ implementation guide. It covers all 12 implementation steps from database schema through Docker deployment. Use this as the source of truth for implementing the entire identity system.*

*Updated: March 2026*
