import crypto from 'crypto';

/**
 * Constant-time comparison for strings to prevent timing side-channel attacks.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Timing-safe comparison with pre-hashing.
 * Recommended for comparing sensitive values like API keys where length might vary.
 */
export function timingSafeEqualWithHashing(storedValue: string, providedValue: string): boolean {
  try {
    const storedHash = crypto.createHash('sha256').update(storedValue).digest();
    const providedHash = crypto.createHash('sha256').update(providedValue).digest();
    return crypto.timingSafeEqual(storedHash, providedHash);
  } catch {
    return false;
  }
}

/**
 * Generate a random string of specified length using base62.
 */
export function generateString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  while (result.length < length) {
    const bytes = crypto.randomBytes(1);
    const val = bytes[0];
    if (val < 248) { // 256 - (256 % 62) = 248 to avoid bias
      result += charset[val % 62];
    }
  }
  return result;
}

/**
 * Generate a random ID (UUID format).
 */
export function generateId(): string {
  return crypto.randomUUID();
}
