import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import globalDb from '../db';

function logAudit(db: any, event: {
  event_type: string;
  actor?: string | null;
  actor_type?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
}) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (timestamp, event_type, actor, actor_type, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      new Date().toISOString(),
      event.event_type,
      event.actor ?? null,
      event.actor_type ?? null,
      event.ip_address ?? null,
      event.user_agent ?? null,
      event.details ? JSON.stringify(event.details) : null
    );
  } catch (e) {
    console.error('[Audit] Failed to log event:', e);
  }
}

export interface AuthRequest extends Request {
  db?: any;
  user?: {
    uuid: string;
    keyType: 'human' | 'lobster';
    permissions?: Record<string, boolean>;
    rateLimit?: number | null;
    lobsterKeyId?: string | null;
  };
}

export const requireAuth = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const db = req.db || globalDb;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = db.prepare('SELECT * FROM api_tokens WHERE key = ?').get(tokenHash) as any;
    if (!session) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      logAudit(db, {
        event_type: 'AUTH_TOKEN_EXPIRED',
        actor: session.owner_uuid,
        actor_type: session.owner_type,
        ip_address: req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || null,
      });
      db.prepare('DELETE FROM api_tokens WHERE key = ?').run(tokenHash);
      return res.status(401).json({ error: 'Token expired' });
    }

    let permissions = {};
    let rateLimit: number | null = null;
    if (session.owner_type === 'lobster' && session.lobster_key_id) {
      const lobster = db.prepare('SELECT permissions, rate_limit FROM lobster_keys WHERE id = ?').get(session.lobster_key_id) as any;
      if (lobster) {
        permissions = JSON.parse(lobster.permissions);
        rateLimit = lobster.rate_limit ?? null;
      }
    }

    req.user = {
      uuid: session.owner_uuid,
      keyType: session.owner_type as 'human' | 'lobster',
      permissions,
      rateLimit,
      lobsterKeyId: session.lobster_key_id ?? null
    };

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const db = req.db || globalDb;
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    if (req.user.keyType === 'human') {
      return next(); // Humans have full access
    }

    const hasPermission = req.user.permissions && req.user.permissions[permission] === true;
    if (!hasPermission) {
      logAudit(db, {
        event_type: 'PERMISSION_DENIED',
        actor: req.user.uuid,
        actor_type: req.user.keyType,
        ip_address: req.ip || 'unknown',
        user_agent: (req.headers && req.headers['user-agent']) || null,
        details: { required_permission: permission },
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireHuman = () => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    if (req.user.keyType !== 'human') {
      return res.status(403).json({
        error: 'This operation is for humans only',
        reason: 'Agent keys cannot access sensitive endpoints'
      });
    }
    next();
  };
};
