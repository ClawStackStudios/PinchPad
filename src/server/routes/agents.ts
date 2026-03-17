import { Router, Response } from 'express';
import crypto from 'crypto';
import globalDb from '../db';
import { requireAuth, requireHuman, AuthRequest } from '../middleware/auth';

const router = Router();

// Generate base62 string
function generateBase62(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[crypto.randomInt(62)];
  }
  return result;
}

router.get('/', requireAuth(), requireHuman(), (req: any, res: Response) => {
  const db = req.db || globalDb;
  try {
    const keys = db.prepare('SELECT id, name, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used FROM lobster_keys WHERE user_uuid = ? ORDER BY created_at DESC').all(req.user!.uuid);
    res.json({ data: keys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobster keys' });
  }
});

router.post('/', requireAuth(), requireHuman(), (req: any, res: Response) => {
  const db = req.db || globalDb;
  const { id, name, permissions, expiration_type, expiration_date, rate_limit, api_key_hash, api_key } = req.body;

  if (!id || !name || !permissions || !expiration_type || !api_key_hash || !api_key) {
    return res.status(400).json({ error: 'Missing required fields for Lobster Key creation' });
  }

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
  const db = req.db || globalDb;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE lobster_keys SET is_active = 0 WHERE id = ? AND user_uuid = ?').run(id, req.user!.uuid);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Lobster key not found' });
    }
    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke lobster key' });
  }
});

export default router;
