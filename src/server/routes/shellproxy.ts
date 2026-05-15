import { Router, Response, Request } from 'express';
import db from '../database/index';
import { scuttleParse } from '../../shared/lib/safeJSON';

/** Only these MIME types are allowed through the membrane */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/svg+xml', 'image/avif', 'image/bmp', 'image/tiff',
]);

const router = Router();

/**
 * Validates a share hash.
 * - Must be 64 characters (hex string from crypto.randomBytes(32))
 * - Only alphanumeric
 */
const isValidHash = (hash: string) => /^[a-f0-9]{64}$/i.test(hash);

/**
 * The Membrane Middleware
 * Protects all ShellProxy routes. Drops invalid hashes immediately.
 */
const shellProxyGuard = (req: Request, res: Response, next: any) => {
  const { share_hash } = req.params;
  
  if (!share_hash || !isValidHash(share_hash)) {
    // Silent drop for invalid formats (no helpful error messages for scanners)
    return res.status(404).end();
  }
  
  next();
};

/**
 * GET /shellproxy/share/:share_hash
 * Retrieves a sanitized version of the shared Pearl.
 */
router.get('/share/:share_hash', shellProxyGuard, (req: Request, res: Response) => {
  const { share_hash } = req.params;

  try {
    const shareRow = db.prepare(`
      SELECT pearl_shares.*, notes.title, notes.content, notes.tags, notes.created_at, notes.updated_at
      FROM pearl_shares
      JOIN notes ON pearl_shares.pearl_id = notes.id
      WHERE pearl_shares.share_hash = ?
        AND (pearl_shares.expires_at IS NULL OR pearl_shares.expires_at > datetime('now'))
    `).get(share_hash) as any;

    if (!shareRow) {
      return res.status(404).end();
    }

    // Expiration is now checked in the SQL query above — no JS-side date check needed.

    // Fetch associated photos (but strip internal UUIDs, just return IDs for URLs)
    const photos = db.prepare(`
      SELECT id, filename, mime_type
      FROM pearl_photos
      WHERE pearl_id = ?
    `).all(shareRow.pearl_id) as any[];

    // Sanitize payload: never return the user_uuid, internal pot_ids, or exact pearl_id
    // We only return what the public is allowed to see.
    const publicPayload = {
      title: shareRow.title,
      content: shareRow.content,
      tags: scuttleParse<string[]>(shareRow.tags, []),
      created_at: shareRow.created_at,
      updated_at: shareRow.updated_at,
      photos: photos.map(p => ({
        id: p.id,
        filename: p.filename,
        mimeType: p.mime_type,
        // The URL uses the shellproxy route, requiring the share_hash
        url: `/shellproxy/share/${share_hash}/photos/${p.id}`
      }))
    };

    res.json({ success: true, data: publicPayload });
  } catch (err) {
    console.error('[ShellProxy] Error fetching share:', err);
    res.status(404).end(); // Always 404, never 500 to prevent info leakage
  }
});

/**
 * GET /shellproxy/share/:share_hash/photos/:photo_id
 * Returns the raw binary image data for a photo attached to a shared Pearl.
 */
router.get('/share/:share_hash/photos/:photo_id', shellProxyGuard, (req: Request, res: Response) => {
  const { share_hash, photo_id } = req.params;

  try {
    // Validate photo_id format (UUID v4) to prevent path traversal or injection
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(photo_id)) {
      return res.status(404).end();
    }

    const row = db.prepare(`
      SELECT pearl_photos.data, pearl_photos.mime_type
      FROM pearl_shares
      JOIN pearl_photos ON pearl_shares.pearl_id = pearl_photos.pearl_id
      WHERE pearl_shares.share_hash = ?
        AND pearl_photos.id = ?
        AND (pearl_shares.expires_at IS NULL OR pearl_shares.expires_at > datetime('now'))
    `).get(share_hash, photo_id) as any;

    if (!row) {
      return res.status(404).end();
    }

    // CRITICAL-3: Whitelist MIME types — never trust the DB blindly
    const safeMime = ALLOWED_MIME_TYPES.has(row.mime_type) ? row.mime_type : 'application/octet-stream';

    res.setHeader('Content-Type', safeMime);
    res.setHeader('Content-Disposition', 'inline'); // Prevent download-as-HTML attacks
    res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.send(row.data);
  } catch (err) {
    console.error('[ShellProxy] Error fetching photo:', err);
    res.status(404).end();
  }
});

export default router;
