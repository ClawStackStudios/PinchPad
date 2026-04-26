import { Router, Response } from 'express';
import crypto from 'crypto';
import singletonDb from '../database/index';
import { createAuditLogger } from '../utils/auditLogger';
import { calculateExpiry } from '../utils/tokenExpiry';
import { generateString, timingSafeEqualWithHashing } from '../utils/crypto';
import { validateBody } from '../middleware/validate';
import { AuthSchemas } from '../validation/schemas';

const router = Router();

/** POST /api/auth/register */
router.post('/register', validateBody(AuthSchemas.register), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { uuid, username, keyHash, displayName } = req.body;
  
  try {
    db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
      uuid, 
      username, 
      displayName || null,
      keyHash, 
      new Date().toISOString()
    );

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
    console.error('[Auth] Registration error:', err);
    if (err.message?.includes('UNIQUE constraint failed: users.username')) {
      return res.status(409).json({ success: false, error: 'Username already taken.' });
    }
    if (err.message?.includes('UNIQUE constraint failed: users.key_hash')) {
      return res.status(409).json({ success: false, error: 'Identity already registered (key conflict).' });
    }
    if (err.message?.includes('UNIQUE constraint failed: users.uuid')) {
      return res.status(409).json({ success: false, error: 'Identity already registered (UUID conflict).' });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to register user.',
      message: err.message // Providing message for collaborative debugging
    });
  }
});

/** POST /api/auth/token */
router.post('/token', validateBody(AuthSchemas.token), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { type, uuid, username, keyHash, ownerKey } = req.body;
  const ttl = process.env.TOKEN_TTL_DEFAULT || '1d';
  const expiresAt = calculateExpiry(ttl);

  if (type === 'human') {
    let user: any;
    if (uuid) {
      user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
    } else if (username) {
      user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    } else if (keyHash) {
      user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash);
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
        error: 'Identity not registered on this node' 
      });
    }

    // 🛡️ Sentinel Security Patch: Timing-safe comparison
    const keyMatch = timingSafeEqualWithHashing(user.key_hash, keyHash || '');

    if (!keyMatch) {
      audit.log('AUTH_FAILURE', { 
        action: 'login', 
        outcome: 'failure', 
        actor_type: 'human', 
        ip_address: req.ip, 
        user_agent: req.headers['user-agent'] as string, 
        details: { user_uuid: user.uuid } 
      });
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid identity key' 
      });
    }

    const token = `api-${generateString(32)}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
      tokenHash, 
      user.uuid, 
      'human', 
      new Date().toISOString(), 
      expiresAt
    );

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
      token, 
      type: 'human', 
      uuid: user.uuid, 
      username: user.username, 
      displayName: user.display_name 
    });

  } else if (type === 'lobster') {
    const lobsterKey = ownerKey;
    if (!lobsterKey?.startsWith('lb-')) {
      return res.status(400).json({ success: false, error: 'Invalid lobster key' });
    }

    // 🛡️ Sentinel: Fetch by key hash to avoid timing leaks during lookup
    const lobsterKeyHash = crypto.createHash('sha256').update(lobsterKey).digest('hex');
    const lobster = db.prepare('SELECT * FROM lobster_keys WHERE api_key_hash = ? AND is_active = 1').get(lobsterKeyHash) as any;
    
    if (!lobster) {
      audit.log('AUTH_FAILURE', { 
        action: 'login', 
        outcome: 'failure', 
        actor_type: 'lobster', 
        ip_address: req.ip, 
        user_agent: req.headers['user-agent'] as string 
      });
      return res.status(401).json({ success: false, error: 'Invalid or revoked lobster key' });
    }

    const token = `api-${generateString(32)}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, lobster_key_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      tokenHash, 
      lobster.user_uuid, 
      'lobster', 
      lobster.id, 
      new Date().toISOString(), 
      expiresAt
    );

    db.prepare('UPDATE lobster_keys SET last_used = ? WHERE id = ?').run(new Date().toISOString(), lobster.id);

    audit.log('AUTH_SUCCESS', { 
      actor: lobster.id, 
      actor_type: 'lobster', 
      action: 'login', 
      outcome: 'success', 
      ip_address: req.ip, 
      user_agent: req.headers['user-agent'] as string 
    });

    return res.status(201).json({ 
      success: true, 
      token, 
      type: 'lobster' 
    });

  } else {
    return res.status(400).json({ success: false, error: 'Invalid authentication request' });
  }
});

/** GET /api/auth/verify */
router.get('/verify', (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing token' });
  }

  const token = authHeader.slice(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const row = db.prepare(`
      SELECT owner_key as uuid, username, display_name, owner_type as type
      FROM api_tokens t
      JOIN users u ON t.owner_key = u.uuid
      WHERE t.key = ? AND datetime(t.expires_at) > datetime('now')
    `).get(tokenHash) as any;

    if (!row) {
      return res.status(401).json({ success: false, error: 'Token expired or invalid' });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

/** POST /api/auth/logout */
router.post('/logout', (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const tokenRecord = db.prepare('SELECT owner_key, owner_type FROM api_tokens WHERE key = ?').get(tokenHash) as any;
    const result = db.prepare('DELETE FROM api_tokens WHERE key = ?').run(tokenHash);

    if (result.changes > 0 && tokenRecord) {
      audit.log('AUTH_LOGOUT', {
        actor: tokenRecord.owner_key,
        actor_type: tokenRecord.owner_type,
        action: 'logout',
        outcome: 'success',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
