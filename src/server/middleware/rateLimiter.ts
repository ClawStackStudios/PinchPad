import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import db from '../database/index';
import { AuthRequest } from './auth';

console.log('[CrustAgent] 🦞 Hardening the rate limiting armor...');

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

/**
 * Lobster Key Rate Limiter
 * Refactored to avoid ERR_ERL_CREATED_IN_REQUEST_HANDLER by using a single
 * pre-initialized limiter with dynamic 'max' and 'keyGenerator' functions.
 */
export const agentKeyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => (req as AuthRequest).agentRateLimit || 100,
  keyGenerator: (req) => (req as AuthRequest).agentApiKey || 'anonymous-lobster',
  skip: (req) => {
    const authReq = req as AuthRequest;
    return (
      authReq.keyType === 'human' ||
      !authReq.agentApiKey ||
      (req.method === 'POST' && req.path === '/notes/bulk')
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    error: 'Your carapace lacks the capacity! Lobster rate limit exceeded.' 
  },
});

// Legacy wrapper to maintain compatibility with existing middleware chains
export const createAgentKeyRateLimiter = () => agentKeyLimiter;
