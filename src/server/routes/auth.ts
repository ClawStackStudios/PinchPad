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
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += charset[randomBytes[i] % 62];
  }
  return result;
}

router.post('/register', (req, res) => {
  const { uuid, username, keyHash } = req.body;
  if (!uuid || !username || !keyHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    db.prepare('INSERT INTO users (uuid, username, key_hash, created_at) VALUES (?, ?, ?, ?)').run(
      uuid,
      username,
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

      // 3. NEW: FALLBACK - Look up by keyHash alone if nothing else matched
      if (!user) {
        user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash) as any;
      }

      if (!user || !constantTimeCompare(keyHash, user.key_hash)) {
        return res.status(401).json({ 
          error: 'Invalid identity or key',
          suggestion: !user ? 'Try providing your username for better error details.' : null
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
      // For lobster, keyHash is the SHA-256 of the lb- key
      const lobsters = db.prepare('SELECT * FROM lobster_keys WHERE user_uuid = ? AND is_active = 1').all(user.uuid) as any[];
      let matched = false;
      for (const lobster of lobsters) {
        // We need to hash the stored plaintext lb- key to compare with the submitted keyHash
        const storedHash = crypto.createHash('sha256').update(lobster.api_key).digest('hex');
        if (constantTimeCompare(keyHash, storedHash)) {
          matched = true;
          lobsterKeyId = lobster.id;
          db.prepare('UPDATE lobster_keys SET last_used = ? WHERE id = ?').run(new Date().toISOString(), lobster.id);
          break;
        }
      }
      if (!matched) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = `api-${generateBase62(32)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins

    db.prepare('INSERT INTO api_tokens (key, owner_uuid, owner_type, lobster_key_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      token,
      user.uuid,
      type,
      lobsterKeyId,
      expiresAt,
      new Date().toISOString()
    );

    res.json({ token, type, uuid: user.uuid, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

export default router;
