# Security Dominance Meta-Skill — PinchPad©™

## 🛡️ When to Use
Activate this skill for any of the following:
- Auditing authentication/authorization flows (requireAuth, requirePermission, requireHuman)
- Scanning for leaked secrets (API keys, tokens, hashes) or ClawKeys™
- Verifying OWASP Top 10 compliance (injection, XSS, broken auth, sensitive data, etc.)
- Performing a security sweep before production deployment
- Validating ClawKeys™ Protocol adherence (token prefixes, hash algorithms, expiration)

## 🔐 Orchestration Logic
This skill coordinates security verification across:
1. **Auth Middleware**: Verify `requireAuth`, `requirePermission`, `requireHuman` enforce gates correctly
2. **Token Handling**: Check Bearer token extraction, validation, expiration, auto-delete
3. **Database Security**: Verify FK constraints, cascade deletes, no raw string interpolation
4. **Crypto Integrity**: Confirm token prefixes (api-, lb-, hu-), hash algorithms (SHA-256), key lengths
5. **OWASP Compliance**: Scan for injection points, XSS vectors, insecure direct object references

## 📋 Instructions

### Phase 1: Authentication & Authorization Audit
1. **requireAuth Validation**:
   - Verify Bearer token extraction from `Authorization` header
   - Confirm expired tokens return 401 + auto-delete from DB
   - Check lobster key permission parsing (JSON parsing from `lobster_keys.permissions`)
2. **Permission Gates**:
   - `requirePermission('canRead'|'canWrite'|'canEdit'|'canDelete')` blocks lobster keys without perm
   - Humans bypass all permission checks
   - Missing `req.user` returns 401
3. **requireHuman Validation**:
   - Blocks all lobster keys (403)
   - Allows humans only

### Phase 2: Token & Key Inspection
1. **Session Tokens** (`api_tokens` table):
   - Prefix: `api-` (NOT `cc-` or `hu-` or `lb-`)
   - Length: 32 characters (base62)
   - Expiration: 24 hours, auto-delete on lookup after expiry
   - Storage: TEXT PRIMARY KEY, no plain text in DB (query via hash lookup)
2. **ClawKeys™** (`hu-` prefix):
   - Generated client-side in browser
   - Never transmitted raw over wire
   - Hashed before DB storage (SHA-256 hex)
3. **LobsterKeys™** (`lb-` prefix):
   - Created server-side via `POST /api/agents`
   - Stored with revocation flag (`is_active`)
   - Permissions column as JSON: `{ canRead, canWrite, canEdit, canDelete }`

### Phase 3: Database Security Scan
1. **Foreign Key Constraints**:
   - User deletion cascades to notes, api_tokens, lobster_keys
   - Verify `PRAGMA foreign_keys = ON` in `src/server/db.ts`
2. **Prepared Statements**:
   - All queries use `db.prepare()` — no string interpolation
   - Grep for `+` or `${...}` in SQL queries (red flag)
3. **Unique Constraints**:
   - `UNIQUE(username)` prevents duplicate registrations
   - `UNIQUE(key_hash)` prevents hash collisions

### Phase 4: Crypto Standards Check
1. **Hash Algorithm**: SHA-256 (verify in `src/lib/crypto.ts`)
   - Token hashing for storage
   - ClawKey™ hashing before DB storage
2. **AES-256-GCM**: ShellCryption™ for note encryption (verify in `src/lib/shellCryption.ts`)
   - Nonce generation (random per encryption)
   - Tag verification on decryption
3. **Random Generation**: Base62 charset (a-zA-Z0-9), rejection sampling for unbiased output

### Phase 5: OWASP Top 10 Verification
- ✅ **A01: Broken Access Control**: All routes gated by requireAuth + requirePermission
- ✅ **A02: Cryptographic Failures**: AES-256-GCM, SHA-256, no hardcoded keys
- ✅ **A03: Injection**: Prepared statements only, no string interpolation
- ✅ **A04: Insecure Design**: ClawKeys™ protocol, permission-based access
- ✅ **A06: SSRF**: No external API calls (Gemini is client-side triggered)
- ✅ **A07: Cross-Site XSS**: React auto-escapes, no innerHTML
- ✅ **A08: Deserialization**: No untrusted deserialization (JSON.parse only on known data)
- ✅ **A10: Logging**: No token/key logging; debug logs stripped in production

### Phase 6: Test Coverage Verification
1. Run `npm run test:coverage`
2. Verify auth middleware reaches 100% statement coverage
3. Confirm auth routes >75% coverage
4. Check all permission scenarios tested (human, lobster+perm, lobster-perm)

### Phase 7: Generate Security Report
Create `SECURITY_AUDIT_[DATE].md` in `.crustagent/crustaudits/`:
- Summary of findings (PASS/FAIL each checkpoint)
- Token prefix check results
- Auth gate verification results
- OWASP compliance checklist
- Recommendations for any gaps

## 🛡️ Safety Guard
**CRITICAL**: Never merge code that:
- Changes token prefix without updating all tests
- Removes FK constraints or disables foreign key checking
- Adds string interpolation to SQL queries
- Hardcodes secrets in source code
- Removes permission checks from protected routes
- Modifies hash algorithms without migration plan

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
Maintained by CrustAgent©™
