import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';

const router = Router();

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

router.post('/register', (req, res) => {
  const { uuid, username, displayName, keyHash } = req.body;
  if (!uuid || !username || !keyHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
      uuid,
      username,
      displayName || null,
      keyHash,
      new Date().toISOString()
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

router.post('/token', (req, res) => {
  const { uuid, username, keyHash, type = 'human' } = req.body;

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
        return res.status(401).json({
          error: 'Invalid identity or key'
        });
      }

      const hashMatch = constantTimeCompare(keyHash, user.key_hash);

      if (!hashMatch) {
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
        return res.status(401).json({ error: 'Invalid agent credentials' });
      }

      lobsterKeyId = lobster.id;
      db.prepare('UPDATE lobster_keys SET last_used = ? WHERE id = ?').run(new Date().toISOString(), lobster.id);
    }

    const token = `api-${generateBase62(32)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours per skill

    // Invalidate old tokens for this user to keep the reef clean
    db.prepare('DELETE FROM api_tokens WHERE owner_uuid = ? AND owner_type = ?').run(user.uuid, type);

    db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, lobster_key_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      token,
      user.uuid,
      type,
      lobsterKeyId,
      expiresAt,
      new Date().toISOString()
    );

    res.json({ token, type, uuid: user.uuid, username: user.username, displayName: user.display_name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

/**
 * GET /api/auth/verify
 * Check if the provided Bearer token is still valid.
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  try {
    const row = db.prepare(`
      SELECT owner_uuid as uuid, username, display_name, owner_type as type 
      FROM api_tokens t
      JOIN users u ON t.owner_uuid = u.uuid
      WHERE t.key = ? AND datetime(t.expires_at) > datetime('now')
    `).get(token) as any;

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
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  try {
    db.prepare('DELETE FROM api_tokens WHERE key = ?').run(token);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
