/**
 * admin.ts — PinchPad©™
 *
 * SuperAdmin API routes.
 *
 * Maintained by CrustAgent©™
 */

import { Router } from 'express';
import db, { auditDb } from '../database/index';
import { requireAdmin, createAdminSession, destroyAdminSession, isAdminSessionValid } from '../middleware/requireAdmin';
import { adminAuthLimiter } from '../middleware/rateLimiter';
import { constantTimeCompare } from '../utils/crypto';

import crypto from 'crypto';
import path from 'path';
import { existsSync, statSync } from 'fs';

const router = Router();

/**
 * POST /api/admin/auth
 * Authenticate using ADMIN_TOKEN.
 */
router.post('/auth', adminAuthLimiter, (req, res) => {

  const { token } = req.body;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    return res.status(503).json({ success: false, error: 'Admin panel is not configured.' });
  }

  // Compare provided token (hashed client-side or raw) with env token
  // For maximum security, we expect the client to SHA-256 hash it once, 
  // but we compare raw for now if that's what the user prefers.
  // Actually, implementation plan says: "SHA-256 hashes the token client-side before sending"
  // So we should hash the env token to compare.
  
  const providedHash = token; // Already hashed by client
  const actualHash = crypto.createHash('sha256').update(adminToken).digest('hex');

  if (constantTimeCompare(providedHash, actualHash)) {
    const sessionToken = createAdminSession();
    // Set a secure cookie
    res.cookie('pp_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 20 * 60 * 1000 // 20 minutes
    });
    return res.json({ success: true, sessionToken });
  }

  res.status(401).json({ success: false, error: 'Invalid admin token.' });
});

/**
 * GET /api/admin/verify
 * Check if session is valid. (Quiet mode for professional console)
 */
router.get('/verify', (req, res) => {
  const sessionToken = req.headers['x-admin-session'] as string || req.cookies?.pp_admin_session;
  const isValid = isAdminSessionValid(sessionToken);
  res.json({ success: isValid });
});

/**
 * POST /api/admin/logout
 */
router.post('/logout', (req, res) => {
  const sessionToken = req.cookies?.pp_admin_session || req.headers['x-admin-session'];
  if (sessionToken) {
    destroyAdminSession(sessionToken as string);
  }
  res.clearCookie('pp_admin_session');
  res.json({ success: true });
});

/**
 * GET /api/admin/users
 * List users with metadata only.
 */
