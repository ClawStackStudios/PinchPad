# 🦞 Drop-In Lobster Limiting & Permissions

**ClawChives Lobster Key (Agent Key) Rate Limiting & Permission Control**

---

## Overview

Lobster Keys (`lb-` prefix) are agent API credentials with **granular rate limiting** and **permission-based access control**. Each key operates independently with custom request limits and action permissions.

---

## Rate Limiting Architecture

### Global Rate Limits
| Type | Limit | Window | Notes |
|------|-------|--------|-------|
| **Auth Endpoints** | 10 attempts | 15 minutes | Covers `/api/auth/*` (register, token, validate) |
| **API Endpoints** | 100 requests | 1 minute | Applies to all `/api/*` routes (default fallback) |

**Config (Environment Variables):**
```bash
AUTH_RATE_WINDOW=15m          # or "900000" (ms), or "900s"
AUTH_RATE_LIMIT=10            # max attempts per window
API_RATE_WINDOW=1m            # or "60000" (ms), or "60s"
API_RATE_LIMIT=100            # max requests per window
```

### Lobster Key Rate Limiting
Each Lobster Key has an **optional per-key rate limit** (`rate_limit` column, stored as integer = requests/minute).

**Enforcement Flow:**
```
1. Request arrives with Bearer token
2. Auth middleware identifies key type (hu-, lb-, api-)
3. If agent key (lb-) or api-token issued by agent (lb-):
   - Lookup agent_keys.rate_limit
   - If rate_limit > 0: create/apply per-key limiter
   - Apply: max {rate_limit} requests per 60 seconds
4. If rate_limit = NULL or 0: key is unlimited (no limiter applied)
```

**Lobster Rate Limiter Cache:**
- Maintains up to **100 active rate limiters** in memory (LRU eviction)
- When new key hits limit, oldest unused limiter is dropped from cache
- **Memory safe**: prevents unbounded growth from testing many keys
- **Performance**: direct cache lookup after first request (~1ms overhead)

**Example Scenarios:**
```javascript
// Lobster Key with rate_limit = 50
// → Max 50 requests per 60 seconds
// → 429 response: "Your carapace lacks the capacity! Agent rate limit exceeded."

// Lobster Key with rate_limit = NULL
// → Unlimited (no per-key limiter applied)
// → Only falls back to global API limit (100/min)

// Lobster Key issued via api-token:
// → Inherits parent key's rate_limit
// → Both key types share same 60-second window
```

---

## Permissions System

### Permission Model

Lobster Keys store **flexible permission objects** as JSON:

```json
{
  "canRead": true,
  "canWrite": true,
  "canEdit": false,
  "canDelete": false,
  "level": "readonly"
}
```

**Permission Types:**
| Permission | Actions | Effect |
|-----------|---------|--------|
| `canRead` | `GET /api/bookmarks`, `GET /api/folders` | List/fetch operations |
| `canWrite` | `POST /api/bookmarks`, `POST /api/folders` | Create new resources |
| `canEdit` | `PUT /api/bookmarks/:id`, `PATCH /api/*/star` | Modify existing resources |
| `canDelete` | `DELETE /api/bookmarks/:id` | Remove resources |
| `canMove` | (Reserved) | Move resources between folders |
| `level` | Special value | Shortcut: `level: "full"` grants all permissions |

### Permission Enforcement

**Middleware: `requirePermission(action)`**

```typescript
// In route handler:
router.get('/', requireAuth, requirePermission('canRead'), handler);
// ↓ If request lacks 'canRead': 403 Forbidden
// "Your carapace lacks the required 'canRead' permission"
```

**Permission Check Logic:**
```typescript
if (authReq.agentPermissions?.level === 'full') {
  // Full access granted (bypass permission check)
  next();
} else if (authReq.agentPermissions?.[action] === true) {
  // Specific permission granted
  next();
} else {
  // Permission denied
  res.status(403).json({ error: `lacks '${action}' permission` });
}
```

### Human Keys (Always Full Access)
```typescript
const HUMAN_PERMISSIONS = {
  canRead: true, canWrite: true, canEdit: true, canMove: true, canDelete: true
};
```
Human-authenticated requests bypass `requirePermission()` checks entirely.

---

## Database Schema

