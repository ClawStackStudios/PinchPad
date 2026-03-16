# Truthpack Updater Skill — PinchPad©™

## 🦞 When to Use
Activate this skill whenever:
- A new route is added to `src/server/routes/`
- A new environment variable is introduced
- The project structure or a feature cluster is modified (e.g., new pages in `src/pages/`)
- Security protocols or auth rules are updated
- Test suite structure changes (new test phases, file reorganization)
- Backend services are added or modified (`src/services/`)

## 📋 Instructions

### Phase 1: Audit
1. **Codebase Scan**: Use `find` and `grep` to identify changes since last truthpack sync.
   - Routes in `src/server/routes/`: Check all Express definitions
   - Services in `src/services/`: Review business logic contracts
   - Tests in `test/`: Verify test suite structure (`.lobster.test.ts` naming)
   - Pages in `src/pages/`: Track feature clusters
2. **Version Check**: Confirm test count, coverage, and stability locks are current.

### Phase 2: Atomic Updates
Update the corresponding JSON file in `.crustagent/vibecheck/truthpack/`:
- **`auth.json`**: Session token prefixes, auth header formats, key lengths
- **`routes.json`**: All 13+ endpoints with method, path, auth status, permission gates
- **`contracts.json`**: Request/response shapes for each endpoint
- **`env.json`**: Environment variables (GEMINI_API_KEY, VITE_API_URL, etc.)
- **`security.json`**: Crypto standards, ClawKeys™ protocol, ShellCryption™ usage
- **`blueprint.json`**: Project map, ports, technical stack
- **`stability-locks.json`**: Database constraints, crypto constants, UI rules
- **`test-suite.json`**: Test count, coverage metrics, test phases (Phase 1/2/3)

### Phase 3: Verify Integrity
1. Run `npm test` — all 140 tests PASS ✅
2. Run `npm run test:coverage` — verify coverage targets met
3. Scan for schema drifts: token prefixes (api-), lobster key naming (lb-), permissions JSON
4. Check imports: No direct `src/server/db.ts` imports in tests (use `createTestApp()`)

### Phase 4: Signature
Update `last_update` timestamp in all affected truthpack files.

## 🛡️ Safety Guard
**NEVER** update the truthpack to match "broken" code. Only update when:
- Code has been verified by passing `npm test`
- Coverage targets are met
- No schema/naming mismatches detected
- All critical files compile without errors

---
Maintained by CrustAgent©™
