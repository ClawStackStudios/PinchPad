import { Router, Response } from 'express';
import crypto from 'node:crypto';
import db from '../database/index';
import { requireAuth, requirePermission, type AuthRequest } from '../middleware/auth';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();
const audit = createAuditLogger(db);

/**
 * GET /api/shares
 * Returns all active shares for the authenticated user.
 */
router.get('/', requireAuth, requirePermission('canRead'), (req: AuthRequest, res: Response) => {
  try {
    const shares = db.prepare(`
      SELECT pearl_shares.*, notes.title as pearl_title
      FROM pearl_shares
      JOIN notes ON pearl_shares.pearl_id = notes.id
      WHERE notes.user_uuid = ?
      ORDER BY pearl_shares.created_at DESC
    `).all(req.userUuid) as any[];

    res.json({ success: true, data: shares });
  } catch (error) {
    console.error('[Shares] Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch shares' });
  }
});

/**
 * POST /api/shares/pearl/:id
 * Creates a new share for a pearl.
 */
router.post('/pearl/:id', requireAuth, requirePermission('canWrite'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { expiresAt } = req.body;

  try {
    // 1. Verify Pearl exists and belongs to user
    const pearl = db.prepare('SELECT id FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
    if (!pearl) {
      return res.status(404).json({ error: 'Pearl not found or access denied' });
    }

    // 2. Validate expiresAt if provided
    let validatedExpiresAt: string | null = null;
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid expiration date format' });
      }
      if (parsed < new Date()) {
        return res.status(400).json({ error: 'Expiration date must be in the future' });
      }
      validatedExpiresAt = parsed.toISOString();
    }

    // 3. Generate secure hash
    const shareHash = crypto.randomBytes(32).toString('hex');
    const shareId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 4. Insert share
    db.prepare(`
      INSERT INTO pearl_shares (id, pearl_id, share_hash, is_active, created_at, expires_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(shareId, id, shareHash, now, validatedExpiresAt);

    audit.log('SHARE_CREATE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'create',
      outcome: 'success',
      resource: 'pearl_share',
      details: { share_id: shareId, pearl_id: id },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.status(201).json({
      success: true,
      data: {
        id: shareId,
        pearl_id: id,
        share_hash: shareHash,
        expires_at: validatedExpiresAt
      }
    });
  } catch (error) {
    console.error('[Shares] Create error:', error);
    res.status(500).json({ error: 'Failed to create share' });
  }
});

/**
 * DELETE /api/shares/:id
 * Revokes a share.
 */
router.delete('/:id', requireAuth, requirePermission('canWrite'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Need to verify the share belongs to a pearl owned by the user
    const share = db.prepare(`
      SELECT pearl_shares.id, pearl_shares.pearl_id
      FROM pearl_shares
      JOIN notes ON pearl_shares.pearl_id = notes.id
      WHERE pearl_shares.id = ? AND notes.user_uuid = ?
    `).get(id, req.userUuid) as any;

    if (!share) {
      return res.status(404).json({ error: 'Share not found or access denied' });
    }

    db.prepare('DELETE FROM pearl_shares WHERE id = ?').run(id);

    audit.log('SHARE_REVOKE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'delete',
      outcome: 'success',
      resource: 'pearl_share',
      details: { share_id: id, pearl_id: share.pearl_id },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Shares] Revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke share' });
  }
});

export default router;
