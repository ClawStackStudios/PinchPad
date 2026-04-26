import { Database } from 'better-sqlite3-multiple-ciphers';

export interface AuditEvent {
  event_type: string;
  actor?: string | null;
  actor_type?: string | null;
  resource?: string | null;
  action: string;
  outcome: string;
  ip_address?: string | null;
  user_agent?: string | null;
  details?: Record<string, unknown> | null;
}

export function createAuditLogger(db: Database) {
  return {
    log(eventType: string, event: Partial<AuditEvent>) {
      try {
        db.prepare(`
          INSERT INTO audit_logs (
            timestamp, event_type, actor, actor_type, resource, action, outcome, ip_address, user_agent, details
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          new Date().toISOString(),
          eventType,
          event.actor ?? null,
          event.actor_type ?? null,
          event.resource ?? null,
          event.action ?? 'unknown',
          event.outcome ?? 'unknown',
          event.ip_address ?? null,
          event.user_agent ?? null,
          event.details ? JSON.stringify(event.details) : null
        );
      } catch (e) {
        console.error('[Audit] Failed to log event:', e);
      }
    },

    cleanup(daysToKeep: number) {
      try {
        const result = db.prepare(`
          DELETE FROM audit_logs 
          WHERE datetime(timestamp) < datetime('now', ?)
        `).run(`-${daysToKeep} days`);
        
        if (result.changes > 0) {
          console.log(`[Audit] Purged ${result.changes} old audit log entries`);
        }
      } catch (e) {
        console.error('[Audit] Failed to cleanup old logs:', e);
      }
    }
  };
}
