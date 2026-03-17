import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Lobster Key Rate Limiting
 *
 * Per-key rate limiting for agent (lobster) keys with in-memory counter store.
 * - rate_limit = requests per minute (NULL = unlimited)
 * - Counter store limited to MAX_CACHE_SIZE (100) with LRU eviction
 * - Human keys bypass this limiter
 *
 * Why in-memory counters instead of express-rate-limit library:
 * The express-rate-limit library enforces that all limiters are created at app init,
 * not per-request. This doesn't work for dynamic per-key limits where we discover the
 * limit from the database. Instead, we manage request counters ourselves.
 *
 * Window-based approach:
 * - Tracks request count per key per 60-second window
 * - Resets counter when window expires
 * - Resets are lazy (checked on next request)
 */

const MAX_CACHE_SIZE = 100;

interface RateLimitEntry {
  count: number;
  windowStart: number; // timestamp when window opened
  limit: number; // requests per minute for this key
}

const counterStore = new Map<string, RateLimitEntry>();

/**
 * Evict the oldest entry from the counter store (FIFO — Map preserves insertion order)
 */
function evictOldest() {
  const oldestKey = counterStore.keys().next().value;
  if (oldestKey) {
    counterStore.delete(oldestKey);
  }
}

/**
 * Check and increment rate limit for a key
 * Returns: { allowed: boolean; remaining: number; resetTime: number }
 */
function checkRateLimit(keyId: string, limit: number): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const WINDOW_MS = 60 * 1000; // 1 minute

  let entry = counterStore.get(keyId);

  // Window expired or entry doesn't exist — create new window
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    entry = {
      count: 0,
      windowStart: now,
      limit,
    };

    // Manage cache size
    if (counterStore.size >= MAX_CACHE_SIZE) {
      evictOldest();
    }

    counterStore.set(keyId, entry);
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  const resetTime = entry.windowStart + WINDOW_MS;

  return { allowed, remaining, resetTime };
}

/**
 * Express middleware: Apply per-key rate limiting for lobster keys
 *
 * Flow:
 * 1. Skip if not authenticated or not a lobster key
 * 2. Skip if rate_limit is NULL or 0 (unlimited)
 * 3. Check counter; if over limit, respond with 429
 * 4. Otherwise, attach rate limit headers and continue
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

  // Check rate limit
  const { allowed, remaining, resetTime } = checkRateLimit(
    authReq.user.lobsterKeyId,
    authReq.user.rateLimit
  );

  // Set rate limit headers
  res.setHeader('RateLimit-Limit', authReq.user.rateLimit.toString());
  res.setHeader('RateLimit-Remaining', remaining.toString());
  res.setHeader('RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: 'Your carapace lacks the capacity! Agent rate limit exceeded.',
    });
  }

  return next();
};
