import { Database } from 'better-sqlite3-multiple-ciphers';

export interface AuditEntry {
  actor?: string;
  actor_type?: string;
  resource?: string;
  action: string;
  outcome: string;
  ip_address?: string | undefined;
  user_agent?: string | undefined;
  details?: Record<string, unknown>;
}

export function createAuditLogger(db: Database) {

  const insertStmt = db.prepare(`

    INSERT INTO audit_logs (
      timestamp, event_type, actor, actor_type, resource,
      action, outcome, ip_address, user_agent, details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    log(eventType: string, data: AuditEntry) {
      // Redact sensitive payload info
      let safeDetails: Record<string, unknown> | null = null;
      if (data.details) {
        safeDetails = { ...data.details };
        if (safeDetails.keyHash) safeDetails.keyHash = '***REDACTED***';
        if (safeDetails.humanKey) safeDetails.humanKey = '***REDACTED***';
      }

      insertStmt.run(
        new Date().toISOString(),
        eventType,
        data.actor ?? null,
        data.actor_type ?? null,
        data.resource ?? null,
        data.action,
        data.outcome,
        data.ip_address ?? null,
        data.user_agent ?? null,
        safeDetails ? JSON.stringify(safeDetails) : null
      );
    },

    query(filters: {
      event_type?: string;
      actor?: string;
      outcome?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
      offset?: number;
    } = {}) {
      let sql = 'SELECT * FROM audit_logs WHERE 1=1';
      const params: unknown[] = [];

      if (filters.event_type) { sql += ' AND event_type = ?'; params.push(filters.event_type); }
      if (filters.actor)      { sql += ' AND actor = ?';      params.push(filters.actor); }
      if (filters.outcome)    { sql += ' AND outcome = ?';    params.push(filters.outcome); }
      if (filters.start_date) { sql += ' AND timestamp >= ?'; params.push(filters.start_date); }
      if (filters.end_date)   { sql += ' AND timestamp <= ?'; params.push(filters.end_date); }

      sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(filters.limit ?? 100);
      params.push(filters.offset ?? 0);

      return db.prepare(sql).all(...params);
    },

    /**
     * Clean logs older than retentionDays OR keep only maxRows (whichever is stricter)
    /**
     * Enforces database size and retention limits.
     * Prunes events older than their respective cutoff dates.
     */
    cleanup(auditRetentionDays = 90, uptimeRetentionDays = 30, maxRows = 10000): { prunedByAge: number, prunedByCount: number } {
      const now = Date.now();
      
      const auditCutoffDate = new Date(now - (Number(auditRetentionDays) || 90) * 24 * 60 * 60 * 1000).toISOString();
      const uptimeCutoffDate = new Date(now - (Number(uptimeRetentionDays) || 30) * 24 * 60 * 60 * 1000).toISOString();
      
      // 1. Prune by age (separated by event type)
      let agePruneCount = 0;
      agePruneCount += db.prepare('DELETE FROM audit_logs WHERE event_type NOT IN ("SYSTEM_START", "SYSTEM_SHUTDOWN") AND timestamp < ?').run(auditCutoffDate).changes;
      agePruneCount += db.prepare('DELETE FROM audit_logs WHERE event_type IN ("SYSTEM_START", "SYSTEM_SHUTDOWN") AND timestamp < ?').run(uptimeCutoffDate).changes;
      
      // 2. Prune by count (keep only the newest 10,000 across all)
      const countPrune = db.prepare(`
        DELETE FROM audit_logs WHERE id NOT IN (
          SELECT id FROM audit_logs ORDER BY timestamp DESC LIMIT ?
        )
      `).run(maxRows);

      return {
        prunedByAge: agePruneCount,
        prunedByCount: countPrune.changes
      };
    }
  };
}