router.get('/users', requireAdmin, (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const offset = Number(req.query.offset) || 0;

  const users = db.prepare(`
    SELECT 
      u.uuid, 
      u.username, 
      u.created_at,
      (SELECT COUNT(*) FROM notes WHERE user_uuid = u.uuid) as pearl_count,
      (SELECT COUNT(*) FROM pots WHERE user_uuid = u.uuid) as pot_count,
      (SELECT COUNT(*) FROM pearl_photos WHERE user_uuid = u.uuid) as photo_count,
      (SELECT COUNT(*) FROM agent_keys WHERE user_uuid = u.uuid AND is_active = 1) as active_keys,
      (SELECT IFNULL(SUM(LENGTH(data)), 0) FROM pearl_photos WHERE user_uuid = u.uuid) as storage_bytes,
      (SELECT MAX(created_at) FROM api_tokens WHERE owner_key = u.uuid AND owner_type = 'human') as last_login
    FROM users u
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;

  res.json({ 
    success: true, 
    data: users,
    pagination: {
      total: total.count,
      limit,
      offset
    }
  });
});


/**
 * DELETE /api/admin/users/:uuid
 * Cascade delete user and all their data.
 */
router.delete('/users/:uuid', requireAdmin, (req, res) => {
  const { uuid } = req.params;

  // Transaction for atomic deletion
  const deleteTx = db.transaction((id: string) => {
    // 1. Manual cleanup for tables without FK cascade
    db.prepare('DELETE FROM settings WHERE user_uuid = ?').run(id);
    db.prepare('DELETE FROM import_sessions WHERE user_uuid = ?').run(id);
    
    // 2. Cascade delete from users table
    // (triggers: cascade_user_api_tokens, cascade_agent_api_tokens will fire)
    // (FK: notes, pots, pearl_photos, agent_keys will cascade)
    const result = db.prepare('DELETE FROM users WHERE uuid = ?').run(id);
    return result.changes;
  });

  try {
    const changes = deleteTx(uuid);
    if (changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, message: `User ${uuid} and all associated data scuttled.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/system
 * System health and stats.
 */
router.get('/system', requireAdmin, (req, res) => {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const mainDbPath = path.join(dataDir, 'db.sqlite');
  const auditDbPath = path.join(dataDir, 'audit.sqlite');

  
  let totalDbSize = 0;
  if (existsSync(mainDbPath))  totalDbSize += statSync(mainDbPath).size;
  if (existsSync(auditDbPath)) totalDbSize += statSync(auditDbPath).size;

  const userRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number } | undefined;
  const noteRow = db.prepare('SELECT COUNT(*) as count FROM notes').get() as { count: number } | undefined;
  const photoRow = db.prepare('SELECT COUNT(*) as count FROM pearl_photos').get() as { count: number } | undefined;
  const auditRow = auditDb.prepare('SELECT timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 1').get() as { timestamp: string } | undefined;

  const stats = {
    totalUsers: userRow?.count || 0,
    totalPearls: noteRow?.count || 0,
    totalPhotos: photoRow?.count || 0,
    dbSize: totalDbSize,
    uptime: process.uptime(),
    lastAudit: auditRow?.timestamp || null
  };

  res.json({ success: true, data: stats });
});

/**
 * GET /api/admin/audit
 * Query audit logs from the segregated audit database.
 */
router.get('/audit', requireAdmin, (req, res) => {
  const { event_type, actor, outcome, limit = 50, offset = 0 } = req.query;
  
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];

  if (event_type) { sql += ' AND event_type = ?'; params.push(event_type); }
  if (actor)      { sql += ' AND actor = ?';      params.push(actor); }
  if (outcome)    { sql += ' AND outcome = ?';    params.push(outcome); }

  sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const logs = auditDb.prepare(sql).all(...params);
  const total = auditDb.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as any;

  res.json({ 
    success: true, 
    data: logs,
    pagination: {
      total: total.count,
      limit: Number(limit),
      offset: Number(offset)
    }
  });
});

/**
 * GET /api/admin/settings
 * Fetch global system settings.
 */
router.get('/settings', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM system_settings').all() as any[];
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/settings
 * Update global system settings.
 */
router.patch('/settings', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid settings payload' });
  }

  const now = new Date().toISOString();
  try {
    const updateStmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(updates)) {
        updateStmt.run(key, String(value), now);
      }
    })();
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admin/uptime
 * Compute historical uptime sessions from audit logs.
 */
router.get('/uptime', requireAdmin, (req, res) => {
  try {
    // Fetch all SYSTEM_START and SYSTEM_SHUTDOWN events ordered chronologically
    const events = auditDb.prepare(`
      SELECT timestamp, event_type, details 
      FROM audit_logs 
      WHERE event_type IN ('SYSTEM_START', 'SYSTEM_SHUTDOWN')
      ORDER BY timestamp ASC
    `).all() as any[];

    const sessions: Array<{ id: string, start: string, end: string | null, duration: number | null }> = [];
    let currentSession: any = null;

    for (const event of events) {
      const details = JSON.parse(event.details || '{}');
      const sessionId = details.session_id;

      if (event.event_type === 'SYSTEM_START') {
        // If we already have a current session that didn't shut down, close it implicitly
        if (currentSession) {
          sessions.unshift(currentSession);
        }
        currentSession = { id: sessionId, start: event.timestamp, end: null, duration: null };
      } else if (event.event_type === 'SYSTEM_SHUTDOWN') {
        if (currentSession && currentSession.id === sessionId) {
          currentSession.end = event.timestamp;
          currentSession.duration = Math.floor((new Date(currentSession.end).getTime() - new Date(currentSession.start).getTime()) / 1000);
          sessions.unshift(currentSession);
          currentSession = null;
        } else {
          // Orphaned shutdown, ignore or log
        }
      }
    }

    // Push the currently active session (if any)
    if (currentSession) {
      currentSession.duration = Math.floor((Date.now() - new Date(currentSession.start).getTime()) / 1000);
      sessions.unshift(currentSession);
    }

    res.json({ success: true, data: sessions });
  } catch (err: any) {
    console.error('[Uptime] Failed to fetch uptime history:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch uptime history' });
  }
});

export default router;
