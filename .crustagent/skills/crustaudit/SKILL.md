---
name: crustaudit©™
description: A comprehensive skill for auditing Lobsterized©™ codebases against sovereignty, security, and architectural standards.
---

# CrustAgent Audit Skill

## 🔍 Audit Context
You are auditing a "Lobsterized©™" application. Your job is to enforce the Five Pillars: Cryptographic Identity, SQLite, Docker, Granular Permissions, and Branding. You must detect cloud dependencies as if they were malware.

## 📋 Validation Checklist

### 1. Sovereignty Scan
- [ ] **Search Imports:** Scan `package.json` and source files for forbidden packages: `firebase`, `@supabase`, `aws-sdk`, `@auth0`, `clerk`.
- [ ] **Network Calls:** Verify no code calls external APIs (except strictly defined integrations like RSS).
- [ ] **Data Locality:** Confirm all persistence layers interact ONLY with local SQLite or filesystem.

### 2. Authentication & Security (ClawKeys©™)
- [ ] **Key Handling:** Verify `hu-` keys are hashed (SHA-256) before transmission. No plaintext.
- [ ] **Token Storage:** Ensure `api-` tokens use `sessionStorage`, NOT `localStorage`.
- [ ] **Comparison:** Look for `crypto.timingSafeEqual` or equivalent constant-time logic in auth checks.
- [ ] **CORS:** Check `docker-compose.yml` and server config. `CORS_ORIGIN` must NOT be `*`.

### 3. Database Integrity
- [ ] **Isolation:** Grep for SQL queries. Every `SELECT`, `UPDATE`, `DELETE` on user tables MUST include `WHERE user_uuid = ?`.
- [ ] **Injection Prevention:** Reject any SQL utilizing string interpolation (e.g., `` `SELECT * FROM ${table}` ``). Require parameterized queries (`?`).

### 4. Architecture & Code Quality
- [ ] **Structure:** Verify `src/` uses feature-based folders (e.g., `src/bookmarks/`) not type-based (`src/components/`).
- [ ] **API Centralization:** Ensure components import from a centralized `RestAdapter` or service layer, never calling `fetch()` directly.
- [ ] **Hardcoding:** Flag any usage of `localhost`, `127.0.0.1`, or fixed ports in frontend code.

### 5. Docker & Deployment
- [ ] **Healthchecks:** Verify `healthcheck` exists in `docker-compose.yml` with `start_period: 15s` or greater.
- [ ] **Volumes:** Ensure `/app/data` is mounted for persistence.

## 📢 Reporting Format

When providing output, use the following structure:

1.  **Status Header:** `✅ PASSED` or `❌ FAILED`
2.  **Critical Issues (Blockers):** List any Hard Rule violations with file paths and fix instructions.
3.  **Warnings (Soft Rules):** List suggestions for improvement.
4.  **Metrics:** Brief summary of checks performed.
5.  **Lobster Wisdom:** A closing metaphor regarding the strength of the code's "shell."

## 🚀 Auto-Fix Capability
If requested with `--fix`:
- You may suggest code changes for formatting, linting, or simple config updates.
- You CANNOT auto-fix logic errors or security vulnerabilities that require architectural decisions.