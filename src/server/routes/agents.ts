import { Router, Response } from 'express';
import db from '../database/index';
import { createAuditLogger } from '../utils/auditLogger';
import { requireAuth, requireHuman } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { AgentKeySchemas } from '../validation/schemas';

const router = Router();
const audit = createAuditLogger(db);

router.get('/', requireAuth, requireHuman, (req: any, res: Response) => {
  const userUuid = req.userUuid;
  try {
    const keys = db.prepare(`
      SELECT id, name, description, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used
      FROM agent_keys
      WHERE user_uuid = ?
      ORDER BY created_at DESC
    `).all(userUuid);
    res.json({ data: keys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent keys' });
  }
});

router.post('/', requireAuth, requireHuman, validateBody(AgentKeySchemas.create), (req: any, res: Response) => {
  const { id, name, description, permissions, expiration_type, expiration_date, rate_limit, api_key } = req.body;
  const userUuid = req.userUuid;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO agent_keys (id, user_uuid, name, description, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      userUuid,
      name,
      description || null,
      api_key,
      JSON.stringify(permissions),
      expiration_type || 'never',
      expiration_date || null,
      rate_limit || null,
      now
    );

    audit.log('AGENT_KEY_CREATE', {
      actor: userUuid,
      actor_type: 'human',
      action: 'create',
      outcome: 'success',
      resource: 'agent_key',
      details: { key_id: id, name },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.status(201).json({
      data: {
        id,
        name,
        description,
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
    console.error('[Agents] Failed to create agent key:', error);
    res.status(500).json({ error: 'Failed to create agent key' });
  }
});

router.put('/:id/revoke', requireAuth, requireHuman, (req: any, res: Response) => {
  const { id } = req.params;
  const userUuid = req.userUuid;

  try {
    const result = db.prepare('UPDATE agent_keys SET is_active = 0 WHERE id = ? AND user_uuid = ?').run(id, userUuid);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Agent key not found' });
    }

    audit.log('AGENT_KEY_REVOKE', {
      actor: userUuid,
      actor_type: 'human',
      action: 'revoke',
      outcome: 'success',
      resource: 'agent_key',
      details: { key_id: id },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke agent key' });
  }
});

export default router;
