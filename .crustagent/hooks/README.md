# 🦞 Truthpack Validator Hook

Real-time validation against semantic ground truth in Claude Code.

## What It Does

The `truthpack-validator.js` hook runs when you edit backend code and checks for violations:

- ❌ **Unknown environment variables** — flagged if not in `.crustagent/vibecheck/truthpack/env.json`
- ❌ **Unknown routes** — flagged if not in `.crustagent/vibecheck/truthpack/routes.json`

## How It Works

1. **Automatic** (Claude Code) — Hook fires on `Edit` or `Write` events in:
   - `server.js`
   - `src/server/**/*.ts` / `src/server/**/*.js`
   - `.env*` files

2. **Manual** (CLI) — Test the validator directly:
   ```bash
   node .crustagent/hooks/truthpack-validator.js <filePath> <fileContent>
   ```

## Output

**No violations:**
```
✅ No violations detected against truthpack
```

**With violations:**
```
⚠️  Truthpack Violations (2):
────────────────────────────────────────────────────────────
1. ⚠️  UNKNOWN_ENV_VAR
   Line 3: Unknown env var 'MY_VAR' — not in truthpack
   Code: const val = process.env.MY_VAR;

2. ⚠️  UNKNOWN_ROUTE
   Line 42: Route GET /api/new-endpoint not in truthpack
   Code: app.get('/api/new-endpoint', handler);
```

## Installation

The hook is configured in `.claude/hooks/hooks.json` and loads automatically when Claude Code scans for hooks.

To verify it's active, check that `.claude/hooks/hooks.json` exists:
```bash
ls -la .claude/hooks/hooks.json
```

## Files

```
.crustagent/hooks/
├── README.md                      ← You are here
├── truthpack-validator.js         ← Main validator script
└── (hooks.json was moved to .claude/hooks/hooks.json)

.claude/hooks/
└── hooks.json                     ← Claude Code hook configuration
```

## Customization

### Add new validation rules

Edit `validateFileContent()` in `truthpack-validator.js`:

```javascript
// Example: Check for hardcoded secrets
const secretPattern = /(?:api_key|secret|password)\s*=\s*['"][^'"]+['"]/gi;
while ((match = secretPattern.exec(content)) !== null) {
  violations.push({
    type: 'HARDCODED_SECRET',
    severity: 'ERROR',  // Use 'ERROR' to block edits
    line: content.substring(0, match.index).split('\n').length,
    message: 'Hardcoded secret detected',
    code: match[0].trim(),
  });
}
```

### Adjust file patterns

In `.claude/hooks/hooks.json`, the `filePatterns` array controls which files trigger the hook:

```json
"filePatterns": [
  "server.js",
  "src/server/**",
  ".env*",
  "src/**/*.ts"  // Add more patterns here
]
```

## Truthpack Files

The validator reads these files (read-only):
- `.crustagent/vibecheck/truthpack/routes.json` — API routes
- `.crustagent/vibecheck/truthpack/env.json` — Environment variables
- `.crustagent/vibecheck/truthpack/auth.json` — Auth model
- `.crustagent/vibecheck/truthpack/stability-locks.json` — Architecture locks

To update truthpack, modify those files directly.

---

**Maintained by CrustAgent©™**
