import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import db from '../database/index';
import { AuthRequest } from './auth';

function parseWindow(windowStr: string | undefined): number | null {
  if (!windowStr) return null;
  if (windowStr.endsWith('m')) return parseInt(windowStr) * 60 * 1000;
  if (windowStr.endsWith('s')) return parseInt(windowStr) * 1000;
  return parseInt(windowStr);
}

export const authLimiter = rateLimit({
  windowMs: parseWindow(process.env.AUTH_RATE_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'The Reef is crowded! Too many login attempts. Please rest your claws and try again later.',
  },
  skipSuccessfulRequests: true,
});

export const apiLimiter = rateLimit({
  windowMs: parseWindow(process.env.API_RATE_WINDOW) || 1 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'POST' && req.path === '/notes/bulk',
  message: {
    success: false,
    error: "The Reef is crowded! You've exceeded your rate limit. Please slow down your requests.",
  },
});

export const createAgentKeyRateLimiter = () => {
  const limiterCache = new Map<string, ReturnType<typeof rateLimit>>();
  const MAX_CACHE_SIZE = 100;

  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (
      authReq.keyType === 'human' ||
      !authReq.apiKey ||
      (req.method === 'POST' && req.path === '/notes/bulk')
    ) return next();

    let limit: number | null = null;
    let agentApiKey: string | null = null;

    if (authReq.keyType === 'agent' && authReq.agentApiKey && authReq.agentRateLimit) {
      limit = authReq.agentRateLimit;
      agentApiKey = authReq.agentApiKey;
    }

    if (!limit || !agentApiKey) return next();

    if (!limiterCache.has(agentApiKey)) {
      if (limiterCache.size >= MAX_CACHE_SIZE) {
        const firstKey = limiterCache.keys().next().value as string;
        limiterCache.delete(firstKey);
      }

      limiterCache.set(agentApiKey, rateLimit({
        windowMs: 60 * 1000,
        max: limit,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => agentApiKey as string,
        message: { success: false, error: 'Your carapace lacks the capacity! Agent rate limit exceeded.' },
      }));
    }

    limiterCache.get(agentApiKey)!(req, res, next);
  };
};
