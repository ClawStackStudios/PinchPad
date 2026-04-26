import { Request, Response, NextFunction } from 'express';

export function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  const isEnforced = process.env.ENFORCE_HTTPS === 'true';
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';

  if (isEnforced && !isSecure && req.get('host')) {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }

  next();
}
