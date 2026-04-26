import { Database } from 'better-sqlite3-multiple-ciphers';

/**
 * Calculates expiry date based on a TTL string (e.g., '1d', '24h').
 */
export function calculateExpiry(ttl: string): string {
  const now = Date.now();
  let ms = 24 * 60 * 60 * 1000; // Default 1 day

  const match = ttl.match(/^(\d+)([dhms])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 'd': ms = value * 24 * 60 * 60 * 1000; break;
      case 'h': ms = value * 60 * 60 * 1000; break;
      case 'm': ms = value * 60 * 1000; break;
      case 's': ms = value * 1000; break;
    }
  }

  return new Date(now + ms).toISOString();
}

/**
 * Schedules periodic token cleanup.
 */
export function scheduleTokenCleanup(db: Database) {
  const interval = 60 * 60 * 1000; // Hourly
  
  setInterval(() => {
    try {
      const result = db.prepare(`DELETE FROM api_tokens WHERE datetime(expires_at) <= datetime('now')`).run();
      if (result.changes > 0) {
        console.log(`[TokenCleanup] Purged ${result.changes} expired token(s)`);
      }
    } catch (e) {
      console.error('[TokenCleanup] Error:', e);
    }
  }, interval);
}
