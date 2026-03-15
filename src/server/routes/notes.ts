import { Router, Response } from 'express';
import crypto from 'crypto';
import globalDb from '../db';
import { requireAuth, requirePermission, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth(), requirePermission('canRead'), (req: any, res: Response) => {
  const db = req.db || globalDb;
  try {
    const notes = db.prepare('SELECT * FROM notes WHERE user_uuid = ? ORDER BY updated_at DESC').all(req.user!.uuid);
    res.json({ data: notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', requireAuth(), requirePermission('canWrite'), (req: any, res: Response) => {
  const db = req.db || globalDb;
  const { id, title, content, starred = 0, pinned = 0 } = req.body;
  if (!id || !title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const now = new Date().toISOString();

  try {
    db.prepare('INSERT INTO notes (id, user_uuid, title, content, starred, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      id,
      req.user!.uuid,
      title,
      content,
      starred ? 1 : 0,
      pinned ? 1 : 0,
      now,
      now
    );

    const newNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.user!.uuid);
    res.status(201).json({ data: newNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', requireAuth(), requirePermission('canEdit'), (req: any, res: Response) => {
  const db = req.db || globalDb;
  const { title, content, starred, pinned } = req.body;
  const { id } = req.params;

  if (!title || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = db.prepare('UPDATE notes SET title = ?, content = ?, starred = ?, pinned = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      title,
      content,
      starred ? 1 : 0,
      pinned ? 1 : 0,
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

router.patch('/:id/starred', requireAuth(), requirePermission('canEdit'), (req: any, res: Response) => {
  const db = req.db || globalDb;
  const { starred } = req.body;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE notes SET starred = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      starred ? 1 : 0,
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
    res.status(500).json({ error: 'Failed to toggle starred' });
  }
});

router.patch('/:id/pinned', requireAuth(), requirePermission('canEdit'), (req: any, res: Response) => {
  const db = req.db || globalDb;
  const { pinned } = req.body;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE notes SET pinned = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      pinned ? 1 : 0,
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
    res.status(500).json({ error: 'Failed to toggle pinned' });
  }
});

router.delete('/:id', requireAuth(), requirePermission('canDelete'), (req: any, res: Response) => {
  const db = req.db || globalDb;
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
