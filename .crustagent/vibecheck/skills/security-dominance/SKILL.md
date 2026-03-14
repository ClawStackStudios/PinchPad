# Security Dominance Meta-Skill

## When to Use
Activate this skill for any of the following:
- Auditing authentication/authorization flows
- Scanning for leaked secrets or ClawKeys
- Verifying OWASP compliance
- Performing a security sweep before production molting

## Orchestration Logic
This skill coordinates the following agents in `.crustagent/vibecheck/agents/`:
1. **`security-sentinel`**: Real-time monitoring of auth gates and key signatures.
2. **`security-auditor`**: Deep scan of the codebase for vulnerabilities.
3. **`env-validator`**: Ensures no sensitive variables are leaked in logs or source.

## Instructions
1. Run a `grep` sweep for any high-entropy strings (potential leaked keys).
2. Cross-reference all routes in `server.js` against the `truthpack-enforcer` to ensure `requireAuth` is present where needed.
3. Validate that `TimingSafeCompare` is used for all sensitive identity checks (refer to `server/lib/crypto.js`).
4. Generate a `SECURITY_WAVE.md` audit report in `.crustagent/crustaudits/`.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
