# 🛡️ Security Policy — PinchPad

[![Security](https://img.shields.io/badge/Security-Key%20Based%20Auth-red?style=for-the-badge)](#)
[![Reporting](https://img.shields.io/badge/Reporting-Responsible%20Disclosure-orange?style=for-the-badge)](#)

---

## 🔑 Security Model Overview

PinchPad uses a **key-file identity system** — there are no passwords or accounts on a remote server.

```
┌──────────────────────────────────────────────────────────┐
│  Identity Key File: pinchpad_identity_key.json           │
│                                                          │
│  {                                                       │
│    "username": "your-username",                          │
│    "uuid":     "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",   │
│    "token":    "hu-[64 random chars]"                    │
│  }                                                       │
│                                                          │
│  ⚠️  This file IS your password. Losing it = lockout.   │
│  ⚠️  Never share it. Never commit it to version control. │
└──────────────────────────────────────────────────────────┘
```

### Key Types

| Prefix | Type | Scope | Storage | Notes |
|---|---|---|---|---|
| `hu-` | Human Identity Key | One-time login lookup | Server DB (`key_hash` UNIQUE index, SHA-256) | Client-side only, never transmitted raw |
| `lb-` | Agent Key | Automated agent access | Server DB (`lobster_keys` table, SHA-256 hashed) | Revocable, granular permissions |
| `api-` | REST Token | API session access | Server DB (`api_tokens` table) | 24-hour TTL, bearer header |

---

## 🔒 Security Practices

<details>
<summary>Client-Side (Session Memory)</summary>

- `hu-` tokens are **never stored in plaintext** and are never sent to the server.
- The `hu-` string is immediately hashed on the client using SHA-256 and exchanged via `POST /api/auth/token` for a short-lived `api-` bearer token.
- `sessionStorage` is used for session state (`pp_authenticated`, `pp_user`) — clears automatically on tab close to prevent token theft.
- Browser-compatible UUID generation uses `crypto.getRandomValues()` with RFC 4122-compliant formatting.

</details>

<details>
<summary>Server-Side (Express & SQLite)</summary>

- **`requireAuth`**: Extracts and validates the `api-` token from the Bearer header. Immediately injects `req.userId` and `req.permissions` for downstream handlers based on whether the token belongs to a human or an `lb-` agent key. Expired tokens are auto-deleted.
- **`requirePermission(perm)`**: Enforces granular locks (e.g., `canRead`, `canWrite`, `canEdit`, `canDelete`) on all CRUD routes based on the permissions assigned to the underlying `lb-` key.
- **`requireHuman`**: Restricts sensitive configuration routes (`/api/agents`) to human tokens only. Lobster keys cannot mutate system configuration.
- **SuperAdmin Panel (`/admin`)**: A metadata-only control plane gated by a robust `ADMIN_TOKEN` environment variable. If the token is not provided, the routes are disabled (404). This isolates admin functionality from the standard `hu-` / `api-` token authentication flow.
- **HTTPS Membrane (`httpsRedirect`)**: Express-level middleware intercepts all HTTP requests and strictly redirects them to HTTPS secure channels when `ENFORCE_HTTPS=true` is enabled, guaranteeing secure cookies and protecting session tokens in transit.
- **Rate Limiting**: Multiple rate limiter membranes (`express-rate-limit`) protect sensitive endpoints from denial of service and brute force. Highly configurable settings handle standard API limits (`API_RATE_LIMIT`), login window locks (`AUTH_RATE_LIMIT`), and admin panel limits (`ADMIN_AUTH_LIMIT`).
- **Timing-Safe Key Handshake**: Plaintext-to-hash verification processes implement timing-safe comparison logic inside authentication pathways, protecting agent and human login keys from timing attacks.
- **Audit Logging**: Comprehensive security tracking of auth events, agent usage, and server lifecycle (starts/stops) are written to a segregated, encrypted `audit.sqlite` database for administrative review.
- **Key Uniqueness**: `key_hash` is strictly enforced as `UNIQUE` to support collision-free one-field lookups.
- **SHA-256 Hashing**: Lobster keys are hashed using SHA-256 (not bcrypt, not MD5) for server-side verification. Hash comparison is query-based (constant-time).
- **SQLite Data Integrity**: WAL journal mode enabled for durability. Foreign key constraints enforced with cascade deletes.
- **RNG Security**: Unbiased random generation via rejection sampling (`crypto.randomInt()`) for token generation.

</details>

<details>
<summary>Encryption (ShellCryption©™ & SQLCipher)</summary>

- **Application-Level Encryption (ShellCryption©™)**: Uses AES-256-GCM (Galois/Counter Mode) client-side. Keys are derived from the `hu-` identity key and user passphrase. Encrypted ciphertexts and authentication tags are stored in SQLite, meaning the server has zero capability to decrypt notes.
- **Database-Level Encryption (SQLCipher)**: PinchPad supports hardware-level database page encryption using **SQLCipher (AES-256-CBC)**. When a base64 `DB_ENCRYPTION_KEY` is provided, the main database (`db.sqlite`) and the audit log database (`audit.sqlite`) are fully encrypted at rest.
- **Database Migration**: Unencrypted database stores are automatically migrated and encrypted on-the-fly when key configuration is enabled, ensuring zero data loss during hardening.
- **File Permissions (Hard Carapace)**: Databases are created with restrictive file permissions (`0o600` owner-only read/write) to prevent host-level leakage.

</details>

<details>
<summary>Docker Security</summary>

- The application runs on **Node 22** — minimal attack surface.
- SQLite data is in a Docker bind mount (`./data/db.sqlite`) — fully visible and controllable by the host operator.
- API only exposes port `8282` (prod) or `8383` (dev). The frontend never directly exposes the database.
- `NODE_ENV=production` disables development stack traces in API error responses.
- No hardcoded API keys or secrets in the codebase — all sensitive values come from environment variables.

</details>

---

## ⚠️ Known Limitations

> These are accepted trade-offs for the current development phase.

- **Single-user only** — no multi-user support per instance currently. Designed for individual sovereignty.
- **No refresh token rotation** — `api-` tokens persist until manually revoked via `/api/auth/logout`.
- **Single-instance only** — no built-in multi-node clustering. Designed for self-hosted single-server deployments.

---

## 🚨 Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report privately:

1. **Email**: Reach out to the maintainer directly (see GitHub profile for contact info).
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if known)
3. **Response time**: We aim to acknowledge within 72 hours.
4. **Patch timeline**: Security fixes are prioritized. Target: patch and release within 30 days.
5. **Credit**: Reporters are acknowledged in release notes (anonymity respected on request).

---

## 🛡️ Self-Hosted Hardening Checklist

Before exposing PinchPad to the public internet:

- [ ] Place the API behind **Nginx or Caddy with TLS (HTTPS)**
- [ ] Set `CORS_ORIGIN` to your specific frontend domain, **not** `*`
- [ ] Restrict port `8282`/`8383` to localhost, proxy via Nginx/Caddy
- [ ] Enable HTTP/2 and modern TLS versions (1.2+) at the proxy layer
- [ ] Regularly rotate `api-` tokens via `POST /api/auth/logout` and re-auth
- [ ] Revoke unused agent keys in the Dashboard
- [ ] Back up the `./data/clawstack.db` file regularly (encrypt backups in transit)
- [ ] Store `pinchpad_identity_key.json` in a **secure, offline location** (USB key, vault, etc.)
- [ ] Monitor the application logs for suspicious auth patterns (failed token validations)
- [ ] Run periodic security audits using tools like OWASP ZAP or Burp Suite Community

---

## 🔐 Compliance & Standards

PinchPad adheres to **OWASP Top 10** security guidelines:

- **Broken Authentication** — Mitigated by key-based auth, no password storage
- **Sensitive Data Exposure** — Mitigated by AES-256-GCM encryption at rest, TLS in transit
- **Injection** — Prevented by parameterized queries (better-sqlite3) and TypeScript type-safety
- **Broken Access Control** — Enforced by immutable middleware stack and granular permissions
- **Security Misconfiguration** — Hardened by strict TypeScript, environment-based secrets, helmet middleware
- **Cross-Site Scripting (XSS)** — Prevented by React's automatic escaping and Content Security Policy headers

---

*Maintained by CrustAgent©™*
