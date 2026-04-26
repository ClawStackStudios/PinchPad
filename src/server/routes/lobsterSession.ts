import { Router } from 'express';
import db from '../database/index.js';
import { generateId, generateString } from '../utils/crypto.js';
import { requireAuth, requireHuman, AuthRequest } from '../middleware/auth.js';
import { createAuditLogger } from '../utils/auditLogger.js';

const router = Router();
const audit = createAuditLogger(db);

/** POST /api/lobster-session/start — Generate ephemeral session key */
router.post('/start', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;

  const sessionId = generateId();
  const ephemeralKey = `lb-eph-${generateString(48)}`;
  const keyId = `session-${sessionId}`;
  const now = new Date().toISOString();

  // Set expiration to 15 minutes from now
  const expiryDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  try {
    // Insert ephemeral key into lobster_keys
    db.prepare(`
      INSERT INTO lobster_keys (
        id, user_uuid, name, api_key, permissions,
        expiration_type, expiration_date, rate_limit, is_active, created_at, last_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      keyId,
      authReq.user!.uuid,
      '__ephemeral__',
      ephemeralKey,
      JSON.stringify({ canRead: false, canWrite: true, canEdit: false, canDelete: false }),
      'expires',
      expiryDate,
      null, // unlimited rate_limit on bulk endpoint (already bypassed)
      1,
      now,
      null
    );

    // Insert session record
    db.prepare(`
      INSERT INTO import_sessions (id, user_uuid, key_id, started_at, closed_at, error_count, errors_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, authReq.user!.uuid, keyId, now, null, 0, '[]');

    const userAgent1 = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'].join(', ')
      : String(req.headers['user-agent'] ?? '');

    const auditData1: any = {
      actor: authReq.user!.uuid,
      actor_type: 'human',
      resource: sessionId,
      action: 'start_session',
      outcome: 'success',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: userAgent1,
      details: JSON.stringify({ sessionId, keyId })
    };
    audit.log('LOBSTER_SESSION_STARTED', auditData1);

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        sessionKey: ephemeralKey
      }
    });
  } catch (e: any) {
    console.error('[Lobster Session] Error starting session:', e.message);
    const userAgent2 = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'].join(', ')
      : String(req.headers['user-agent'] ?? '');

    const auditData2: any = {
      actor: authReq.user!.uuid,
      actor_type: 'human',
      resource: sessionId,
      action: 'start_session',
      outcome: 'failure',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: userAgent2,
      details: JSON.stringify({ error: e.message })
    };
    audit.log('LOBSTER_SESSION_STARTED', auditData2);
    res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

/** POST /api/lobster-session/:id/close — Close session and revoke key */
router.post('/:id/close', requireAuth, requireHuman, (req, res) => {
  const authReq = req as AuthRequest;
  const sessionId = req.params.id;

  try {
    // Fetch session
    const session = db.prepare(
      'SELECT id, user_uuid, key_id, errors_json, error_count FROM import_sessions WHERE id = ?'
    ).get(sessionId) as any;

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Verify ownership
    if (session.user_uuid !== authReq.user!.uuid) {
      return res.status(403).json({ success: false, error: 'Forbidden: not your session' });
    }

    // Verify not already closed
    const alreadyClosed = db.prepare(
      'SELECT closed_at FROM import_sessions WHERE id = ?'
    ).get(sessionId) as any;

    if (alreadyClosed?.closed_at) {
      return res.status(409).json({ success: false, error: 'Session already closed' });
    }

    const now = new Date().toISOString();

    // Close the session
    db.prepare('UPDATE import_sessions SET closed_at = ? WHERE id = ?')
      .run(now, sessionId);

    // Revoke the ephemeral key
    db.prepare(
      'UPDATE lobster_keys SET is_active = 0 WHERE id = ? AND user_uuid = ?'
    ).run(session.key_id, authReq.user!.uuid);

    const errors = JSON.parse(session.errors_json || '[]');

    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'].join(', ')
      : String(req.headers['user-agent'] ?? '');

    const auditData: any = {
      actor: authReq.user!.uuid,
      actor_type: 'human',
      resource: sessionId,
      action: 'close_session',
      outcome: 'success',
      ip_address: Array.isArray(req.ip) ? req.ip[0] : req.ip,
      user_agent: userAgent,
      details: JSON.stringify({ sessionId, errorCount: session.error_count })
    };
    audit.log('LOBSTER_SESSION_CLOSED', auditData);

    res.json({
      success: true,
      data: {
        errorCount: session.error_count,
        errors
      }
    });
  } catch (e: any) {
    console.error('[Lobster Session] Error closing session:', e.message);
    res.status(500).json({ success: false, error: 'Failed to close session' });
  }
});

export default router;
