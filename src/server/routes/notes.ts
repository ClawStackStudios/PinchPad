import { Router, Response } from 'express';
import crypto from 'crypto';
import singletonDb from '../database/index';
import { requireAuth, requirePermission } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { NoteSchemas } from '../validation/schemas';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();

router.get('/', requireAuth(), requirePermission('canRead'), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  try {
    const notes = db.prepare('SELECT * FROM notes WHERE user_uuid = ? ORDER BY updated_at DESC').all(req.user!.uuid);
    res.json({ data: notes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', requireAuth(), requirePermission('canWrite'), validateBody(NoteSchemas.create), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { id, title, content, starred = 0, pinned = 0 } = req.body;
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

    audit.log('NOTE_CREATE', {
      actor: req.user!.uuid,
      actor_type: req.authContext?.type || 'human',
      action: 'create',
      outcome: 'success',
      resource: 'note',
      details: { note_id: id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    const newNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.user!.uuid);
    res.status(201).json({ data: newNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', requireAuth(), requirePermission('canEdit'), validateBody(NoteSchemas.update), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { title, content, starred, pinned } = req.body;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE notes SET title = coalesce(?, title), content = coalesce(?, content), starred = coalesce(?, starred), pinned = coalesce(?, pinned), updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      title || null,
      content || null,
      starred !== undefined ? (starred ? 1 : 0) : null,
      pinned !== undefined ? (pinned ? 1 : 0) : null,
      new Date().toISOString(),
      id,
      req.user!.uuid
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    audit.log('NOTE_UPDATE', {
      actor: req.user!.uuid,
      actor_type: req.authContext?.type || 'human',
      action: 'update',
      outcome: 'success',
      resource: 'note',
      details: { note_id: id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.user!.uuid);
    res.json({ data: updatedNote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.patch('/:id/starred', requireAuth(), requirePermission('canEdit'), (req: any, res: Response) => {
  const db = req.db || singletonDb;
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

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle starred' });
  }
});

router.patch('/:id/pinned', requireAuth(), requirePermission('canEdit'), (req: any, res: Response) => {
  const db = req.db || singletonDb;
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

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pinned' });
  }
});

router.delete('/:id', requireAuth(), requirePermission('canDelete'), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_uuid = ?').run(id, req.user!.uuid);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    audit.log('NOTE_DELETE', {
      actor: req.user!.uuid,
      actor_type: req.authContext?.type || 'human',
      action: 'delete',
      outcome: 'success',
      resource: 'note',
      details: { note_id: id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

/** POST /api/notes/bulk — Bulk import pearls/notes */
router.post('/bulk', requireAuth(), requirePermission('canWrite'), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const audit = createAuditLogger(db);
  const { notes } = req.body;
  const sessionId = req.headers['x-session-id'];

  if (!Array.isArray(notes)) {
    return res.status(400).json({ error: 'Body must contain "notes" array' });
  }

  const results = {
    imported: 0,
    failed: 0,
    errors: [] as { url: string; reason: string }[]
  };

  const now = new Date().toISOString();

  for (const note of notes) {
    try {
      const parsed = NoteSchemas.create.safeParse(note);
      if (!parsed.success) {
        results.failed++;
        results.errors.push({
          url: note.title || 'Untitled',
          reason: parsed.error.issues[0]?.message || 'Validation failed'
        });
        continue;
      }

      const { id = crypto.randomUUID(), title, content, starred = 0, pinned = 0 } = parsed.data;

      db.prepare(`
        INSERT INTO notes (id, user_uuid, title, content, starred, pinned, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        req.user!.uuid,
        title,
        content,
        starred ? 1 : 0,
        pinned ? 1 : 0,
        now,
        now
      );
      results.imported++;
    } catch (e: any) {
      results.failed++;
      results.errors.push({
        url: note.title || 'Untitled',
        reason: e.message || 'Database error'
      });
    }
  }

  // If session ID provided, update the session record
  if (sessionId && typeof sessionId === 'string') {
    try {
      const session = db.prepare(
        'SELECT id, errors_json, error_count FROM import_sessions WHERE id = ? AND user_uuid = ? AND closed_at IS NULL'
      ).get(sessionId, req.user!.uuid) as any;

      if (session) {
        const existingErrors = JSON.parse(session.errors_json || '[]');
        const updatedErrors = [...existingErrors, ...results.errors];
        db.prepare('UPDATE import_sessions SET errors_json = ?, error_count = ? WHERE id = ?')
          .run(JSON.stringify(updatedErrors), updatedErrors.length, sessionId);
      }
    } catch (err) {
      console.error('[Notes Bulk] Failed to update session:', err);
    }
  }

  audit.log('NOTES_BULK_IMPORT', {
    actor: req.user!.uuid,
    actor_type: req.user!.keyType,
    action: 'bulk_create',
    outcome: 'success',
    resource: 'notes',
    details: { 
      imported: results.imported, 
      failed: results.failed, 
      sessionId: sessionId || null 
    },
    ip_address: req.ip,
    user_agent: req.headers['user-agent'] as string
  });

  res.status(results.failed > 0 ? 207 : 201).json({
    success: true,
    data: results
  });
});

export default router;
