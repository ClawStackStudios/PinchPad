/**
 * pots.ts — PinchPad©™
 *
 * CRUD routes for Pots (pearl collection folders).
 * Pots belong to a user. Notes reference a pot via pot_id (nullable).
 * Deleting a pot un-pots its pearls — it does NOT delete them.
 *
 * Maintained by CrustAgent©™
 */

import { Router, Response } from 'express';
import crypto from 'node:crypto';
import db from '../database/index';
import { requireAuth, requirePermission, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { PotSchemas } from '../validation/schemas';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();
const audit = createAuditLogger(db);

// ── GET / ─────────────────────────────────────────────────────────────────────
// Returns all pots for the current user with live pearl counts.
router.get('/', requireAuth, requirePermission('canRead'), (req: AuthRequest, res: Response) => {
  try {
    const pots = db.prepare(`
      SELECT
        p.id,
        p.name,
        p.color,
        p.created_at,
        COUNT(n.id) AS pearl_count
      FROM pots p
      LEFT JOIN notes n ON n.pot_id = p.id AND n.user_uuid = p.user_uuid
      WHERE p.user_uuid = ?
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `).all(req.userUuid);

    res.json({ data: pots });
  } catch (err: any) {
    console.error('[Pots GET] ❌ Failed to fetch pots:', err.message);
    res.status(500).json({ error: 'Failed to fetch pots' });
  }
});

// ── POST / ────────────────────────────────────────────────────────────────────
// Creates a new pot.
router.post('/', requireAuth, requirePermission('canWrite'), validateBody(PotSchemas.create), (req: AuthRequest, res: Response) => {
  const { name, color } = req.body;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.prepare('INSERT INTO pots (id, user_uuid, name, color, created_at) VALUES (?, ?, ?, ?, ?)').run(
      id,
      req.userUuid,
      name.trim(),
      color ?? '#f59e0b',
      now
    );

    const newPot = db.prepare('SELECT * FROM pots WHERE id = ?').get(id);

    audit.log('POT_CREATE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'create',
      outcome: 'success',
      resource: 'pot',
      details: { pot_id: id, name },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.status(201).json({ data: newPot });
  } catch (err: any) {
    console.error('[Pots POST] ❌ Failed to create pot:', err.message);
    res.status(500).json({ error: 'Failed to create pot' });
  }
});

// ── PATCH /:id ────────────────────────────────────────────────────────────────
// Renames or recolors a pot.
router.patch('/:id', requireAuth, requirePermission('canEdit'), validateBody(PotSchemas.update), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, color } = req.body;

  // Verify ownership
  const pot = db.prepare('SELECT * FROM pots WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
  if (!pot) return res.status(404).json({ error: 'Pot not found' });

  try {
    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name.trim()); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }

    if (fields.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    values.push(id, req.userUuid);
    db.prepare(`UPDATE pots SET ${fields.join(', ')} WHERE id = ? AND user_uuid = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM pots WHERE id = ?').get(id);

    audit.log('POT_UPDATE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'update',
      outcome: 'success',
      resource: 'pot',
      details: { pot_id: id, fields },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.json({ data: updated });
  } catch (err: any) {
    console.error('[Pots PATCH] ❌ Failed to update pot:', err.message);
    res.status(500).json({ error: 'Failed to update pot' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────────
// Deletes a pot. Pearls inside are un-potted (pot_id = NULL), NOT deleted.
router.delete('/:id', requireAuth, requirePermission('canDelete'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const pot = db.prepare('SELECT * FROM pots WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
  if (!pot) return res.status(404).json({ error: 'Pot not found' });

  try {
    // Un-pot all pearls in this pot first
    const unpotted = db.prepare('UPDATE notes SET pot_id = NULL WHERE pot_id = ? AND user_uuid = ?').run(id, req.userUuid);
    db.prepare('DELETE FROM pots WHERE id = ? AND user_uuid = ?').run(id, req.userUuid);

    audit.log('POT_DELETE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'delete',
      outcome: 'success',
      resource: 'pot',
      details: { pot_id: id, unpotted_count: unpotted.changes },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.json({ data: { success: true, unpotted: unpotted.changes } });
  } catch (err: any) {
    console.error('[Pots DELETE] ❌ Failed to delete pot:', err.message);
    res.status(500).json({ error: 'Failed to delete pot' });
  }
});

export default router;