### `agent_keys` Table
```sql
CREATE TABLE agent_keys (
  id              TEXT PRIMARY KEY,           -- Unique ID (generated)
  user_uuid       TEXT NOT NULL,              -- Owner's user UUID
  name            TEXT NOT NULL,              -- Display name (e.g., "Claude Bookmark Reader")
  description     TEXT,                       -- Optional description
  api_key         TEXT NOT NULL UNIQUE,       -- The actual key (lb-{64 chars})
  permissions     TEXT NOT NULL,              -- JSON: {"canRead": true, ...}
  expiration_type TEXT NOT NULL,              -- "never", "1d", "30d", "1year"
  expiration_date TEXT,                       -- ISO 8601 timestamp (if expiring)
  rate_limit      INTEGER,                    -- Requests/minute (NULL = unlimited)
  is_active       INTEGER DEFAULT 1,          -- 0 = revoked, 1 = active
  created_at      TEXT NOT NULL,              -- ISO 8601 timestamp
  last_used       TEXT                        -- ISO 8601 timestamp (updated on auth)
);
```

### Token Validation (During Auth)

**Flow for `api-token` issued by Lobster Key:**
```
1. Client sends: Bearer api-{token}
2. Lookup api_tokens WHERE key = {token}
   ├─ Check expires_at <= now → reject if expired
   ├─ Check owner_type = 'agent' → yes
   └─ Lookup agent_keys WHERE api_key = owner_key
       ├─ Check is_active = 1 → reject if revoked
       ├─ Check expiration_date > now → reject if expired
       ├─ Set permissions = agent_keys.permissions
       ├─ Set user_uuid = agent_keys.user_uuid
       └─ Set keyType = 'agent'
3. Request proceeds with lobster permissions
```

---

## Creating a Lobster Key

**Endpoint:** `POST /api/agent-keys` (human-only)

**Request:**
```json
{
  "name": "My Bookmark Reader",
  "description": "Reads bookmarks, no write access",
  "permissions": {
    "canRead": true,
    "canWrite": false,
    "canEdit": false,
    "canDelete": false
  },
  "expirationType": "30d",
  "rateLimit": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "My Bookmark Reader",
    "apiKey": "lb-abc123...",
    "rateLimit": 100,
    "expiresAt": "2026-04-15T14:32:00Z",
    "permissions": {
      "canRead": true,
      "canWrite": false,
      "canEdit": false,
      "canDelete": false
    }
  }
}
```

---

## Using a Lobster Key

**Make a request:**
```bash
curl -H "Authorization: Bearer lb-abc123..." \
  http://localhost:4646/api/bookmarks
```

**Rate Limit Headers (Express Rate Limit Standard):**
```
RateLimit-Limit: 100
RateLimit-Remaining: 97
RateLimit-Reset: 1679527320
```

---

## Revoking a Lobster Key

**Endpoint:** `PATCH /api/agent-keys/:id/revoke` (human-only)

- Sets `is_active = 0`
- Records `revoked_at` and `revoked_by`
- Future auth attempts with this key fail immediately
- Audit log entry created

**Cascading Effect:**
- Any `api-token` issued by this key becomes invalid
- Existing tokens already validated won't retroactively fail (tokens are stateless)
- Future token generation via this key is blocked

---

## Audit Trail

Every Lobster Key action is logged:

| Event | Details |
|-------|---------|
| `AGENT_KEY_CREATED` | Who created it, key name |
| `AGENT_KEY_REVOKED` | Who revoked it, when |
| `AUTH_FAILURE` | Failed auth attempt (if expired/revoked) |
| `AUTH_SUCCESS` | Successful Lobster Key auth (key used, time) |

---

## Best Practices

### Rate Limiting
✅ **DO:**
- Set conservative `rateLimit` for untrusted agents
- Monitor `last_used` to detect stale keys
- Use `expirationDate` to enforce key rotation

❌ **DON'T:**
- Leave `rateLimit` NULL for production agents (use 50–200)
- Exceed 1000 active agent keys in testing (cache overhead)

### Permissions
✅ **DO:**
- Use **least privilege**: grant only needed permissions
- Use `level: "full"` only for trusted internal tools
- Revoke keys when agent is decommissioned

❌ **DON'T:**
- Grant `canDelete` to read-only agents
- Reuse the same key across multiple clients
- Store keys in version control or logs

---

## Troubleshooting

### "Lobster Key Revoked, Are you art of this reef?"
- Key's `is_active = 0` (revoked)
- **Fix:** Create a new key or ask human to un-revoke (not yet supported; delete + recreate)

### "Lobster Key expired"
- Key's `expiration_date < now`
- **Fix:** Extend TTL or create a new key

### "Your carapace lacks the capacity! Agent rate limit exceeded."
- Per-key `rate_limit` breached (requests/min exceeded)
- **Fix:** Wait for window to reset, or ask human to increase `rateLimit`

### "Your carapace lacks the required 'canWrite' permission"
- Permission object missing `canWrite: true`
- **Fix:** Ask human to update key permissions

---

**Maintained by CrustAgent©™**
