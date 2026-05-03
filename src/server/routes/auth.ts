import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../database/index';
import { createAuditLogger } from '../utils/auditLogger';
import { generateString } from '../utils/crypto';
import { validateBody } from '../middleware/validate';
import { AuthSchemas } from '../validation/schemas';
import { calculateExpiry } from '../utils/tokenExpiry';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const audit = createAuditLogger(db);

function detectKeyType(key: string) {
  if (key?.startsWith('hu-'))  return 'human';
  if (key?.startsWith('lb-'))  return 'agent';
  if (key?.startsWith('api-')) return 'api';
  return null;
}

router.post('/register', authLimiter, validateBody(AuthSchemas.register), (req: any, res: Response) => {
  const { uuid, username, keyHash } = req.body;

  try {
    db.prepare('INSERT INTO users (uuid, username, key_hash, created_at) VALUES (?, ?, ?, ?)').run(
      uuid, username, keyHash, new Date().toISOString()
    );

    audit.log('AUTH_REGISTER', {
      actor: uuid,
      actor_type: 'human',
      action: 'register',
      outcome: 'success',
      resource: 'user',
      details: { username, user_uuid: uuid },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
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
      error: 'Failed to register user.'
    });
  }
});

router.post('/token', authLimiter, validateBody(AuthSchemas.token), (req: any, res: Response) => {
  const { type, uuid, keyHash, ownerKey } = req.body;
  const ttl = process.env.TOKEN_TTL_DEFAULT || '1d';
  const expiresAt = calculateExpiry(ttl);

  if (type === 'human') {
    let user: any;
    if (uuid)        user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
    else if (keyHash) user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash);

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
        error: 'Identity not registered on this node',
        suggestion: 'Try providing your username for better error details if this is a registration issue.'
      });
    }

    let keyMatch = false;
    try {
      keyMatch = crypto.timingSafeEqual(Buffer.from(user.key_hash), Buffer.from(keyHash));
    } catch {
      keyMatch = false;
    }

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
        error: 'Invalid identity key',
        suggestion: 'Ensure you are using the correct ClawKey©™ for this server instance.'
      });
    }

    const token = `api-${generateString(32)}`;
    db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
      token, user.uuid, 'human', new Date().toISOString(), expiresAt
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
      data: {
        token,
        type: 'human',
        createdAt: new Date().toISOString(),
        expiresAt,
        user: { uuid: user.uuid, username: user.username }
      }
    });

  } else if (type === 'agent' || (ownerKey && detectKeyType(ownerKey) === 'agent')) {
    const agentKey = ownerKey;
    if (!agentKey?.startsWith('lb-')) return res.status(400).json({ success: false, error: 'Invalid Lobster key' });

    try {
      // Sentinel: Fetch by key, then verify with timingSafeEqual to ensure constant-time response profiles
      const agent = db.prepare('SELECT * FROM agent_keys WHERE api_key = ? AND is_active = 1').get(agentKey) as any;

      // Sentinel Security Patch: Timing-safe comparison with pre-hashing
      let keyMatch = false;
      if (agent) {
        try {
          const storedKeyHash = crypto.createHash('sha256').update(agent.api_key).digest();
          const providedKeyHash = crypto.createHash('sha256').update(agentKey).digest();
          keyMatch = crypto.timingSafeEqual(storedKeyHash, providedKeyHash);
        } catch {
          keyMatch = false;
        }
      }

      if (!agent || !keyMatch) {
        audit.log('AUTH_FAILURE', {
          action: 'login',
          outcome: 'failure',
          actor_type: 'agent',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] as string
        });
        return res.status(401).json({ success: false, error: 'Invalid or revoked Lobster key' });
      }

      if (agent.expiration_date && new Date(agent.expiration_date) < new Date()) {
        return res.status(401).json({ success: false, error: 'Lobster key expired' });
      }

      const token = `api-${generateString(32)}`;
      db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
        token, agentKey, 'agent', new Date().toISOString(), expiresAt
      );

      db.prepare('UPDATE agent_keys SET last_used = ? WHERE api_key = ?').run(new Date().toISOString(), agentKey);

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
    } catch (err: any) {
      console.error('[Auth] Agent authentication error:', err);
      audit.log('AUTH_FAILURE', {
        action: 'login',
        outcome: 'failure',
        actor_type: 'agent',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string,
        details: { error: err.message }
      });
      return res.status(500).json({ success: false, error: 'Agent authentication failed' });
    }

  } else {
    return res.status(400).json({ success: false, error: 'Invalid authentication request' });
  }
});

router.get('/validate', requireAuth, (req, res) => {
  const authReq = req as AuthRequest;
  res.json({ success: true, data: { valid: true, keyType: authReq.keyType, userUuid: authReq.userUuid } });
});

router.get('/verify', requireAuth, (req, res) => {
  // Legacy alias for validate to not instantly break older clients that relied on /verify
  const authReq = req as AuthRequest;
  res.json({ success: true, valid: true, type: authReq.keyType, uuid: authReq.userUuid });
});

router.post('/logout', (req: any, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = authHeader.slice(7);

  try {
    const tokenRecord = db.prepare('SELECT owner_key, owner_type FROM api_tokens WHERE key = ?').get(token) as any;
    const result = db.prepare('DELETE FROM api_tokens WHERE key = ?').run(token);

    if (result.changes > 0 && tokenRecord) {
      audit.log('AUTH_LOGOUT', {
        actor: tokenRecord.owner_key,
        actor_type: tokenRecord.owner_type,
        action: 'logout',
        outcome: 'success',
        ip_address: req.ip,
        user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
