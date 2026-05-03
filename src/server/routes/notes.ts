import { Router, Response } from 'express';
import crypto from 'crypto';
import { marked } from 'marked';
import db from '../database/index';
import JSZip from 'jszip';
import { requireAuth, requirePermission, type AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { NoteSchemas, StatusSchemas } from '../validation/schemas';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();
const audit = createAuditLogger(db);

/**
 * GET /
 * Scuttles all pearls (notes) in the lobster's habitat.
 */
router.get('/', requireAuth, requirePermission('canRead'), (req: AuthRequest, res: Response) => {
  try {
    const reef = db.prepare('SELECT * FROM notes WHERE user_uuid = ? ORDER BY updated_at DESC').all(req.userUuid) as any[];

    const reefWithPhotos = reef.map(polyP => {
      const photos = db.prepare('SELECT id, filename, mime_type FROM pearl_photos WHERE pearl_id = ?').all(polyP.id) as any[];
      return {
        ...polyP,
        photos: photos.map(p => ({
          ...p,
          url: `/api/photos/${p.id}`
        }))
      };
    });

    res.json({ data: reefWithPhotos });
  } catch (isCracked: any) {
    console.error('[Notes] ❌ Scuttle error:', isCracked.message);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', requireAuth, requirePermission('canWrite'), validateBody(NoteSchemas.create), (req: AuthRequest, res: Response) => {
  const { id, title, content, starred = 0, pinned = 0 } = req.body;
  const now = new Date().toISOString();
  
  // HardShell Defense: Server-side ID generation fallback
  const pearlId = id || crypto.randomUUID();

  try {
    db.prepare('INSERT INTO notes (id, user_uuid, title, content, starred, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      pearlId,
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
      details: { note_id: pearlId },
      ip_address: req.ip,
      user_agent: (req.headers?.['user-agent'] as string) || 'unknown'
    });

    const newPolyP = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(pearlId, req.userUuid);
    res.status(201).json({ data: newPolyP });
  } catch (isCracked: any) {
    console.error('[Notes POST] ❌ Molt failed:', isCracked.message);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

/**
 * PUT /:id
 * Molt update an existing pearl.
 */
router.put('/:id', requireAuth, requirePermission('canEdit'), validateBody(NoteSchemas.update), (req: AuthRequest, res: Response) => {
  const { title, content, starred, pinned } = req.body;
  const { id } = req.params;

  try {
    const lockResult = db.prepare('UPDATE notes SET title = coalesce(?, title), content = coalesce(?, content), starred = coalesce(?, starred), pinned = coalesce(?, pinned), updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      title || null,
      content || null,
      starred !== undefined ? (starred ? 1 : 0) : null,
      pinned !== undefined ? (pinned ? 1 : 0) : null,
      new Date().toISOString(),
      id,
      req.userUuid
    );

    if (lockResult.changes === 0) {
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

    const updatedPolyP = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
    res.json({ data: updatedPolyP });
  } catch (isCracked: any) {
    console.error('[Notes PUT] ❌ Molt update failed:', isCracked.message);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

/**
 * PATCH /:id/starred
 * Pinches the starred state of a pearl.
 */
router.patch('/:id/starred', requireAuth, requirePermission('canEdit'), validateBody(StatusSchemas.toggle), (req: AuthRequest, res: Response) => {
  const { value } = req.body;
  const { id } = req.params;

  try {
    const lockResult = db.prepare('UPDATE notes SET starred = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      value ? 1 : 0,
      new Date().toISOString(),
      id,
      req.userUuid
    );

    if (lockResult.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
    res.json({ data: updatedNote });
  } catch (isCracked: any) {
    res.status(500).json({ error: 'Failed to toggle starred' });
  }
});

/**
 * PATCH /:id/pinned
 * Pinches the pinned state of a pearl.
 */
router.patch('/:id/pinned', requireAuth, requirePermission('canEdit'), validateBody(StatusSchemas.toggle), (req: AuthRequest, res: Response) => {
  const { value } = req.body;
  const { id } = req.params;

  try {
    const lockResult = db.prepare('UPDATE notes SET pinned = ?, updated_at = ? WHERE id = ? AND user_uuid = ?').run(
      value ? 1 : 0,
      new Date().toISOString(),
      id,
      req.userUuid
    );

    if (lockResult.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updatedNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_uuid = ?').get(id, req.userUuid);
    res.json({ data: updatedNote });
  } catch (isCracked: any) {
    res.status(500).json({ error: 'Failed to toggle pinned' });
  }
});

/**
 * DELETE /:id
 * Purges a pearl from the reef.
 */
router.delete('/:id', requireAuth, requirePermission('canDelete'), (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const lockResult = db.prepare('DELETE FROM notes WHERE id = ? AND user_uuid = ?').run(id, req.userUuid);

    if (lockResult.changes === 0) {
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
  } catch (isCracked: any) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

/**
 * POST /bulk
 * Bulk locks multiple pearls into the habitat.
 */
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

  for (const polyPData of notes) {
    try {
      const isHardShell = NoteSchemas.create.safeParse(polyPData);
      if (!isHardShell.success) {
        results.failed++;
        results.errors.push({
          url: polyPData.title || 'Untitled',
          reason: isHardShell.error.issues[0]?.message || 'Validation failed'
        });
        continue;
      }

      const { id = crypto.randomUUID(), title, content, starred = 0, pinned = 0 } = isHardShell.data;

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
    } catch (isCracked: any) {
      results.failed++;
      results.errors.push({
        url: polyPData.title || 'Untitled',
        reason: isCracked.message || 'Database error'
      });
    }
  }

  if (sessionId && typeof sessionId === 'string') {
    try {
      const sessionPearl = db.prepare(
        'SELECT id, errors_json, error_count FROM import_sessions WHERE id = ? AND user_uuid = ? AND closed_at IS NULL'
      ).get(sessionId, req.userUuid) as any;

      if (sessionPearl) {
        const existingErrors = JSON.parse(sessionPearl.errors_json || '[]');
        const updatedErrors = [...existingErrors, ...results.errors];
        db.prepare('UPDATE import_sessions SET errors_json = ?, error_count = ? WHERE id = ?')
          .run(JSON.stringify(updatedErrors), updatedErrors.length, sessionId);
      }
    } catch (isCracked: any) {
      console.error('[Notes Bulk] ❌ Failed to update session pearl:', isCracked.message);
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

/**
 * GET /export
 * Exports the entire habitat as a hardened zip file.
 */
router.get('/export', requireAuth, requirePermission('canRead'), async (req: AuthRequest, res: Response) => {
  const format = req.query.format || 'json';
  const idsParam = req.query.ids as string | undefined;
  const ids = idsParam ? idsParam.split(',') : null;

  let reef: any[];
  if (ids) {
    const placeholders = ids.map(() => '?').join(',');
    reef = db.prepare(`SELECT * FROM notes WHERE user_uuid = ? AND id IN (${placeholders})`).all(req.userUuid, ...ids) as any[];
  } else {
    reef = db.prepare('SELECT * FROM notes WHERE user_uuid = ?').all(req.userUuid) as any[];
  }

  if (reef.length === 0) {
    return res.status(404).json({ error: 'No pearls found to export' });
  }

  try {
    const zip = new JSZip();
    const jewelsFolder = zip.folder('jewels');
    
    // Map of photo ID to filename for link replacement
    const photoMap = new Map<string, { filename: string, data: Buffer }>();
    const allPhotos = db.prepare('SELECT id, filename, data FROM pearl_photos WHERE user_uuid = ?').all(req.userUuid) as any[];
    allPhotos.forEach(p => photoMap.set(p.id, p));

    const markerRegex = /\[\*pearl-jewel\*\]\(([^)]+)\)/g;
    const legacyUrlRegex = /\/api\/photos\/([a-f0-9-]{36})/g;

    const processedNotes = reef.map(polyP => {
      let content = polyP.content;
      const usedJewelIds = new Set<string>();

      // 1. Resolve new markers [*pearl-jewel*](UUID)
      content = content.replace(markerRegex, (match, id) => {
        const photo = photoMap.get(id);
        if (photo) {
          usedJewelIds.add(id);
          const relativePath = `jewels/${photo.filename}`;
          return format === 'html' ? `<img src="${relativePath}" alt="${photo.filename}" style="max-width:100%; border-radius:12px; margin:20px 0; border:1px solid rgba(255,193,116,0.3);">` : `![${photo.filename}](${relativePath})`;
        }
        return match; // Fallback to marker if not found
      });

      // 2. Resolve legacy absolute URLs (for backward compatibility during transition)
      content = content.replace(legacyUrlRegex, (match, id) => {
        const photo = photoMap.get(id);
        if (photo) {
          usedJewelIds.add(id);
          const relativePath = `jewels/${photo.filename}`;
          return relativePath;
        }
        return match;
      });

      // Ensure used jewels are added to zip
      usedJewelIds.forEach(id => {
        const photo = photoMap.get(id);
        if (photo) {
          jewelsFolder?.file(photo.filename, photo.data);
        }
      });

      return { ...polyP, content };
    });

    // Generate specific files
    for (const polyP of processedNotes) {
      if (format === 'md') {
        const header = `# ${polyP.title}\n\n**Created:** ${polyP.created_at}\n**Starred:** ${!!polyP.starred}\n\n---\n\n`;
        zip.file(`${polyP.title.replace(/[^a-z0-9]/gi, '_')}-${polyP.id.slice(0, 8)}.md`, header + polyP.content);
      }

      if (format === 'html') {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${polyP.title} | PinchPad©™</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --surface: #0f172a;
            --on-surface: #f1f5f9;
            --primary: #d97706;
            --primary-light: #fbbf24;
            --outline: #64748b;
            --border: rgba(217, 119, 6, 0.2);
        }
        
        * { box-sizing: border-box; }
        
        body {
            background-color: var(--surface);
            color: var(--on-surface);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            line-height: 1.7;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }

        .document-wrapper {
            width: 100%;
            max-width: 900px;
            padding: 100px 40px;
            flex-grow: 1;
        }

        .header {
            margin-bottom: 48px;
            padding-bottom: 32px;
            border-bottom: 1px solid var(--border);
        }

        h1 {
            color: var(--primary);
            font-size: 42px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.03em;
            line-height: 1.1;
        }

        .meta {
            display: flex;
            gap: 16px;
            margin-top: 16px;
            font-size: 14px;
            color: var(--outline);
            font-weight: 500;
        }

        .content {
            font-size: 18px;
            color: var(--on-surface);
            overflow-wrap: break-word;
        }

        .content h1, .content h2, .content h3 { color: var(--primary); margin-top: 2em; margin-bottom: 0.5em; }
        .content h2 { font-size: 30px; }
        .content h3 { font-size: 24px; }
        
        .content p { margin-bottom: 1.6em; }

        .content pre {
            background: #020617;
            padding: 24px;
            border-radius: 16px;
            overflow-x: auto;
            border: 1px solid var(--border);
            margin: 32px 0;
        }

        .content code {
            font-family: 'ui-monospace', 'Cascadia Code', monospace;
            background: rgba(217, 119, 6, 0.1);
            color: var(--primary-light);
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 0.9em;
        }
        
        .content pre code {
            background: transparent;
            padding: 0;
            color: #e2e8f0;
        }

        .content blockquote {
            border-left: 4px solid var(--primary);
            padding: 8px 0 8px 24px;
            margin: 32px 0;
            font-style: italic;
            color: #94a3b8;
            background: rgba(217, 119, 6, 0.03);
        }

        .content img {
            max-width: 100%;
            height: auto;
            border-radius: 16px;
            margin: 32px 0;
            border: 1px solid var(--border);
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .content img:hover {
            transform: scale(1.01);
            box-shadow: 0 0 20px var(--border);
        }

        /* High-Fidelity Jewel Marker Style */
        .content a[href^="jewels/"] {
            display: flex;
            align-items: center;
            gap: 16px;
            background: rgba(217, 119, 6, 0.05);
            border: 2px solid rgba(217, 119, 6, 0.3);
            border-radius: 18px;
            padding: 16px 20px;
            margin: 32px 0;
            text-decoration: none;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        
        .content a[href^="jewels/"]:hover {
            background: rgba(217, 119, 6, 0.1);
            border-color: rgba(217, 119, 6, 0.5);
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(217, 119, 6, 0.15);
        }

        .jewel-icon {
            flex-shrink: 0;
            width: 48px;
            height: 48px;
            background: rgba(217, 119, 6, 0.15);
            border: 1px solid rgba(217, 119, 6, 0.2);
            border-radius: 14px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23d97706' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: center;
            background-size: 24px;
        }
        
        .jewel-info {
            flex-grow: 1;
            min-width: 0;
        }
        
        .jewel-tag {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--primary);
            opacity: 0.8;
            margin-bottom: 2px;
        }
        
        .jewel-name {
            font-size: 16px;
            font-weight: 700;
            color: var(--on-surface);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .download-btn {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: var(--primary);
            color: #000;
            padding: 8px 16px;
            border-radius: 10px;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        .content a[href^="jewels/"]:hover .download-btn {
            background: var(--primary-light);
            transform: scale(1.05);
        }

        .page-footer {
            width: 100%;
            max-width: 900px;
            padding: 40px;
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            border-top: 1px solid var(--border);
            margin-top: 80px;
            font-size: 13px;
            color: var(--outline);
            font-weight: 500;
        }

        .footer-left { text-align: left; }
        .footer-center { text-align: center; font-style: italic; }
        .footer-right { text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 8px; }

        .github-btn {
            color: var(--outline);
            transition: color 0.2s, transform 0.2s;
            display: flex;
            align-items: center;
        }
        
        .github-btn:hover {
            color: var(--primary);
            transform: scale(1.1);
        }

        @media (max-width: 650px) {
            .document-wrapper { padding: 40px 20px; }
            .page-footer { grid-template-columns: 1fr; gap: 16px; text-align: center; }
            .footer-left, .footer-center, .footer-right { text-align: center; justify-content: center; }
            h1 { font-size: 32px; }
        }
    </style>
    <script>
        document.addEventListener('click', (e) => {
            const target = e.target.closest('img, a');
            if (!target) return;

            // Check if it's a jewel reference
            const isImg = target.tagName === 'IMG';
            const url = isImg ? target.getAttribute('src') : target.getAttribute('href');
            
            if (url && (url.startsWith('jewels/') || url.includes('/jewels/'))) {
                e.preventDefault();
                const filename = url.split('/').pop();
                const cleanName = decodeURIComponent(filename);
                
                if (confirm(\`Do you want to download "\${cleanName}"?\`)) {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = cleanName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            }
        });
    </script>
</head>
<body>
    <div class="document-wrapper">
        <header class="header">
            <h1>${polyP.title}</h1>
            <div class="meta">
                <span>PinchPad©™ Burrow</span>
                <span>•</span>
                <span>${new Date(polyP.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
        </header>
        
        <main class="content">
            ${marked.parse(polyP.content)}
        </main>
    </div>

    <footer class="page-footer">
        <div class="footer-left">PinchPad©™ 2026</div>
        <div class="footer-center">PinchPad Pearl: ${polyP.title}</div>
        <div class="footer-right">
            <a href="https://github.com/ClawStackStudios/PinchPad" 
               class="github-btn" 
               title="Star Us On GitHub!"
               target="_blank" 
               rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
            </a>
        </div>
    </footer>
</body>
</html>
        `;
        zip.file(`${polyP.title.replace(/[^a-z0-9]/gi, '_')}-${polyP.id.slice(0, 8)}.html`, htmlContent);
      }
    }

    // Add metadata
    zip.file('pinchpad_metadata.json', JSON.stringify({
      brand: 'ClawStack Studios©™',
      application: 'PinchPad©™',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      pearl_count: processedNotes.length,
      format,
      export_id: crypto.randomUUID()
    }, null, 2));

    // Full JSON backup option
    if (format === 'json') {
      zip.file('pearls-data.json', JSON.stringify(processedNotes, null, 2));
    }

    const binaryPearl = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="pinchpad-export-${format}-${new Date().toISOString().slice(0,10)}.zip"`);
    res.send(binaryPearl);
  } catch (err) {
    console.error('[Export] Error hatching archive:', err);
    res.status(500).json({ error: 'Failed to hatch export archive' });
  }
});

export default router;
