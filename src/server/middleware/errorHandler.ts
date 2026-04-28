import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // ─── Category 1: JSON Parse Errors ──────────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
  }

  let status = err.status || 500;
  let message: string;

  // ─── Category 2: Database Constraint Violations ─────────────────────────────
  if (err.message?.includes('UNIQUE constraint failed')) {
    status = 409;
    message = 'A resource with this value already exists.';
  } else if (err.message?.includes('FOREIGN KEY constraint failed')) {
    status = 400;
    message = 'Referenced resource does not exist or cannot be deleted.';
  }
  // ─── Category 3: Unknown Errors ─────────────────────────────────────────────
  else {
    message = isProduction
      ? 'A tidepool disturbance occurred. The Reef is currently experiencing issues. Please try again later.'
      : err.message || 'Internal Server Error';
  }

  res.status(status).json({
    success: false,
    error: message,
    suggestion: err.suggestion || undefined,
  });
};
