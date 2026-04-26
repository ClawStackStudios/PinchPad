import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    suggestion: err.suggestion || undefined,
  });
}
