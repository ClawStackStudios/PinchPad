import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import globalDb from '../db';

export interface AuthRequest extends Request {
  db?: any;
  user?: {
    uuid: string;
    keyType: 'human' | 'lobster';
    permissions?: Record<string, boolean>;
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
      db.prepare('DELETE FROM api_tokens WHERE key = ?').run(tokenHash);
      return res.status(401).json({ error: 'Token expired' });
    }

    let permissions = {};
    if (session.owner_type === 'lobster' && session.lobster_key_id) {
      const lobster = db.prepare('SELECT permissions FROM lobster_keys WHERE id = ?').get(session.lobster_key_id) as any;
      if (lobster) {
        permissions = JSON.parse(lobster.permissions);
      }
    }

    req.user = {
      uuid: session.owner_uuid,
      keyType: session.owner_type as 'human' | 'lobster',
      permissions
    };

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    if (req.user.keyType === 'human') {
      return next(); // Humans have full access
    }

    const hasPermission = req.user.permissions && req.user.permissions[permission] === true;
    if (!hasPermission) {
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
