import { Router } from 'express';
import db from '../database/index';
import { generateId, generateString } from '../utils/crypto';
import { requireAuth, requireHuman, type AuthRequest } from '../middleware/auth';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();
const audit = createAuditLogger(db);

/**
 * POST /start
 * Initializes an ephemeral import session.
 */
router.post('/start', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;

  const sessionId = generateId();
  const ephemeralKey = `lb-eph-${generateString(48)}`;
  const keyId = `session-${sessionId}`;
  const now = new Date().toISOString();
  const expiryDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  try {
    // 🏛️ Reinforced INSERT: Added user_uuid to prevent shell collapse (NOT NULL constraint)
    db.prepare(`
      INSERT INTO agent_keys (
        id, user_uuid, name, description, api_key, permissions,
        expiration_type, expiration_date, rate_limit, is_active, created_at, last_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      keyId,
      authReq.userUuid,
      '__ephemeral__',
      'Ephemeral import session',
      ephemeralKey,
      JSON.stringify({
        canWrite: true
      }),
      'custom',
      expiryDate,
      null,
      1,
      now,
      null
    );

    db.prepare(`
      INSERT INTO import_sessions (id, user_uuid, key_id, started_at, closed_at, error_count, errors_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, authReq.userUuid, keyId, now, null, 0, '[]');

    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'].join(', ')
      : String(req.headers['user-agent'] ?? '');

    audit.log('LOBSTER_SESSION_STARTED', {
      actor: authReq.userUuid,
      actor_type: 'human',
      resource: sessionId,
      action: 'start_session',
      outcome: 'success',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: userAgent,
      details: { sessionId, keyId }
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        sessionKey: ephemeralKey
      }
    });
  } catch (isCracked: any) {
    console.error('[Lobster Session] ❌ Molt failed starting session:', isCracked.message);
    audit.log('LOBSTER_SESSION_STARTED', {
      actor: authReq.userUuid,
      actor_type: 'human',
      resource: sessionId,
      action: 'start_session',
      outcome: 'failure',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: String(req.headers['user-agent'] ?? ''),
      details: { error: isCracked.message }
    });
    res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

/**
 * POST /:id/close
 * Closes and invalidates the session.
 */
router.post('/:id/close', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const sessionId = req.params.id;

  try {
    const pearl = db.prepare(
      'SELECT id, user_uuid, key_id, errors_json, error_count FROM import_sessions WHERE id = ?'
    ).get(sessionId) as any;

    if (!pearl) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (pearl.user_uuid !== authReq.userUuid) {
      return res.status(403).json({ success: false, error: 'Forbidden: not your session' });
    }

    const alreadyClosed = db.prepare(
      'SELECT closed_at FROM import_sessions WHERE id = ?'
    ).get(sessionId) as any;

    if (alreadyClosed?.closed_at) {
      return res.status(409).json({ success: false, error: 'Session already closed' });
    }

    const now = new Date().toISOString();

    db.prepare('UPDATE import_sessions SET closed_at = ? WHERE id = ?')
      .run(now, sessionId);

    db.prepare('UPDATE agent_keys SET is_active = 0 WHERE id = ?')
      .run(pearl.key_id);

    const errors = JSON.parse(pearl.errors_json || '[]');

    audit.log('LOBSTER_SESSION_CLOSED', {
      actor: authReq.userUuid,
      actor_type: 'human',
      resource: sessionId,
      action: 'close_session',
      outcome: 'success',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: String(req.headers['user-agent'] ?? ''),
      details: { sessionId, errorCount: pearl.error_count }
    });

    res.json({
      success: true,
      data: {
        errorCount: pearl.error_count,
        errors
      }
    });
  } catch (isCracked: any) {
    console.error('[Lobster Session] ❌ Molt failed closing session:', isCracked.message);
    res.status(500).json({ success: false, error: 'Failed to close session' });
  }
});

export default router;

