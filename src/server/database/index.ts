import mainDb from './connection';
import { createConnection } from './connection';
import { initializeSchema, initializeAuditSchema } from './schema';
import { runMigrations } from './migrations';
import { createAuditLogger } from '../utils/auditLogger';

// Default encryption for audit logs if main DB is encrypted
const encryptionKey = process.env.DB_ENCRYPTION_KEY;

// Initialize and migrate Main DB
initializeSchema(mainDb);
runMigrations(mainDb);

// Initialize Audit DB (Separate file for segregation)
const auditDb = createConnection('audit.sqlite', encryptionKey);
initializeAuditSchema(auditDb);

// Centralized Audit Logger Singleton
const audit = createAuditLogger(auditDb);


/**
 * Delete all expired API tokens from the database
 */
export function purgeExpiredTokens(): number {
  try {
    const result = mainDb
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

export default mainDb;
export { mainDb as db, auditDb, audit };

