import { Router, Response } from 'express';
import crypto from 'crypto';
import db from '../database/index';
import JSZip from 'jszip';
import { requireAuth, requirePermission, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { NoteSchemas } from '../validation/schemas';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();
const audit = createAuditLogger(db);

router.get('/', requireAuth, requirePermission('canRead'), (req: AuthRequest, res: Response) => {
  try {
    const notes = db.prepare('SELECT * FROM notes WHERE user_uuid = ? ORDER BY updated_at DESC').all(req.userUuid) as any[];

    const notesWithPhotos = notes.map(note => {
      const photos = db.prepare('SELECT id, filename, mime_type FROM pearl_photos WHERE pearl_id = ?').all(note.id) as any[];
      return {
        ...note,
        photos: photos.map(p => ({
          ...p,
          url: `/api/photos/${p.id}`
        }))
      };
    });

    res.json({ data: notesWithPhotos });
  } catch (error) {
    console.error('[Notes] Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(NoteSchemas.create), (req: AuthRequest, res: Response) => {
  const { id, title, content, starred = 0, pinned = 0 } = req.body;
  const now = new Date().toISOString();

  try {
    db.prepare('INSERT INTO notes (id, user_uuid, title, content, starred, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      id,
      req.userUuid,
      title,
      content,
      starred ? 1 : 0,
      pinned ? 1 : 0,
      now,
      now
    );

    audit.log('NOTE_CREATE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'create',
      outcome: 'success',
      resource: 'note',
      details: { note_id: id },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    const newNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
    res.status(201).json({ data: newNote });
  } catch (error) {
    console.error('[Notes POST] Error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(NoteSchemas.update), (req: AuthRequest, res: Response) => {
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
      req.userUuid
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    audit.log('NOTE_UPDATE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'update',
      outcome: 'success',
      resource: 'note',
      details: { note_id: id },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
    res.json({ data: updatedNote });
  } catch (error) {
    console.error('[Notes PUT] Error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.patch('/:id/starred', requireAuth, requirePermission('canEdit'), (req: AuthRequest, res: Response) => {
  const { starred } = req.body;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE notes SET starred = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      starred ? 1 : 0,
      new Date().toISOString(),
      id,
      req.userUuid
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle starred' });
  }
});

router.patch('/:id/pinned', requireAuth, requirePermission('canEdit'), (req: AuthRequest, res: Response) => {
  const { pinned } = req.body;
  const { id } = req.params;

  try {
    const result = db.prepare('UPDATE notes SET pinned = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      pinned ? 1 : 0,
      new Date().toISOString(),
      id,
      req.userUuid
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pinned' });
  }
});

router.delete('/:id', requireAuth, requirePermission('canDelete'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_uuid = ?').run(id, req.userUuid);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    audit.log('NOTE_DELETE', {
      actor: req.userUuid,
      actor_type: req.keyType,
      action: 'delete',
      outcome: 'success',
      resource: 'note',
      details: { note_id: id },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

router.post('/bulk', requireAuth, requirePermission('canWrite'), (req: AuthRequest, res: Response) => {
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
        req.userUuid,
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

  if (sessionId && typeof sessionId === 'string') {
    try {
      const session = db.prepare(
        'SELECT id, errors_json, error_count FROM import_sessions WHERE id = ? AND user_uuid = ? AND closed_at IS NULL'
      ).get(sessionId, req.userUuid) as any;

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
    actor: req.userUuid,
    actor_type: req.keyType,
    action: 'bulk_create',
    outcome: 'success',
    resource: 'notes',
    details: {
      imported: results.imported,
      failed: results.failed,
      sessionId: sessionId || null
    },
    ip_address: req.ip,
    user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
  });

  res.status(results.failed > 0 ? 207 : 201).json({
    success: true,
    data: results
  });
});

router.get('/export', requireAuth, async (req: AuthRequest, res: Response) => {
  const format = req.query.format || 'json';
  const notes = db.prepare('SELECT * FROM notes WHERE user_uuid = ?').all(req.userUuid) as any[];

  if (notes.length === 0) {
    return res.status(404).json({ error: 'No pearls found to export' });
  }

  try {
    const zip = new JSZip();
    const photosFolder = zip.folder('photos');
    let hasPhotos = false;

    for (const note of notes) {
      const photos = db.prepare('SELECT id, filename, data, mime_type FROM pearl_photos WHERE pearl_id = ?').all(note.id) as any[];

      let noteContent = note.content;
      if (photos.length > 0) {
        hasPhotos = true;
        for (const photo of photos) {
          photosFolder?.file(`${photo.id}-${photo.filename}`, photo.data);
          const remoteUrl = `/api/photos/${photo.id}`;
          const localPath = `photos/${photo.id}-${photo.filename}`;
          noteContent = noteContent.split(remoteUrl).join(localPath);
        }
      }

      if (format === 'md') {
        const header = `# ${note.title}\n\n**Created:** ${note.created_at}\n**Starred:** ${!!note.starred}\n\n---\n\n`;
        zip.file(`${note.id}-${note.title.replace(/[^a-z0-9]/gi, '_')}.md`, header + noteContent);
      }
    }

    if (format === 'json') {
      zip.file('pearls-export.json', JSON.stringify({
        metadata: { brand: 'ClawStack Studios©™', application: 'PinchPad©™', exported_at: new Date().toISOString() },
        data: notes
      }, null, 2));
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="pinchpad-burrow-export.zip"');
    res.send(content);
  } catch (error) {
    console.error('[Export] Error:', error);
    res.status(500).json({ error: 'Failed to generate export' });
  }
});

export default router;
