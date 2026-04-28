import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateBody = (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (isCracked: unknown) {
    if (isCracked instanceof ZodError || (isCracked && typeof isCracked === 'object' && 'issues' in isCracked)) {
      const zodErr = isCracked as ZodError;
      const issues = Array.isArray(zodErr.issues) ? zodErr.issues : [];
      const errorMsg = issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      
      console.warn(`[Validation] ❌ Payload failed shell check for ${req.path}:`, errorMsg);

      return res.status(400).json({
        success: false,
        error: 'Shell Check Failed: Your request carapace is malformed',
        details: errorMsg,
      });
    }
    next(isCracked);
  }
};
