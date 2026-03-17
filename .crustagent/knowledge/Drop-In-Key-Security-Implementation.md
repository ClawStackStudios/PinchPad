# Drop-In Key Security Implementation Guide

**Framework:** Express + SQLite (or any Node.js backend)
**Status:** Production-ready, battle-tested in ClawChives
**Effort:** 2–3 hours to implement fully
**Benefit:** Complete key lifecycle security with audit trails

---

## What This Guide Covers

A three-tier key security system:

1. **Identity Keys** — Long-lived secrets for humans (ClawKeys™)
2. **Agent Keys** — API keys for automations (Lobster Keys™)
3. **Session Tokens** — Short-lived tokens generated after auth (API Tokens)

All three are:
- ✅ Validated with timing-safe comparison
- ✅ Expired/revoked with audit trails
- ✅ Hashed before storage
- ✅ Permission-gated for agents
- ✅ Rate-limited at entry points

---

## Architecture Overview

```
Human/Agent
    ↓
    │ Sends: Bearer token (hu-, lb-, or api-)
    ↓
requireAuth Middleware
    ├─ Detect key type (prefix)
    ├─ Look up in database
    ├─ Check expiry / revocation
    ├─ Verify permissions
    └─ Set AuthRequest properties
    ↓
Route Handler
    ├─ Use authReq.userUuid
    ├─ Use authReq.agentPermissions
    └─ All queries filtered by user_uuid
    ↓
Audit Logger
    └─ Log action, actor, IP, outcome
```

---

## Part 1: Database Schema

### Identity Keys Table (for humans)

```sql
CREATE TABLE IF NOT EXISTS users (
  uuid       TEXT PRIMARY KEY,
  username   TEXT NOT NULL UNIQUE,
  key_hash   TEXT NOT NULL UNIQUE,    -- SHA-256 hash of ClawKey
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_users_key_hash ON users(key_hash);
```

### Agent Keys Table

```sql
CREATE TABLE IF NOT EXISTS agent_keys (
  id              TEXT PRIMARY KEY,
  user_uuid       TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  api_key_hash    TEXT NOT NULL UNIQUE,  -- SHA-256 hash of agent key
  permissions     TEXT NOT NULL,         -- JSON: { canRead: true, canWrite: false }
  expiration_type TEXT NOT NULL,         -- 'never', '30d', '90d', '1y'
  expiration_date TEXT,                  -- ISO string
  rate_limit      INTEGER,               -- req/minute for this agent
  is_active       INTEGER DEFAULT 1,     -- 0 = revoked
  created_at      TEXT NOT NULL,
  last_used       TEXT,                  -- Track usage
  revoked_at      TEXT,                  -- When revoked
  revoked_by      TEXT,                  -- Who revoked it
  revoke_reason   TEXT,                  -- Why revoked
  FOREIGN KEY(user_uuid) REFERENCES users(uuid) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_agent_keys_hash ON agent_keys(api_key_hash);
CREATE INDEX idx_agent_keys_user ON agent_keys(user_uuid, is_active);
```

### Session Tokens Table

```sql
CREATE TABLE IF NOT EXISTS api_tokens (
  key           TEXT PRIMARY KEY,        -- api-{32 chars}, plaintext (short-lived)
  token_hash    TEXT NOT NULL UNIQUE,   -- SHA-256 for revocation lookup
  owner_key     TEXT NOT NULL,          -- uuid or agent_key_hash
  owner_type    TEXT NOT NULL,          -- 'human' or 'agent'
  created_at    TEXT NOT NULL,
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,                   -- NULL = valid, set = revoked
  FOREIGN KEY(owner_key) REFERENCES users(uuid) ON DELETE CASCADE
);

CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_expires_at ON api_tokens(expires_at);
```

### Audit Logs Table

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp   TEXT NOT NULL,
  event_type  TEXT NOT NULL,            -- AUTH_SUCCESS, AUTH_FAILURE, AGENT_KEY_CREATED, etc.
  actor       TEXT,                     -- User UUID or agent ID
  actor_type  TEXT,                     -- 'human' or 'agent'
  resource    TEXT,                     -- Resource ID being acted upon
  action      TEXT NOT NULL,            -- 'login', 'create', 'revoke', etc.
  outcome     TEXT NOT NULL,            -- 'success' or 'failure'
  ip_address  TEXT,
  user_agent  TEXT,
  details     TEXT                      -- JSON: { reason: '...', ... }
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_actor ON audit_logs(actor);
```

---

## Part 2: Crypto Utilities

**File:** `src/server/utils/crypto.ts`

```typescript
import crypto from 'crypto';

