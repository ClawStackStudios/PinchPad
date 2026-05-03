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

router.post('/token', authLimiter, validateBody(AuthSchemas.token), (req: any, res: Response, next: any) => {
  try {
    const { type, uuid, keyHash, ownerKey } = req.body;
    console.log(`[Auth] 🥥 Molting token for type: ${type} (UUID: ${uuid || 'none'}, keyHash: ${keyHash ? 'provided' : 'none'})`);

    const ttl = process.env.TOKEN_TTL_DEFAULT || '1d';
    const expiresAt = calculateExpiry(ttl);
    console.log(`[Auth] ⏳ Expiry calculated: ${expiresAt || 'never'}`);

    if (type === 'human') {
      let user: any;
      if (uuid) {
        console.log(`[Auth] 🔍 Searching for human user by UUID: ${uuid}`);
        user = db.prepare('SELECT * FROM users WHERE uuid = ?').get(uuid);
      } else if (keyHash) {
        console.log(`[Auth] 🔍 Searching for human user by keyHash`);
        user = db.prepare('SELECT * FROM users WHERE key_hash = ?').get(keyHash);
      }

      if (!user) {
        console.log(`[Auth] ❌ User not found for ${uuid || 'keyHash'}`);
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

      console.log(`[Auth] ✅ User found: ${user.username} (${user.uuid})`);

      let keyMatch = false;
      try {
        console.log(`[Auth] 🔐 Performing timing-safe key comparison...`);
        keyMatch = crypto.timingSafeEqual(Buffer.from(user.key_hash), Buffer.from(keyHash));
      } catch (err: any) {
        console.warn(`[Auth] ⚠️ Key comparison failed or length mismatch: ${err.message}`);
        keyMatch = false;
      }

      if (!keyMatch) {
        console.log(`[Auth] ❌ Key mismatch for user: ${user.username}`);
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

      console.log(`[Auth] 💎 Key verified. Generating session token...`);
      const token = `api-${generateString(32)}`;
      
      console.log(`[Auth] 💾 Inserting token into api_tokens reef...`);
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

      console.log(`[Auth] 🦞 Success! Token issued for ${user.username}`);
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
      console.log(`[Auth] 🤖 Processing agent login for key starting with: ${agentKey?.substring(0, 10)}...`);
      
      if (!agentKey?.startsWith('lb-')) {
        console.log(`[Auth] ❌ Invalid agent key prefix`);
        return res.status(400).json({ success: false, error: 'Invalid Lobster key' });
      }

      // Sentinel: Fetch by key, then verify with timingSafeEqual to ensure constant-time response profiles
      console.log(`[Auth] 🔍 Fetching agent from DB...`);
      const agent = db.prepare('SELECT * FROM agent_keys WHERE api_key = ? AND is_active = 1').get(agentKey) as any;

      // Sentinel Security Patch: Timing-safe comparison with pre-hashing
      let keyMatch = false;
      if (agent) {
        console.log(`[Auth] 🔐 Performing hashed timing-safe comparison for agent...`);
        try {
          const storedKeyHash = crypto.createHash('sha256').update(agent.api_key).digest();
          const providedKeyHash = crypto.createHash('sha256').update(agentKey).digest();
          keyMatch = crypto.timingSafeEqual(storedKeyHash, providedKeyHash);
        } catch (err: any) {
          console.warn(`[Auth] ⚠️ Agent key comparison error: ${err.message}`);
          keyMatch = false;
        }
      }

      if (!agent || !keyMatch) {
        console.log(`[Auth] ❌ Agent not found or key mismatch`);
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
        console.log(`[Auth] ❌ Agent key expired: ${agent.expiration_date}`);
        return res.status(401).json({ success: false, error: 'Lobster key expired' });
      }

      console.log(`[Auth] 💎 Agent verified. Generating session token...`);
      const token = `api-${generateString(32)}`;
      
      console.log(`[Auth] 💾 Inserting agent token into api_tokens reef...`);
      db.prepare('INSERT INTO api_tokens (key, owner_key, owner_type, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
        token, agentKey, 'agent', new Date().toISOString(), expiresAt
      );

      console.log(`[Auth] ⏱️ Updating last_used for agent: ${agent.id}`);
      db.prepare('UPDATE agent_keys SET last_used = ? WHERE api_key = ?').run(new Date().toISOString(), agentKey);

      audit.log('AUTH_SUCCESS', {
        actor: agent.id,
        actor_type: 'agent',
        action: 'login',
        outcome: 'success',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] as string
      });

      console.log(`[Auth] 🦞 Success! Agent token issued`);
      return res.status(201).json({
        success: true,
        data: {
          token,
          type: 'agent',
          createdAt: new Date().toISOString(),
          expiresAt
        }
      });

    } else {
      console.log(`[Auth] ❌ Invalid authentication request type: ${type}`);
      return res.status(400).json({ success: false, error: 'Invalid authentication request' });
    }
  } catch (err: any) {
    console.error('[Auth] 🚨 CRITICAL ERROR during token generation:', err);
    next(err);
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
