import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import globalDb from '../db';

const router = Router();

export const TOKEN_TTL_DEFAULT = 24 * 60 * 60 * 1000; // 24 Hours

// Rate limiter state for /register (5 per 15 min per IP)
const registerLimiters = new Map<string, { count: number; resetTime: number }>();
const REGISTER_LIMIT = 5;
const REGISTER_WINDOW = 15 * 60 * 1000;

// Rate limiter state for /token (10 per 15 min per IP)
const tokenLimiters = new Map<string, { count: number; resetTime: number }>();
const TOKEN_LIMIT = 10;
const TOKEN_WINDOW = 15 * 60 * 1000;

function checkRateLimit(ip: string, limitersMap: Map<string, { count: number; resetTime: number }>, max: number, window: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const limiter = limitersMap.get(ip);

  if (!limiter || now >= limiter.resetTime) {
    limitersMap.set(ip, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: max - 1, resetTime: now + window };
  }

  if (limiter.count >= max) {
    return { allowed: false, remaining: 0, resetTime: limiter.resetTime };
  }

  limiter.count++;
  return { allowed: true, remaining: max - limiter.count, resetTime: limiter.resetTime };
}

function logAudit(db: any, event: {
  event_type: string;
  actor?: string | null;
  actor_type?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (timestamp, event_type, actor, actor_type, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      event.event_type,
      event.actor ?? null,
      event.actor_type ?? null,
      event.ip_address ?? null,
      event.user_agent ?? null,
      event.details ? JSON.stringify(event.details) : null
    );
  } catch (e) {
    console.error('[Audit] Failed to log event:', e);
  }
}

// Constant-time comparison
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Generate base62 string
function generateBase62(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[crypto.randomInt(62)];
  }
  return result;
}

