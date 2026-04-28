import { Database } from 'better-sqlite3-multiple-ciphers';

/**
 * Calculates the expiration date based on a TTL string.
 */
export function calculateExpiry(ttl: string | null | undefined): string | null {
  if (!ttl || ttl === 'never') return null;

  const now = Date.now();

  if (ttl.endsWith('d')) {
    const days = parseInt(ttl.slice(0, -1), 10);
    if (isNaN(days) || days <= 0) throw new Error(`Invalid TTL format: ${ttl}`);
    return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
  }

  if (ttl.endsWith('days')) {
    const days = parseInt(ttl.slice(0, -4), 10);
    if (isNaN(days) || days <= 0) throw new Error(`Invalid TTL format: ${ttl}`);
    return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
  }

  if (ttl === '1year') {
    return new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  const match = ttl.match(/^(\d+)([hms])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    let ms = 24 * 60 * 60 * 1000;
    switch (unit) {
      case 'h': ms = value * 60 * 60 * 1000; break;
      case 'm': ms = value * 60 * 1000; break;
      case 's': ms = value * 1000; break;
    }
    return new Date(now + ms).toISOString();
  }

  const customDate = new Date(ttl);
  if (isNaN(customDate.getTime())) throw new Error(`Invalid custom date: ${ttl}`);
  if (customDate.getTime() <= now) throw new Error('Custom expiry date must be in the future');

  return customDate.toISOString();
}

/**
 * Checks if a molt (token) has expired.
 * Returns true if the shell is still hard (valid).
 */
export function checkMoltExpiry(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}

/**
 * Gets the remaining lifespan of a shell.
 */
export function getTimeUntilExpiry(expiresAt: string | null | undefined) {
  if (!expiresAt) return { days: Infinity, hours: Infinity, minutes: Infinity, hasMoltExpired: false };

  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, hasMoltExpired: true };

  return {
    days: Math.floor(diff / (24 * 60 * 60 * 1000)),
    hours: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
    minutes: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
    hasMoltExpired: false,
  };
}

/**
 * Formats the expiry state for the lobster.
 */
export function formatExpiry(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Never expires';
  const { days, hours, hasMoltExpired } = getTimeUntilExpiry(expiresAt);
  if (hasMoltExpired) return 'Expired';
  if (days > 30) return `Expires in ${Math.floor(days / 30)} month(s)`;
  if (days > 0) return `Expires in ${days} day(s)`;
  return `Expires in ${hours} hour(s)`;
}

/**
 * Purges all expired shells (tokens) from the reef.
 */
export function purgeExpiredShells(db: Database): number {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      DELETE FROM api_tokens
      WHERE expires_at IS NOT NULL AND expires_at < ?
    `).run(now);
    if (result.changes > 0) console.log(`🗑️  Purged ${result.changes} expired shells from the reef`);
    return result.changes;
  } catch (isCracked: any) {
    console.error('[TokenCleanup] ❌ Purge failed:', isCracked.message);
    return 0;
  }
}

/**
 * Schedules a recurring molt cleanup.
 */
export function scheduleMoltCleanup(db: Database): void {
  const DAILY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next3am = new Date(
    now.getFullYear(), now.getMonth(),
    now.getDate() + (now.getHours() >= 3 ? 1 : 0),
    3, 0, 0, 0
  );
  const msUntil3am = next3am.getTime() - now.getTime();

  purgeExpiredShells(db);

  setTimeout(() => {
    purgeExpiredShells(db);
    setInterval(() => purgeExpiredShells(db), DAILY_MS);
  }, msUntil3am);

  console.log(`⏰ Molt cleanup scheduled for ${next3am.toISOString()}`);
}

/**
 * Hardens a molt (token) by extending its lifespan.
 */
export function extendTokenExpiry(db: Database, token: string, ttl = '90d'): string | null {
  const newExpiry = calculateExpiry(ttl);
  db.prepare(`UPDATE api_tokens SET expires_at = ? WHERE key = ?`).run(newExpiry, token);
  return newExpiry;
}