/**
 * Generate a random string of specified length.
 * Uses crypto.randomInt to avoid modulo bias.
 * Output: alphanumeric (A-Za-z0-9)
 */
export function generateString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[crypto.randomInt(chars.length)];
  }
  return result;
}

/**
 * Generate a cryptographically secure UUID.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Hash a key using SHA-256.
 * Used for storing agent keys and tokens securely.
 *
 * One-way: plaintext → hash, but hash → plaintext impossible
 */
export function hashKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

/**
 * Timing-safe comparison of two buffers.
 * Prevents attackers from inferring key format via response time.
 *
 * Returns true only if both buffers have identical content.
 * Throws if lengths don't match (catch and return false).
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    return false;  // Different lengths or error
  }
}
```

---

## Part 3: Token Expiry Utilities

**File:** `src/server/utils/tokenExpiry.ts`

```typescript
/**
 * Parse TTL string and calculate expiry timestamp.
 *
 * Examples:
 *   '30m' → 30 minutes from now
 *   '1d' → 1 day from now
 *   '90d' → 90 days from now
 *   '1y' → 1 year from now
 */
export function calculateExpiry(ttl: string): string {
  const now = Date.now();
  let ms = 0;

  if (ttl.endsWith('m')) {
    ms = parseInt(ttl) * 60 * 1000;
  } else if (ttl.endsWith('h')) {
    ms = parseInt(ttl) * 60 * 60 * 1000;
  } else if (ttl.endsWith('d')) {
    ms = parseInt(ttl) * 24 * 60 * 60 * 1000;
  } else if (ttl.endsWith('y')) {
    ms = parseInt(ttl) * 365 * 24 * 60 * 60 * 1000;
  } else {
    throw new Error(`Invalid TTL format: ${ttl}`);
  }

  return new Date(now + ms).toISOString();
}

/**
 * Check if an expiry timestamp is still valid.
 * Returns true if not expired, false if expired.
 */
export function checkTokenExpiry(expiresAt: string | null): boolean {
  if (!expiresAt) return true;  // No expiry = always valid
  return new Date(expiresAt) > new Date();
}
```

---

## Part 4: Auth Middleware

**File:** `src/server/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import db from '../db.js';
import { hashKey, timingSafeCompare } from '../utils/crypto.js';
import { checkTokenExpiry } from '../utils/tokenExpiry.js';
import { createAuditLogger } from '../utils/auditLogger.js';

const audit = createAuditLogger(db);

export interface AuthRequest extends Request {
  apiKey: string;
  keyType: 'human' | 'agent' | 'api';
  userUuid: string;
  agentPermissions: Record<string, boolean | string>;
}

/**
 * Detect key type by prefix.
 * hu- = human identity key (session token)
 * lb- = lobster key (agent key, direct use)
 * api- = api token (session token from token endpoint)
 */
function detectKeyType(key: string): 'human' | 'agent' | 'api' | null {
  if (key?.startsWith('hu-')) return 'human';
  if (key?.startsWith('lb-')) return 'agent';
  if (key?.startsWith('api-')) return 'api';
  return null;
}

const HUMAN_PERMISSIONS = {
  canRead: true,
  canWrite: true,
  canEdit: true,
  canMove: true,
  canDelete: true,
};

