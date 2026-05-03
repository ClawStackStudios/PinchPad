                                                                   
    🦞 PINCHPAD — DEEP TOPOLOGY SCAN                                                                                                
        Sovereign Pearl / ClawStack Studios©™                                                                                        
                                                                                                                                     
     ============================================================                                                                    
     SKELETON: HIGH-CENTRALITY COMPONENTS                                                                                            
     ============================================================                                                                    
                                                                                                                                     
     Load-bearing walls (most dependencies converge here):                                                                           
                                                                                                                                     
       server.ts                            Primary entry — wires Express, mounts all routes                                         
       src/server/database/index.ts         DB singleton — schema + migrations on import                                             
       src/server/middleware/auth.ts        THE gate — requireAuth, requirePermission, requireHuman                                  
       src/shared/lib/apiFetch.ts          All frontend API calls pass through here (the bridge)                                     
       src/shared/lib/api.ts (restAdapter)  Typed REST wrapper consumed by all services                                              
       src/features/auth/AuthContext.tsx    Root session state — gate to all protected routes                                        
                                                                                                                                     
     Centrality ranking (by dependency count):                                                                                       
                                                                                                                                     
       1. auth.ts (middleware)        — imported by ALL 6 route files + rateLimiter                                                  
       2. database/index.ts           — imported by all routes + middleware + server.ts                                              
       3. apiFetch.ts                 — imported by restAdapter + authService                                                        
       4. restAdapter                 — imported by noteService, agentService, potsService                                           
       5. AuthContext.tsx             — consumed by App.tsx, ProtectedRoute, DashboardLayout                                         
       6. validate.ts (middleware)    — used by auth, notes, pots, agents routes                                                     
       7. validation/schemas.ts       — Zod schemas consumed by validate middleware                                                  
                                                                                                                                     
     ============================================================                                                                    
     NERVOUS SYSTEM: DATA FLOWS                                                                                                      
     ============================================================                                                                    
                                                                                                                                     
     AUTH FLOW (human):                                                                                                              
       Browser → Login.tsx → authService.loginWithKey()                                                                              
         → SHA-256 hash hu-key on client                                                                                             
         → POST /api/auth/token {keyHash, type:'human'}                                                                              
         → server/auth.ts: timingSafeEqual comparison                                                                                
         → INSERT api_tokens (api-xxxxxxxx × 32)                                                                                     
         → Return {token, user} → localStorage (cc_api_token)                                                                        
         → AuthContext reads localStorage on mount                                                                                   
                                                                                                                                     
     AUTH FLOW (agent/lb-):                                                                                                          
       Agent → POST /api/auth/token {type:'agent', ownerKey: 'lb-...'}                                                               
         → server/auth.ts: DB lookup + timingSafeEqual with SHA-256 pre-hash                                                         
         → Validates is_active, expiration_date                                                                                      
         → INSERT api_tokens → Return {token, type:'agent'}                                                                          
                                                                                                                                     
     REQUEST FLOW (every authenticated call):                                                                                        
       Client → restAdapter.GET/POST/PUT/DELETE                                                                                      
         → apiFetch (reads cc_api_token from localStorage)                                                                           
         → Bearer header                                                                                                             
         → requireAuth middleware:                                                                                                   
             - api- key → api_tokens lookup → resolve owner (human or agent)                                                         
             - lb- key → agent_keys lookup directly                                                                                  
             - Build AuthRequest with userUuid, permissions, keyType                                                                 
         → requirePermission('canRead'|'canWrite'|'canEdit'|'canDelete')                                                             
         → agentKeyLimiter (per-key rate limit)                                                                                      
         → Route handler:                                                                                                            
             - EVERY query filters by user_uuid (mandatory)                                                                          
             - Audit log emitted                                                                                                     
         → Response                                                                                                                  
                                                                                                                                     
     NOTE CRUD:                                                                                                                      
       GET    /api/notes      → requireAuth → requirePermission('canRead')  → SELECT WHERE user_uuid                                 
       POST   /api/notes      → requireAuth → requirePermission('canWrite') → INSERT + audit                                         
       PUT    /api/notes/:id   → requireAuth → requirePermission('canEdit')  → UPDATE WHERE id AND user_uuid                         
       DELETE /api/notes/:id   → requireAuth → requirePermission('canDelete') → DELETE WHERE id AND user_uuid                        
       PATCH  /api/notes/:id/starred → requireAuth → requirePermission('canEdit')                                                    
       PATCH  /api/notes/:id/pinned  → requireAuth → requirePermission('canEdit')                                                    
       POST   /api/notes/bulk  → requireAuth → requirePermission('canWrite') → EXEMPT from apiLimiter                                
       GET    /api/notes/export → requireAuth → requirePermission('canRead') → JSZip generation                                      
                                                                                                                                     
     POT CRUD:                                                                                                                       
       GET    /api/pots        → requireAuth → requirePermission('canRead')  → LEFT JOIN notes for pearl_count                       
       POST   /api/pots        → requireAuth → requirePermission('canWrite')                                                         
       PATCH  /api/pots/:id    → requireAuth → requirePermission('canEdit')  → dynamic field building                                
       DELETE /api/pots/:id    → requireAuth → requirePermission('canDelete') → unpots pearls first, then deletes pot                
                                                                                                                                     
     AGENT KEY MANAGEMENT:                                                                                                           
       GET    /api/agents        → requireAuth → requireHuman → SELECT WHERE user_uuid                                               
       POST   /api/agents        → requireAuth → requireHuman → validateBody → INSERT                                                
       PUT    /api/agents/:id/revoke → requireAuth → requireHuman → SET is_active=0                                                  
       DELETE /api/agents/:id    → requireAuth → requireHuman → DELETE WHERE id AND user_uuid                                        
                                                                                                                                     
     PHOTOS:                                                                                                                         
       POST   /api/photos/upload → requireAuth → requirePermission('canWrite') → multer(memory) → INSERT BLOB                        
       GET    /api/photos/:id    → requireAuth → requirePermission('canRead')  → serve binary + immutable cache                      
       DELETE /api/photos/:id    → requireAuth → requirePermission('canDelete') → DELETE BLOB                                        
                                                                                                                                     
     LOBSTER SESSION (ephemeral import):                                                                                             
       POST /api/lobster-session/start   → requireAuth → requireHuman → creates lb-eph- key (15min TTL)                              
       POST /api/lobster-session/:id/close → requireAuth → requireHuman → revokes key, closes session                                
                                                                                                                                     
     MIDDLEWARE STACK (order matters):                                                                                               
       helmet → cors → express.json → /api → apiLimiter → requestLogger                                                              
       Then per-route: requireAuth → requirePermission → requireHuman (optional) → agentKeyLimiter                                   
                                                                                                                                     
     ============================================================                                                                    
     THE INVARIANTS: WHAT MUST ALWAYS BE TRUE                                                                                        
     ============================================================                                                                    
                                                                                                                                     
       1. USER ISOLATION: Every query filters by user_uuid. No exceptions.                                                           
          Verified in: notes.ts (all 7 endpoints), pots.ts (all 4), agents.ts (all 4),                                               
          photos.ts (all 3), lobsterSession.ts (both)                                                                                
                                                                                                                                     
       2. KEY HIERARCHY:                                                                                                             
          hu- keys: hashed SHA-256 on client before ANY transmission                                                                 
          lb- keys: stored plaintext in agent_keys.api_key (needed for agent login lookup)                                           
                    timing-safe comparison uses SHA-256 pre-hashing                                                                  
          api- tokens: ephemeral session tokens, stored in api_tokens table                                                          
                                                                                                                                     
       3. TIMING-SAFE COMPARISON: Both human and agent login use crypto.timingSafeEqual                                              
          Human: direct Buffer comparison of key_hash                                                                                
          Agent: SHA-256 pre-hash + timingSafeEqual (length-agnostic)                                                                
                                                                                                                                     
       4. AUTH TIERING (immutable order): requireAuth → requirePermission → requireHuman                                             
          requireHuman is ONLY on /api/agents/ and /api/lobster-session/                                                             
          This means lb- keys CANNOT manage other lb- keys                                                                           
                                                                                                                                     
       5. SESSION STORAGE: api- tokens in localStorage (cc_ namespace)                                                               
          ARCHITECTURE.md says sessionStorage — actual code uses localStorage                                                        
          This is a DOCUMENTATION GAP (low risk given the threat model)                                                              
                                                                                                                                     
       6. RATE LIMITING:                                                                                                             
          authLimiter: 10 req / 15min window (skip successful)                                                                       
          apiLimiter:  100 req / 1min (skips /notes/bulk POST)                                                                       
          agentKeyLimiter: per-lb-key, 60s window, dynamic max from DB                                                               
                                                                                                                                     
       7. AUDIT TRAIL: All mutations logged via auditLogger                                                                          
          Event types: AUTH_REGISTER, AUTH_SUCCESS, AUTH_FAILURE, AUTH_LOGOUT,                                                       
          NOTE_CREATE/UPDATE/DELETE, NOTES_BULK_IMPORT, POT_CREATE/UPDATE/DELETE,                                                    
          PHOTO_UPLOAD/DELETE, AGENT_KEY_CREATE/REVOKE/DELETE,                                                                       
          LOBSTER_SESSION_STARTED/CLOSED                                                                                             
                                                                                                                                     
       8. DATABASE: SQLCipher via better-sqlite3-multiple-ciphers                                                                    
          WAL mode, foreign_keys ON, busy_timeout 5000ms                                                                             
          Auto-encrypts plaintext DB on first encounter with DB_ENCRYPTION_KEY                                                       
          Restrictive file permissions: 0o600 on DB/WAL/SHM                                                                          
                                                                                                                                     
       9. TOKEN CLEANUP: Scheduled at 3AM daily + on startup                                                                         
          Also: expired api_tokens deleted inline on validation failure                                                              
                                                                                                                                     
       10. CASCADE BEHAVIOR:                                                                                                         
           DELETE user → cascade api_tokens (where owner_type='human')                                                               
           DELETE agent_key → cascade api_tokens (where owner_type='agent')                                                          
           DELETE note → cascade pearl_photos                                                                                        
           DELETE pot → SET NULL on notes.pot_id (does NOT delete notes)                                                             
                                                                                                                                     
     ============================================================                                                                    
     THE SEAMS: FRONT/BACK BOUNDARIES                                                                                                
     ============================================================                                                                    
                                                                                                                                     
     SEAM 1: apiFetch.ts                                                                                                             
       - Adds Bearer token from localStorage                                                                                         
       - Dispatches 'auth:expired' custom event on 401                                                                               
       - AuthContext listens for 'auth:expired' → clears session                                                                     
       - This is the single chokepoint for auth on the frontend                                                                      
                                                                                                                                     
     SEAM 2: restAdapter (api.ts)                                                                                                    
       - All service calls go through this                                                                                           
       - Wraps apiFetch with typed methods                                                                                           
       - Error parsing: extracts error text from JSON body on failure                                                                
                                                                                                                                     
     SEAM 3: authService.ts                                                                                                          
       - Uses apiFetch DIRECTLY (not restAdapter) — intentional                                                                      
       - register() and login() flows happen before token exists                                                                     
       - Manages localStorage session keys                                                                                           
                                                                                                                                     
     SEAM 4: validateBody middleware                                                                                                 
       - Zod schemas in validation/schemas.ts                                                                                        
       - Applied on: register, token, notes.create/update, pots.create/update,                                                       
         agentKeys.create, status toggles                                                                                            
       - Returns 400 with "Validation Error: Your request form is malformed"                                                         
                                                                                                                                     
     SEAM 5: Agent key creation                                                                                                      
       - Client generates lb- key (crypto.randomBytes) + hashes it                                                                   
       - Server stores the plaintext api_key (needed for agent login flow)                                                           
       - Client displays the key ONCE then discards                                                                                  
       - The api_key_hash is sent but not used server-side (potential cleanup)                                                       
                                                                                                                                     
     ============================================================                                                                    
     DATABASE SCHEMA (ACTUAL, FROM CODE)                                                                                             
     ============================================================                                                                    
                                                                                                                                     
       users:         uuid(PK), username(UNIQUE), key_hash(UNIQUE), created_at                                                       
       api_tokens:    key(PK), owner_key, owner_type, created_at, expires_at                                                         
       pots:          id(PK), user_uuid(FK→users), name, color, created_at                                                           
       notes:         id(PK), user_uuid(FK→users), title, content, starred, pinned,                                                  
                      pot_id(FK→pots ON DELETE SET NULL), created_at, updated_at                                                     
       pearl_photos:  id(PK), pearl_id(FK→notes CASCADE), user_uuid(FK→users CASCADE),                                               
                      filename, mime_type, data(BLOB), created_at                                                                    
       agent_keys:    id(PK), user_uuid(FK→users CASCADE), name, description,                                                        
                      api_key(UNIQUE), permissions(JSON), expiration_type, expiration_date,                                          
                      rate_limit, is_active, created_at, last_used,                                                                  
                      revoked_at, revoked_by, revoke_reason                                                                          
       settings:      key(PK), user_uuid, value                                                                                      
       audit_logs:    id(PK AUTOINCREMENT), timestamp, event_type, actor, actor_type,                                                
                      resource, action, outcome, ip_address, user_agent, details                                                     
       import_sessions: id(PK), user_uuid, key_id, started_at, closed_at,                                                            
                        error_count, errors_json                                                                                     
                                                                                                                                     
     Triggers:                                                                                                                       
       cascade_user_api_tokens  — DELETE users → DELETE api_tokens (human)                                                           
       cascade_agent_api_tokens — DELETE agent_keys → DELETE api_tokens (agent)                                                      
                                                                                                                                     
     ============================================================                                                                    
     TEST ORACLE STATUS                                                                                                              
     ============================================================                                                                    
                                                                                                                                     
     Test files: 12 (9 passed, 3 failed)                                                                                             
     Tests: 168 total (130 passed, 8 failed, 30 skipped)                                                                             
                                                                                                                                     
     PASSING (9 files, 130 tests):                                                                                                   
       auth.lobster.test.ts          (11 tests) — register, token, logout                                                            
       agents.lobster.test.ts        (28 tests, 2 skipped) — CRUD + revocation                                                       
       notes.lobster.test.ts         (29 tests, 1 skipped) — full CRUD + starred + pinned                                            
       auth.lobster.test.ts (middleware) (10 tests) — requireAuth edge cases                                                         
       rateLimiter.lobster.test.ts   (7 tests) — rate limit enforcement (with caveat)                                                
       auth.security.lobster.test.ts (17 tests, 4 skipped) — security edge cases                                                     
       auditLog.lobster.test.ts      (12 tests, 4 skipped) — audit event coverage                                                    
       crypto.lobster.test.ts        (6 tests) — crypto utilities                                                                    
       authService.lobster.test.ts   (6 tests) — frontend service tests                                                              
                                                                                                                                     
     FAILING (3 files, 8 tests):                                                                                                     
       cross-user-isolation.lobster.test.ts — SUITE FAILURE: crypto.createHash is not a function                                     
         Root cause: imports 'crypto' from node module but test env resolves wrong crypto                                            
         Impact: 0 of ~25 tests in this file execute — critical isolation tests dead                                                 
                                                                                                                                     
       token-lifecycle.lobster.test.ts — SUITE FAILURE: SQL syntax error in inline schema                                            
         Root cause: hardcoded schema string with syntax error, doesn't use createTestApp()                                          
         Impact: 16 tests all skipped — token expiry/rotation/re-login untested                                                      
                                                                                                                                     
       auth.errors.lobster.test.ts — 8 TEST FAILURES:                                                                                
         - 3x: expects 'Validation failed' but server returns 'Validation Error: ...'                                                
           (test asserts on old error message format)                                                                                
         - 1x: expects 401 from timing-safe test but gets 429 (rate limited)                                                         
         - 3x: expects 401/400 but gets 429 (authLimiter fires before handler logic)                                                 
         - 1x: expects 'Missing' in error but server says 'Unauthorized: no Bearer token'                                            
                                                                                                                                     
       The 429 failures are a rate-limiter test configuration issue —                                                                
       AUTH_RATE_LIMIT env var not being set high enough for the test env                                                            
                                                                                                                                     
     SKIPPED (30 tests):                                                                                                             
       - 16: token-lifecycle suite (all skipped due to suite failure)                                                                
       - 2: agents test (likely conditional features)                                                                                
       - 1: notes test                                                                                                               
       - 4: auditLog test                                                                                                            
       - 4: auth.security test                                                                                                       
       - 3: auth.errors test                                                                                                         
                                                                                                                                     
     COVERAGE GAPS (what is NOT tested):                                                                                             
       - Cross-user data isolation (suite broken)                                                                                    
       - Token lifecycle: expiry, rotation, re-login invalidation (suite broken)                                                     
       - Photos upload/download (no test file exists for photos routes)                                                              
       - Pots routes (no test file exists — despite pots route existing)                                                             
       - Lobster session start/close (no test file exists)                                                                           
       - Frontend component tests (zero React component tests)                                                                       
       - Agent key rate limiting at the network level (ERR_ERL_CREATED_IN_REQUEST_HANDLER                                            
         error in tests but this is test-only — the prod code creates the limiter once)                                              
                                                                                                                                     
     ============================================================                                                                    
     KNOWN FRACTURES (FROM TEST OUTPUT)                                                                                              
     ============================================================                                                                    
                                                                                                                                     
       1. RATE LIMITER INITIALIZATION ERROR (test-only, but revealing):                                                              
          ERR_ERL_CREATED_IN_REQUEST_HANDLER fires in tests because                                                                  
          agentKeyLimiter's max and keyGenerator use dynamic functions.                                                              
          express-rate-limit v8+ detects this as "created per request" and rejects it.                                               
          This is a TEST CONFIGURATION issue (limiter works in prod since it's                                                       
          created once at module load), but reveals fragility in the rate limiter design.                                            
                                                                                                                                     
       2. CROSS-USER ISOLATION TESTS DEAD:                                                                                           
          crypto.createHash import failure blocks entire suite.                                                                      
          These are arguably the MOST IMPORTANT tests — they verify                                                                  
          that User A cannot read/write/delete User B's data.                                                                        
                                                                                                                                     
       3. TOKEN LIFECYCLE UNTESTED:                                                                                                  
          Expiry detection, token rotation on re-login, old token invalidation —                                                     
          all of these are untested due to suite failure.                                                                            
                                                                                                                                     
       4. ERROR MESSAGE DRIFT:                                                                                                       
          tests/errors/auth.errors.lobster.test.ts asserts old error strings.                                                        
          Server now returns "Validation Error: Your request form is malformed"                                                      
          but tests expect "Validation failed".                                                                                      
                                                                                                                                     
       5. DOCUMENTATION vs CODE: ARCHITECTURE.md says sessionStorage,                                                                
          actual code uses localStorage (cc_ namespace). Low risk but matters                                                        
          for accurate threat modeling.                                                                                              
                                                                                                                                     
       6. api_key_hash SENT BUT UNUSED: agentService.create() computes and sends                                                     
          api_key_hash to POST /api/agents, but the server route ignores it.                                                         
          The server stores the plaintext api_key directly. The hash field                                                           
          in the payload is dead weight.                                                                                             
                                                                                                                                     
       7. NO PHOTOS/POTS/LobsterSession ROUTE TESTS:                                                                                 
          These routes have ZERO test coverage at the HTTP level.                                                                    
                                                                                                                                     
     ============================================================                                                                    
     TECHNOLOGY MAP                                                                                                                  
     ============================================================                                                                    
                                                                                                                                     
       Runtime:       Node.js (via tsx runner, no compile step)                                                                      
       Language:      TypeScript 5.8 (strict mode via tsconfig)                                                                      
       Frontend:      React 19, Vite 6, TailwindCSS 4, Framer Motion                                                                 
       Backend:       Express 4, better-sqlite3-multiple-ciphers (SQLCipher)                                                         
       AI:            Google Gemini (@google/genai) — appears in deps, no usage found in routes                                      
       Auth:          Custom key-based (hu-/lb-/api- prefix system), no passwords                                                    
       Crypto:        SHA-256 (client + server), AES-256-GCM (client-side note encryption),                                          
                      crypto.timingSafeEqual (server)                                                                                
       Validation:    Zod 4.3.6                                                                                                      
       Testing:       Vitest 4.1.0 + Supertest + in-memory SQLite                                                                    
       Container:     Docker multi-stage (Node 20 Alpine) → single image, port 8282                                                  
       DB Encryption: SQLCipher via better-sqlite3-multiple-ciphers,                                                                 
                      ATTACH DATABASE + sqlcipher_export migration pattern                                                           
       CSS:           TailwindCSS 4, Inter font, dark-mode-first ("Sovereign Pearl" theme)                                           
       Markdown:      react-markdown + remark-gfm + remark-math + rehype-katex                                                       
       Sanitization:  DOMPurify (in deps)                                                                                            
       Build:         Vite → dist/ (served by Express in production)                                                                 
                                                                                                                                     
     ============================================================                                                                    
     FRONTEND FEATURE MAP                                                                                                            
     ============================================================                                                                    
                                                                                                                                     
       Routes (React Router):                                                                                                        
         /            → Landing (public)                                                                                             
         /register    → Register (public)                                                                                            
         /login       → Login (public)                                                                                               
         /dashboard   → Dashboard (protected) — note grid + sidebar                                                                  
         /notes       → Notes (protected) — note editor/viewer                                                                       
         /settings    → Settings (protected) — profile, theme, LobsterKeys, import                                                   
                                                                                                                                     
       Context Providers (nested, order matters):                                                                                    
         ReefProvider → PotProvider → DashboardProvider → SettingsProvider                                                           
         (AuthProvider wraps all at App level)                                                                                       
                                                                                                                                     
       Key Components:                                                                                                               
         LoginForm.tsx        — identity file upload or key paste                                                                    
         SetupWizard.tsx      — first-run: username, UUID, key generation                                                            
         AddPearlModal.tsx    — create/edit note modal with markdown toolbar                                                         
         NoteGrid.tsx         — responsive note card grid                                                                            
         Sidebar.tsx          — navigation, pot filtering, pearl counts                                                              
         LobsterKeysTab.tsx   — lb-key CRUD interface                                                                                
         LobsterKeyWizard.tsx — create lb-key with permission selection                                                              
         LobsterImportModal.tsx — bulk import via ephemeral session                                                                  
         MoltTheme.tsx        — View Transition dark/light toggle                                                                    
                                                                                                                                     
     ============================================================                                                                    
     SUMMARY: STRENGTHS & GAPS                                                                                                       
     ============================================================                                                                    
                                                                                                                                     
       STRONG:                                                                                                                       
       - User isolation invariant is consistently enforced across all routes                                                         
       - Timing-safe comparison on all authentication paths                                                                          
       - Audit trail is comprehensive (every mutation logged)                                                                        
       - Database encryption with graceful plaintext→encrypted migration                                                             
       - Auth tiering (requireAuth→requirePermission→requireHuman) is clean                                                          
       - Clean separation of frontend (services/context/components) and backend (routes/middleware/db)                               
       - Single-image Docker build with proper multi-stage caching                                                                   
       - Token cleanup scheduled at 3AM + inline on expired detection                                                                
       - ON DELETE CASCADE + triggers handle referential integrity                                                                   
                                                                                                                                     
       GAPS:                                                                                                                         
       - Cross-user isolation tests are dead (suite import failure)                                                                  
       - Token lifecycle tests are dead (schema syntax error)                                                                        
       - No HTTP-level tests for photos, pots, or lobster-session routes                                                             
       - 8 test assertion failures from error message drift + rate limiter config                                                    
       - Zero React component tests                                                                                                  
       - api_key_hash sent from client but unused server-side                                                                        
       - Gemini AI dependency present but no AI feature found in routes                                                              
       - Documentation says sessionStorage, code uses localStorage                                                                   
                                                                                                                                     
     ============================================================                                                                    
                                                                                                                                     
     That is the reef as it stands. 130 tests confirm the core auth + note + agent flows work. The isolation and lifecycle tests     
     — which verify the hardest invariants — are the ones currently dead. The seams are well-guarded (timing-safe, user_uuid on      
     every query, permission-gated). The gaps are in test coverage for newer routes and in documentation alignment.                  
                                                                                                                                     
     No changes made. Pure reconnaissance.