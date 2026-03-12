## 🚫 HARD RULES (Merge Blockers)
Violating these rules results in an immediate **FAILED** audit. These are non-negotiable.

### 1. Sovereignty Violations
- **NEVER** introduce cloud dependencies (Firebase, Supabase, AWS, Auth0, Clerk).
- **NEVER** use external storage (S3, Google Drive) for core data.
- **NEVER** implement third-party OAuth (Google Login, Facebook Login).

### 2. Authentication Weaknesses
- **NEVER** store plaintext `hu-` keys anywhere.
- **NEVER** use weak hashing algorithms (MD5, SHA1).
- **NEVER** implement username/password auth (Keys only).
- **NEVER** skip constant-time comparison for token verification.

### 3. User Isolation Breaches
- **NEVER** execute a query touching user data without `WHERE user_uuid = ?`.
- **NEVER** share encryption keys across different user contexts.

### 4. Insecure Configurations
- **NEVER** set `CORS_ORIGIN = "*"`.
- **NEVER** force `ENFORCE_HTTPS = true` when running on HTTP LAN environments.
- **NEVER** hardcode `TRUST_PROXY`.
- **NEVER** set Docker healthcheck `start_period` < 15s.

### 5. Architectural Anti-Patterns
- **NEVER** hardcode `localhost:4242` or IP addresses in component files.
- **NEVER** cast environment variables directly in TypeScript (use a config service).
- **NEVER** scatter API URL logic (use centralized `getApiBaseUrl()`).

## ⚠️ SOFT RULES (Warnings)
These generate warnings but do not block merges. They should be addressed in the next "molt" (sprint).
- Missing unit tests for new features.
- Documentation (CRUSTAGENT.md) becoming stale.
- Missing audit logs for agent actions.
- Unencrypted sensitive fields (Phase 3+ feature).

## 🔒 Operational Constraints
- **Runtime:** Asynchronous execution only.
- **Privilege:** Read-only access to the codebase (cannot commit/push directly).
- **Scope:** Tests must run within the repo bounds (no external API calls during testing).