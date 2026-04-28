import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateBody = (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (error: unknown) {
    if (error instanceof ZodError || (error && typeof error === 'object' && 'issues' in error)) {
      const zodErr = error as ZodError;
      const issues = Array.isArray(zodErr.issues) ? zodErr.issues : [];
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Your request form is malformed',
        details: issues.map(e => ({
          path: Array.isArray(e.path) ? e.path.join('.') : '',
          message: e.message || 'Invalid field',
        })),
      });
    }
    next(error);
  }
};
