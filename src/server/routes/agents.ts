import { Router, Response } from 'express';
import singletonDb from '../database/index';
import { createAuditLogger } from '../utils/auditLogger';
import { requireAuth, requireHuman } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { LobsterKeySchemas } from '../validation/schemas';

const router = Router();

router.get('/', requireAuth(), requireHuman(), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  try {
    const keys = db.prepare(`
      SELECT id, name, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used 
      FROM lobster_keys 
      WHERE user_uuid = ? 
      ORDER BY created_at DESC
    `).all(req.user!.uuid);
    res.json({ data: keys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobster keys' });
  }
});

router.post('/', requireAuth(), requireHuman(), validateBody(LobsterKeySchemas.create), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { id, name, permissions, expiration_type, expiration_date, rate_limit, api_key_hash, api_key } = req.body;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO lobster_keys (id, user_uuid, name, api_key, api_key_hash, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      req.user!.uuid,
      name,
      api_key,
      api_key_hash,
      JSON.stringify(permissions),
      expiration_type,
      expiration_date || null,
      rate_limit || null,
      now
    );

    audit.log('LOBSTER_KEY_CREATE', {
      actor: req.user!.uuid,
      actor_type: 'human',
      action: 'create',
      outcome: 'success',
      resource: 'lobster_key',
      details: { key_id: id, name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.status(201).json({
      data: {
        id,
        name,
        api_key,
        permissions,
        expiration_type,
        expiration_date,
        rate_limit,
        is_active: 1,
        created_at: now
      }
    });
  } catch (error) {
    console.error('[Agents] Failed to create lobster key:', error);
    res.status(500).json({ error: 'Failed to create lobster key' });
  }
});

router.put('/:id/revoke', requireAuth(), requireHuman(), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE lobster_keys SET is_active = 0 WHERE id = ? AND user_uuid = ?').run(id, req.user!.uuid);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lobster key not found' });
    }

    audit.log('LOBSTER_KEY_REVOKE', {
      actor: req.user!.uuid,
      actor_type: 'human',
      action: 'revoke',
      outcome: 'success',
      resource: 'lobster_key',
      details: { key_id: id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke lobster key' });
  }
});

export default router;
