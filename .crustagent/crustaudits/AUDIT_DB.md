---
agent: db-auditor
status: warn
findings: 2
---

# Database Audit Report

## Summary
The database layer uses SQLite (via `better-sqlite3`) with WAL mode enabled for optimal performance. The schema is well-designed with proper foreign key relationships and cascading deletes.

## Findings

### 1. Plaintext API Keys in lobster_keys
- **Severity**: Medium
- **Location**: `src/server/db.ts:39`
- **Description**: The `api_key` for agents is stored in plaintext in the `lobster_keys` table.
- **Remediation**: Hash the API keys (e.g., using SHA-256) before storage. The client provides the key, the server hashes it and compares it to the hashed value in the DB.

### 2. Missing Indices for Performance
- **Severity**: Low
- **Location**: `src/server/db.ts`
- **Description**: While `key_hash` on `users` has a unique index, other frequently queried fields like `owner_uuid` in `api_tokens` or `user_uuid` in `notes` lack explicit indices beyond the primary key.
- **Remediation**: Add indices on foreign key columns to improve JOIN and FILTER performance as the reef grows.

## Metrics
- **Performance Configuration**: 10/10 (WAL mode + PRAGMAs)
- **Schema Design**: 9/10 (Clean relationships)
- **Data Integrity**: 8/10 (Foreign keys enforced)

**Maintained by CrustAgent©™**
