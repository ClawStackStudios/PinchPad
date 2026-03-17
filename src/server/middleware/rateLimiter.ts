import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { AuthRequest } from './auth';

/**
 * Lobster Key Rate Limiting
 *
 * Per-key rate limiting for agent (lobster) keys with LRU-evicting cache.
 * - rate_limit = requests per minute (NULL = unlimited)
 * - Cache limited to MAX_CACHE_SIZE (100) with LRU eviction
 * - Human keys bypass this limiter
 *
 * Why LRU cache:
 * Without it, the limiterCache Map would grow unbounded as you create/test
 * many agent keys. With 1000+ keys, you'd hold 1000+ RateLimit instances.
 * LRU eviction caps memory usage while keeping hot keys cached.
 */

const MAX_CACHE_SIZE = 100;
const limiterCache = new Map<string, RateLimitRequestHandler>();

/**
 * Evict the oldest entry from the cache (FIFO — Map preserves insertion order)
 */
function evictOldest() {
  const oldestKey = limiterCache.keys().next().value;
  if (oldestKey) {
    limiterCache.delete(oldestKey);
  }
}

/**
 * Get or create a rate limiter for a specific lobster key
 * Uses express-rate-limit with a custom keyGenerator to track per-key
 */
function getLimiterForKey(keyId: string, limit: number): RateLimitRequestHandler {
  if (!limiterCache.has(keyId)) {
    if (limiterCache.size >= MAX_CACHE_SIZE) {
      evictOldest();
    }

    limiterCache.set(
      keyId,
      rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: limit,
        keyGenerator: (req) => {
          // Use the lobster key ID as the rate limit key (not IP)
          // This ensures per-key enforcement
          return (req as AuthRequest).user?.lobsterKeyId || 'unknown';
        },
        skip: (req) => {
          // Don't skip — always enforce
          return false;
        },
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            error: 'Your carapace lacks the capacity! Agent rate limit exceeded.',
          });
        },
      })
    );
  }

  return limiterCache.get(keyId)!;
}

/**
 * Express middleware: Apply per-key rate limiting for lobster keys
 *
 * Flow:
 * 1. Skip if not authenticated or not a lobster key
 * 2. Skip if rate_limit is NULL or 0 (unlimited)
 * 3. Otherwise, apply rate limiter keyed to lobster key ID
 */
export const lobsterRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;

  // Only apply to lobster keys
  if (!authReq.user || authReq.user.keyType !== 'lobster') {
    return next();
  }

  // Skip if no rate limit configured (unlimited)
  if (!authReq.user.rateLimit || authReq.user.rateLimit <= 0) {
    return next();
  }

  // Skip if no key ID (shouldn't happen, but defensive)
  if (!authReq.user.lobsterKeyId) {
    return next();
  }

  // Get or create limiter and apply it
  const limiter = getLimiterForKey(authReq.user.lobsterKeyId, authReq.user.rateLimit);
  return limiter(req, res, next);
};
