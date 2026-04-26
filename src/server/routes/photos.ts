import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import singletonDb from '../database/index';
import { requireAuth } from '../middleware/auth';
import { createAuditLogger } from '../utils/auditLogger';

const router = Router();
const audit = createAuditLogger(singletonDb);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/** POST /api/photos/upload — Upload a photo for a pearl */
router.post('/upload', requireAuth(), upload.single('photo'), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const { pearlId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!pearlId) {
    return res.status(400).json({ error: 'Pearl ID is required' });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    // Verify pearl existence and ownership
    const pearl = db.prepare('SELECT id FROM notes WHERE id = ? AND user_uuid = ?').get(pearlId, req.user!.uuid);
    if (!pearl) {
      return res.status(404).json({ error: 'Pearl not found or access denied' });
    }

    db.prepare(`
      INSERT INTO pearl_photos (id, pearl_id, user_uuid, filename, mime_type, data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      pearlId,
      req.user!.uuid,
      file.originalname,
      file.mimetype,
      file.buffer,
      now
    );

    audit.log('PHOTO_UPLOAD', {
      actor: req.user!.uuid,
      actor_type: 'human',
      action: 'upload',
      outcome: 'success',
      resource: 'photo',
      details: { photo_id: id, pearl_id: pearlId },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.status(201).json({ 
      success: true, 
      data: { 
        id, 
        filename: file.originalname,
        mimeType: file.mimetype,
        url: `/api/photos/${id}` 
      } 
    });
  } catch (error) {
    console.error('[Photos] Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

/** GET /api/photos/:id — Serve photo binary */
router.get('/:id', (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const { id } = req.params;

  try {
    const photo = db.prepare('SELECT data, mime_type FROM pearl_photos WHERE id = ?').get(id) as any;
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.setHeader('Content-Type', photo.mime_type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(photo.data);
  } catch (error) {
    console.error('[Photos] Serve error:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
});

/** DELETE /api/photos/:id — Delete a photo */
router.delete('/:id', requireAuth(), (req: any, res: Response) => {
  const db = req.db || singletonDb;
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM pearl_photos WHERE id = ? AND user_uuid = ?').run(id, req.user!.uuid);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Photo not found or access denied' });
    }

    audit.log('PHOTO_DELETE', {
      actor: req.user!.uuid,
      actor_type: 'human',
      action: 'delete',
      outcome: 'success',
      resource: 'photo',
      details: { photo_id: id },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'] as string
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[Photos] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