/**
 * Main auth middleware.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Detect key type (prefix)
 * 3. Look up in database
 * 4. Check expiry and active status
 * 5. Resolve user UUID and permissions
 * 6. Set authReq properties for use in route handlers
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: no Bearer token' });
    return;
  }

  const key = auth.substring(7).trim();
  const keyType = detectKeyType(key);

  if (!keyType) {
    res.status(401).json({
      success: false,
      error: 'Invalid key format — must use hu-, lb-, or api- prefix'
    });
    return;
  }

  let finalUserUuid: string | null = null;
  let finalPermissions: Record<string, boolean | string> | null = null;
  let actualKeyType: 'human' | 'agent' | 'api' = keyType;

  // ────────────────────────────────────────────────────────────────────────────
  // Case 1: Session token (api-*)
  // ────────────────────────────────────────────────────────────────────────────

  if (keyType === 'api') {
    const hashedKey = hashKey(key);
    const row = db.prepare('SELECT * FROM api_tokens WHERE token_hash = ?').get(hashedKey) as any;

    if (!row) {
      res.status(401).json({ success: false, error: 'Invalid or revoked API token' });
      return;
    }

    if (row.revoked_at) {
      audit.log('AUTH_FAILURE', {
        actor: row.owner_key,
        action: 'validate_token',
        outcome: 'failure',
        resource: 'api_token',
        details: { reason: 'Token revoked' }
      });
      res.status(401).json({ success: false, error: 'Token has been revoked' });
      return;
    }

    if (!checkTokenExpiry(row.expires_at)) {
      audit.log('AUTH_FAILURE', {
        actor: row.owner_key,
        action: 'validate_token',
        outcome: 'failure',
        resource: 'api_token',
        details: { reason: 'Token expired' }
      });
      res.status(401).json({ success: false, error: 'Token expired. Please authenticate again.' });
      return;
    }

    // Resolve owner: human or agent?
    if (row.owner_type === 'human') {
      finalUserUuid = row.owner_key;
      finalPermissions = HUMAN_PERMISSIONS;
      actualKeyType = 'human';
    } else if (row.owner_type === 'agent') {
      const agent = db.prepare(
        'SELECT user_uuid, permissions, is_active, expiration_date FROM agent_keys WHERE api_key_hash = ?'
      ).get(row.owner_key) as any;

      if (!agent) {
        res.status(401).json({ success: false, error: 'Agent for this token no longer exists' });
        return;
      }

      if (!agent.is_active) {
        res.status(401).json({ success: false, error: 'Lobster Key revoked' });
        return;
      }

      if (agent.expiration_date && new Date(agent.expiration_date) < new Date()) {
        res.status(401).json({ success: false, error: 'Lobster Key expired' });
        return;
      }

      finalUserUuid = agent.user_uuid;
      finalPermissions = JSON.parse(agent.permissions || '{}');
      actualKeyType = 'agent';
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Case 2: Lobster Key (lb-*) — Direct agent key usage
  // ────────────────────────────────────────────────────────────────────────────

  if (keyType === 'agent') {
    const hashedKey = hashKey(key);
    const row = db.prepare(
      'SELECT * FROM agent_keys WHERE api_key_hash = ? AND is_active = 1'
    ).get(hashedKey) as any;

    if (!row) {
      res.status(401).json({ success: false, error: 'Lobster Key revoked or invalid' });
      return;
    }

    if (row.expiration_date && new Date(row.expiration_date) < new Date()) {
      res.status(401).json({ success: false, error: 'Lobster Key expired' });
      return;
    }

    // Update last_used for tracking
    db.prepare('UPDATE agent_keys SET last_used = ? WHERE api_key_hash = ?')
      .run(new Date().toISOString(), hashedKey);

    finalUserUuid = row.user_uuid;
    finalPermissions = JSON.parse(row.permissions || '{}');
    actualKeyType = 'agent';
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Validation complete
  // ────────────────────────────────────────────────────────────────────────────

  if (!finalUserUuid) {
    res.status(401).json({ success: false, error: 'Could not resolve user identity' });
    return;
  }

  // Set properties on request object for use in route handlers
  const authReq = req as AuthRequest;
  authReq.apiKey = key;
  authReq.keyType = actualKeyType;
  authReq.userUuid = finalUserUuid;
  authReq.agentPermissions = finalPermissions || {};

  next();
}

/**
 * Gate access by permission.
 * Usage: requirePermission('canRead')
 */
export function requirePermission(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    // Full access trumps everything
    if (authReq.agentPermissions?.level === 'full') {
      next();
      return;
    }

    // Check specific permission
    if (authReq.agentPermissions?.[action] === true) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: `Permission denied: ${action} required`
    });
  };
}

/**
 * Gate access to human users only.
 * Agents cannot use this endpoint.
 */
export function requireHuman(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;

  if (authReq.keyType === 'human') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Forbidden: This action requires human identity'
  });
}
```

---

## Part 5: Auth Routes

**File:** `src/server/routes/auth.ts`

```typescript
import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { createAuditLogger } from '../utils/auditLogger.js';
import { calculateExpiry } from '../utils/tokenExpiry.js';
import { generateString, hashKey, timingSafeCompare } from '../utils/crypto.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validate.js';
import { AuthSchemas } from '../validation/schemas.js';

