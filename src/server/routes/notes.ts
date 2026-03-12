import { Router } from 'express';
import crypto from 'crypto';
import db from '../db';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth(), requirePermission('canRead'), (req: AuthRequest, res) => {
  try {
    const notes = db.prepare('SELECT * FROM notes WHERE user_uuid = ? ORDER BY updated_at DESC').all(req.user!.uuid);
    res.json({ data: notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', requireAuth(), requirePermission('canWrite'), (req: AuthRequest, res) => {
  const { id, title, content } = req.body;
  if (!id || !title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date().toISOString();

  try {
    db.prepare('INSERT INTO notes (id, user_uuid, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      id,
      req.user!.uuid,
      title,
      content,
      now,
      now
    );
    
    const newNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.user!.uuid);
    res.status(201).json({ data: newNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', requireAuth(), requirePermission('canEdit'), (req: AuthRequest, res) => {
  const { title, content } = req.body;
  const { id } = req.params;

  if (!title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = db.prepare('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      title,
      content,
      new Date().toISOString(),
      id,
      req.user!.uuid
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.user!.uuid);
    res.json({ data: updatedNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', requireAuth(), requirePermission('canDelete'), (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_uuid = ?').run(id, req.user!.uuid);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
