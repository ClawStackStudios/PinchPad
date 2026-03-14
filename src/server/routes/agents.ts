import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';
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

router.get('/', requireAuth(), requireHuman(), (req: AuthRequest, res) => {
  try {
    const keys = db.prepare('SELECT id, name, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at, last_used FROM lobster_keys WHERE user_uuid = ? ORDER BY created_at DESC').all(req.user!.uuid);
    res.json({ data: keys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lobster keys' });
  }
});

router.post('/', requireAuth(), requireHuman(), (req: AuthRequest, res) => {
  const { id, name, permissions, expiration_type, expiration_date, rate_limit } = req.body;
  
  if (!id || !name || !permissions || !expiration_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = `lb-${generateBase62(64)}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO lobster_keys (id, user_uuid, name, api_key, permissions, expiration_type, expiration_date, rate_limit, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id,
      req.user!.uuid,
      name,
      apiKey,
      JSON.stringify(permissions),
      expiration_type,
      expiration_date || null,
      rate_limit || null,
      now
    );

    // Return the api_key only once upon creation
    res.status(201).json({ data: { id, name, api_key: apiKey, permissions, expiration_type, expiration_date, rate_limit, is_active: 1, created_at: now } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lobster key' });
  }
});

router.put('/:id/revoke', requireAuth(), requireHuman(), (req: AuthRequest, res) => {
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
