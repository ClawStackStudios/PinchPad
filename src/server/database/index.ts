import dbInstance from './connection';
import { initializeSchema } from './schema';
import { runMigrations } from './migrations';

// Initialize and migrate on load
initializeSchema(dbInstance);
runMigrations(dbInstance);

/**
 * Delete all expired API tokens from the database
 */
export function purgeExpiredTokens(): number {
  try {
    const result = dbInstance
      .prepare(`DELETE FROM api_tokens WHERE datetime(expires_at) <= datetime('now')`)
      .run();
    if (result.changes > 0) {
      console.log(`[Database] Purged ${result.changes} expired token(s)`);
    }
    return result.changes;
  } catch (err) {
    console.error('[Database] Error purging expired tokens:', err);
    return 0;
  }
}

export default dbInstance;
export { dbInstance as db };