router.post('/register', (req: any, res: Response) => {
  const db = req.db || globalDb;
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || null;
  const { uuid, username, displayName, keyHash } = req.body;

  // Rate limiting: 5 per 15 min per IP
  const rateLimitCheck = checkRateLimit(ip, registerLimiters, REGISTER_LIMIT, REGISTER_WINDOW);
  res.setHeader('RateLimit-Limit', REGISTER_LIMIT);
  res.setHeader('RateLimit-Remaining', rateLimitCheck.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(rateLimitCheck.resetTime / 1000));

  if (!rateLimitCheck.allowed) {
    logAudit(db, {
      event_type: 'AUTH_REGISTER_RATE_LIMITED',
      ip_address: ip,
      user_agent: userAgent,
    });
    return res.status(429).json({ error: 'Too many registration attempts. Try again later.' });
  }

  if (!uuid || !username || !keyHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existing) {
      logAudit(db, {
        event_type: 'AUTH_REGISTER_FAILURE',
        ip_address: ip,
        user_agent: userAgent,
        details: { reason: 'username_taken', username },
      });
      return res.status(400).json({ error: 'Username already taken' });
    }

    db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
      uuid,
      username,
      displayName || null,
      keyHash,
      new Date().toISOString()
    );

    logAudit(db, {
      event_type: 'AUTH_REGISTER',
      actor: uuid,
      actor_type: 'human',
      ip_address: ip,
      user_agent: userAgent,
      details: { username },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/token', (req: any, res: Response) => {
  const db = req.db || globalDb;
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || null;
  const { uuid, username, keyHash, type = 'human' } = req.body;

  // Rate limiting: 10 per 15 min per IP
  const rateLimitCheck = checkRateLimit(ip, tokenLimiters, TOKEN_LIMIT, TOKEN_WINDOW);
  res.setHeader('RateLimit-Limit', TOKEN_LIMIT);
  res.setHeader('RateLimit-Remaining', rateLimitCheck.remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(rateLimitCheck.resetTime / 1000));

  if (!rateLimitCheck.allowed) {
    logAudit(db, {
      event_type: 'AUTH_LOGIN_RATE_LIMITED',
      ip_address: ip,
      user_agent: userAgent,
    });
    return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  }

  if (!keyHash) {
    return res.status(400).json({ error: 'keyHash is required' });
  }

  try {
    let user = null;

    if (type === 'human') {
      // 1. Try UUID if provided
      if (uuid) {
        user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid) as any;
      }

      // 2. Try Username if provided and UUID didn't match
      if (!user && username) {
        user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
      }

      if (!user) {
        logAudit(db, {
          event_type: 'AUTH_LOGIN_FAILURE',
          ip_address: ip,
          user_agent: userAgent,
          details: { reason: 'user_not_found', type },
        });
        return res.status(401).json({
          error: 'Invalid identity or key'
        });
      }

      const hashMatch = constantTimeCompare(keyHash, user.key_hash);

      if (!hashMatch) {
        logAudit(db, {
          event_type: 'AUTH_LOGIN_FAILURE',
          ip_address: ip,
          user_agent: userAgent,
          details: { reason: 'invalid_key', type },
        });
        return res.status(401).json({
          error: 'Invalid identity or key'
        });
      }
    } else if (type === 'lobster') {
      if (!uuid) {
        return res.status(400).json({ error: 'UUID is required for lobster keys' });
      }
      user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid) as any;
      if (!user) {
        logAudit(db, {
          event_type: 'AUTH_LOGIN_FAILURE',
          ip_address: ip,
          user_agent: userAgent,
          details: { reason: 'user_not_found', type },
        });
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      return res.status(400).json({ error: 'Invalid auth type' });
    }

    let lobsterKeyId = null;

    if (type === 'lobster') {
      // Secure Lobster Authentication: Lookup by user + key hash
      const lobster = db.prepare('SELECT id FROM lobster_keys WHERE user_uuid = ? AND api_key_hash = ? AND is_active = 1').get(user.uuid, keyHash) as any;

      if (!lobster) {
        logAudit(db, {
          event_type: 'AUTH_LOGIN_FAILURE',
          ip_address: ip,
          user_agent: userAgent,
          details: { reason: 'invalid_lobster_key', type },
        });
        return res.status(401).json({ error: 'Invalid agent credentials' });
      }

      lobsterKeyId = lobster.id;
      db.prepare('UPDATE lobster_keys SET last_used = ? WHERE id = ?').run(new Date().toISOString(), lobster.id);
    }

    const token = `api-${generateBase62(32)}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_DEFAULT).toISOString(); // 24 hours per skill

    // Invalidate old tokens for this user to keep the reef clean
    db.prepare('DELETE FROM api_tokens WHERE owner_uuid = ? AND owner_type = ?').run(user.uuid, type);

    db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, lobster_key_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      tokenHash,
      user.uuid,
      type,
      lobsterKeyId,
      expiresAt,
      new Date().toISOString()
    );

    logAudit(db, {
      event_type: 'AUTH_LOGIN_SUCCESS',
      actor: user.uuid,
      actor_type: type,
      ip_address: ip,
      user_agent: userAgent,
      details: { type, lobsterKeyId },
    });

    res.json({ token, type, uuid: user.uuid, username: user.username, displayName: user.display_name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

/**
 * GET /api/auth/verify
 * Check if the provided Bearer token is still valid.
 */
router.get('/verify', (req: any, res: Response) => {
  const db = req.db || globalDb;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const row = db.prepare(`
      SELECT owner_uuid as uuid, username, display_name, owner_type as type
      FROM api_tokens t
      JOIN users u ON t.owner_uuid = u.uuid
      WHERE t.key = ? AND datetime(t.expires_at) > datetime('now')
    `).get(tokenHash) as any;

    if (!row) {
      return res.status(401).json({ error: 'Token expired or invalid' });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/auth/logout
 * Manually revoke a session token.
 */
router.post('/logout', (req: any, res: Response) => {
  const db = req.db || globalDb;
  const ip = req.ip || 'unknown';
  const userAgent = req.headers['user-agent'] || null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // Query to get owner info before deletion
    const tokenRecord = db.prepare('SELECT owner_uuid, owner_type FROM api_tokens WHERE key = ?').get(tokenHash) as any;

    const result = db.prepare('DELETE FROM api_tokens WHERE key = ?').run(tokenHash);

    if (result.changes > 0 && tokenRecord) {
      logAudit(db, {
        event_type: 'AUTH_LOGOUT',
        actor: tokenRecord.owner_uuid,
        actor_type: tokenRecord.owner_type,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