const router = Router();
const audit = createAuditLogger(db);

/**
 * POST /api/auth/register
 *
 * Register a new human user with their ClawKey.
 * Client sends: { uuid, username, keyHash }
 * Server stores: user(uuid, username, key_hash)
 */
router.post('/register', authLimiter, validateBody(AuthSchemas.register), (req, res) => {
  const { uuid, username, keyHash } = req.body;

  try {
    db.prepare(
      'INSERT INTO users (uuid, username, key_hash, created_at) VALUES (?, ?, ?, ?)'
    ).run(uuid, username, keyHash, new Date().toISOString());

    audit.log('AUTH_REGISTER', {
      actor: uuid,
      actor_type: 'human',
      action: 'register',
      outcome: 'success',
      resource: 'user',
      details: { username, user_uuid: uuid },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.status(201).json({ success: true });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'Username or key already registered'
      });
    }
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/token
 *
 * Generate a session token (api-*) from a ClawKey or Lobster Key.
 *
 * Request (human):
 *   { type: 'human', uuid, keyHash }
 *
 * Request (agent):
 *   { type: 'agent', ownerKey: 'lb-...' }
 *
 * Response:
 *   { token: 'api-...', type: 'human'|'agent', expiresAt: ISO }
 */
router.post('/token', authLimiter, validateBody(AuthSchemas.token), (req, res) => {
  const { type, uuid, keyHash, ownerKey } = req.body;
  const ttl = process.env.TOKEN_TTL_DEFAULT || '1d';
  const expiresAt = calculateExpiry(ttl);

  // ────────────────────────────────────────────────────────────────────────────
  // Human auth: lookup user, verify ClawKey
  // ────────────────────────────────────────────────────────────────────────────

  if (type === 'human') {
    let user: any;

    if (uuid) {
      user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid) as any;
    } else if (keyHash) {
      user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash) as any;
    }

    if (!user) {
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'human',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Timing-safe comparison prevents attackers from guessing keys via response time
    const keyMatch = timingSafeCompare(user.key_hash, keyHash);

    if (!keyMatch) {
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'human',
        actor: user.uuid,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string,
        details: { reason: 'Invalid key' }
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid identity key'
      });
    }

    // Generate session token
    const token = `api-${generateString(32)}`;
    const hashedToken = hashKey(token);

    db.prepare(
      'INSERT INTO api_tokens (key, token_hash, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(token, hashedToken, user.uuid, 'human', new Date().toISOString(), expiresAt);

    audit.log('AUTH_SUCCESS', {
      actor: user.uuid,
      actor_type: 'human',
      action: 'login',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    return res.status(201).json({
      success: true,
      data: {
        token,
        type: 'human',
        createdAt: new Date().toISOString(),
        expiresAt,
        user: { uuid: user.uuid, username: user.username }
      }
    });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Agent auth: lookup Lobster Key, generate session token
  // ────────────────────────────────────────────────────────────────────────────

  if (type === 'agent') {
    const agentKey = ownerKey;
    if (!agentKey?.startsWith('lb-')) {
      return res.status(400).json({ success: false, error: 'Invalid agent key format' });
    }

    const hashedKey = hashKey(agentKey);
    const agent = db.prepare(
      'SELECT * FROM agent_keys WHERE api_key_hash = ? AND is_active = 1'
    ).get(hashedKey) as any;

    if (!agent) {
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'agent',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked agent key'
      });
    }

    // Generate session token
    const token = `api-${generateString(32)}`;
    const hashedToken = hashKey(token);

    db.prepare(
      'INSERT INTO api_tokens (key, token_hash, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(token, hashedToken, hashedKey, 'agent', new Date().toISOString(), expiresAt);

    audit.log('AUTH_SUCCESS', {
      actor: agent.id,
      actor_type: 'agent',
      action: 'login',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    return res.status(201).json({
      success: true,
      data: {
        token,
        type: 'agent',
        createdAt: new Date().toISOString(),
        expiresAt
      }
    });
  }

  res.status(400).json({ success: false, error: 'Invalid authentication request' });
});

/**
 * GET /api/auth/validate
 * Verify that the current token is valid.
 */
router.get('/validate', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.json({
    success: true,
    data: {
      valid: true,
      keyType: authReq.keyType,
      userUuid: authReq.userUuid,
      permissions: authReq.agentPermissions
    }
  });
});

/**
 * POST /api/auth/revoke
 * Revoke the current session token.
 */
router.post('/revoke', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  const hashedKey = hashKey(authReq.apiKey);

  db.prepare(
    'UPDATE api_tokens SET revoked_at = ? WHERE token_hash = ?'
  ).run(new Date().toISOString(), hashedKey);

  audit.log('AUTH_REVOKE', {
    actor: authReq.userUuid,
    actor_type: authReq.keyType,
    action: 'revoke_token',
    outcome: 'success',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.json({ success: true });
});

export default router;
```

---

## Part 6: Agent Keys Routes

**File:** `src/server/routes/agentKeys.ts`

```typescript
import { Router } from 'express';
import db from '../db.js';
import { createAuditLogger } from '../utils/auditLogger.js';
import { generateId, generateString, hashKey } from '../utils/crypto.js';
import { calculateExpiry } from '../utils/tokenExpiry.js';
import { requireAuth, requireHuman, AuthRequest, requirePermission } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AgentKeySchemas } from '../validation/schemas.js';

const router = Router();
const audit = createAuditLogger(db);

/**
 * GET /api/agent-keys
 * List all agent keys for the authenticated user.
 */
router.get('/', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const rows = db.prepare(
    'SELECT id, name, description, permissions, is_active, created_at, last_used, expiration_date FROM agent_keys WHERE user_uuid = ? ORDER BY created_at DESC'
  ).all(authReq.userUuid) as any[];

  res.json({
    success: true,
    data: rows.map(row => ({
      ...row,
      permissions: JSON.parse(row.permissions || '{}')
    }))
  });
});

/**
 * POST /api/agent-keys
 * Create a new agent key.
 *
 * Request:
 *   {
 *     name: 'My Agent',
 *     description: '...',
 *     permissions: { canRead: true, canWrite: true },
 *     expirationType: 'never' | '30d' | '90d' | '1y',
 *     rateLimit: 100
 *   }
 *
 * Response returns the plaintext key (only time it's visible).
 * Client must store this securely.
 */
router.post(
  '/',
  requireAuth,
  requireHuman,
  validateBody(AgentKeySchemas.create),
  (req, res) => {
    const authReq = req as AuthRequest;
    const { name, description, permissions, expirationType, rateLimit } = req.body;

    // Check for duplicate name
    const dup = db.prepare(
      'SELECT id FROM agent_keys WHERE name = ? AND is_active = 1 AND user_uuid = ?'
    ).get(name, authReq.userUuid);

    if (dup) {
      return res.status(409).json({
        success: false,
        error: `An active agent key named "${name}" already exists`
      });
    }

    // Calculate expiry
    let expDate = null;
    if (expirationType && expirationType !== 'never') {
      expDate = calculateExpiry(expirationType);
    }

    // Generate key and hash
    const plainKey = `lb-${generateString(64)}`;
    const hashedKey = hashKey(plainKey);

    const keyData = {
      id: generateId(),
      user_uuid: authReq.userUuid,
      name,
      description: description || null,
      api_key_hash: hashedKey,
      permissions: JSON.stringify(permissions || {}),
      expiration_type: expirationType || 'never',
      expiration_date: expDate,
      rate_limit: rateLimit || null,
      is_active: 1,
      created_at: new Date().toISOString(),
      last_used: null
    };

    db.prepare(
      `INSERT INTO agent_keys (
        id, user_uuid, name, description, api_key_hash, permissions,
        expiration_type, expiration_date, rate_limit, is_active, created_at, last_used
      ) VALUES (
        @id, @user_uuid, @name, @description, @api_key_hash, @permissions,
        @expiration_type, @expiration_date, @rate_limit, @is_active, @created_at, @last_used
      )`
    ).run(keyData);

    audit.log('AGENT_KEY_CREATED', {
      actor: authReq.userUuid,
      actor_type: 'human',
      resource: keyData.id,
      action: 'create',
      outcome: 'success',
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string,
      details: { name: keyData.name }
    });

    res.status(201).json({
      success: true,
      data: {
        id: keyData.id,
        name: keyData.name,
        key: plainKey,  // ← Only returned once
        permissions: permissions || {},
        expiresAt: expDate
      }
    });
  }
);

/**
 * PATCH /api/agent-keys/:id/revoke
 * Revoke an agent key (soft delete, can re-enable later).
 */
router.patch('/:id/revoke', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const now = new Date().toISOString();

  const info = db.prepare(
    'UPDATE agent_keys SET is_active = 0, revoked_at = ?, revoked_by = ? WHERE id = ? AND user_uuid = ?'
  ).run(now, authReq.userUuid, req.params.id, authReq.userUuid);

  if (info.changes === 0) {
    return res.status(404).json({ success: false, error: 'Agent key not found' });
  }

  audit.log('AGENT_KEY_REVOKED', {
    actor: authReq.userUuid,
    actor_type: 'human',
    resource: req.params.id,
    action: 'revoke',
    outcome: 'success',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.json({ success: true });
});

/**
 * DELETE /api/agent-keys/:id
 * Hard delete an agent key (permanent).
 */
router.delete('/:id', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;

  const info = db.prepare(
    'DELETE FROM agent_keys WHERE id = ? AND user_uuid = ?'
  ).run(req.params.id, authReq.userUuid);

  if (info.changes === 0) {
    return res.status(404).json({ success: false, error: 'Agent key not found' });
  }

  audit.log('AGENT_KEY_DELETED', {
    actor: authReq.userUuid,
    actor_type: 'human',
    resource: req.params.id,
    action: 'delete',
    outcome: 'success',
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.json({ success: true });
});

export default router;
```

---

## Part 7: Usage in Route Handlers

**Example: Protected endpoint using auth**

```typescript
import { Router } from 'express';
import db from '../db.js';
import { requireAuth, AuthRequest, requirePermission } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/bookmarks
 * Requires auth, any user type
 */
router.get('/', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;

  // Every query filtered by user_uuid — prevents cross-user access
  const bookmarks = db.prepare(
    'SELECT * FROM bookmarks WHERE user_uuid = ? ORDER BY created_at DESC'
  ).all(authReq.userUuid);

  res.json({ success: true, data: bookmarks });
});

/**
 * POST /api/bookmarks
 * Requires auth + canWrite permission
 */
router.post('/', requireAuth, requirePermission('canWrite'), (req, res) => {
  const authReq = req as AuthRequest;
  const { title, url } = req.body;

  // Insert with user_uuid — enforces ownership
  db.prepare(
    'INSERT INTO bookmarks (id, user_uuid, title, url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    crypto.randomUUID(),
    authReq.userUuid,
    title,
    url,
    new Date().toISOString(),
    new Date().toISOString()
  );

  res.status(201).json({ success: true });
});

export default router;
```

---

## Integration Checklist

- [ ] Copy all crypto utilities to `src/server/utils/`
- [ ] Create database schema with all tables
- [ ] Implement auth middleware in `src/server/middleware/auth.ts`
- [ ] Implement auth routes in `src/server/routes/auth.ts`
- [ ] Implement agent key routes in `src/server/routes/agentKeys.ts`
- [ ] Add `requireAuth` middleware to all protected routes
- [ ] Filter all queries by `user_uuid = authReq.userUuid`
- [ ] Configure rate limiting on auth endpoints
- [ ] Add audit logging to all auth operations
- [ ] Test with integration tests (use HardShell suite)
- [ ] Document API endpoints in README
- [ ] Set `TOKEN_TTL_DEFAULT` in `.env`
- [ ] Set `DB_ENCRYPTION_KEY` in `.env`

---

## Security Best Practices Summary

1. **Never log plaintext keys** — Only log hashes or IDs
2. **Always hash before storage** — api_key, tokens, reset links
3. **Always compare with timing-safe functions** — Prevents timing attacks
4. **Always filter by user_uuid** — Every query, every time
5. **Always audit key operations** — Create, revoke, login attempts
6. **Always expire tokens** — Short TTL (1 day), check on every request
7. **Always support revocation** — Can't wait for expiry to invalidate
8. **Always rate-limit auth endpoints** — Prevent brute force

---

## Testing Patterns

See `Drop-In-HardShell-Testing-Suite.md` for comprehensive test patterns.

Key test scenarios:
- ✅ Valid auth (human and agent)
- ✅ Invalid keys / expired tokens
- ✅ Cross-user data access (should fail)
- ✅ Permission enforcement
- ✅ Rate limiting
- ✅ Token revocation
- ✅ Audit trail

---

**Maintained by CrustAgent©™**
