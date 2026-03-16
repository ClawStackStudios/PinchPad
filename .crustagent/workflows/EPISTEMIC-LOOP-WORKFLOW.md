---
name: Epistemic Loop Development Workflow
description: Full development cycle capturing knowledge-building through planning → implementation → review → learning
type: workflow
version: 1.0.0
origin: PinchPad©™ (2026-03-16)
author: CrustAgent©™ + Lucas (vibecheck methodology)
---

# Epistemic Loop Development Workflow
## The Full Cycle: Planning → Implementation → Review → Learning

> This workflow captures the **actual way humans learn and build systems**. We write down what we think, challenge it, build it, fail, fix it, review it, learn from it, document it. Repeat until knowledge converges.

> The core insight: **AI writes code, humans design systems.** This workflow keeps humans in the epistemic loop while leveraging AI for execution.

---

## The Workflow Phases

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      EPISTEMIC LOOP CYCLE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: DESIGN THINKING                                              │
│  └─ Human defines problem & constraints                                │
│  └─ Capture requirements in narrative form                             │
│                                                                         │
│  PHASE 2: INITIAL PLANNING                                             │
│  └─ AI creates comprehensive plan document                             │
│  └─ High-level architecture, approach, all decisions                   │
│                                                                         │
│  PHASE 3: PLAN AUDITING (Multi-Agent Review)                           │
│  └─ Agent A reviews for architecture, assumptions, gaps                │
│  └─ Agent B reviews for security, edge cases, risks                    │
│  └─ Agent C reviews for completeness, missing scenarios                │
│  └─ All audits written back into plan (versioned)                      │
│                                                                         │
│  PHASE 4: IMPLEMENTATION                                               │
│  └─ Execute plan as written                                            │
│  └─ **REAL implementation uncovers what theory missed**                │
│  └─ Document all deviations and learnings                              │
│  └─ Tests reveal actual behavior vs. planned behavior                  │
│                                                                         │
│  PHASE 5: POST-IMPLEMENTATION KNOWLEDGE CAPTURE                        │
│  └─ Document **why** implementation differed from plan                 │
│  └─ Write down patterns that worked, gotchas that emerged              │
│  └─ This becomes the SOURCE OF TRUTH                                   │
│                                                                         │
│  PHASE 6: DOCUMENTATION COMPLETION                                     │
│  └─ Update public-facing docs with real knowledge                      │
│  └─ Add troubleshooting section (from actual failures)                 │
│  └─ Add checklists (from actual gotchas)                               │
│  └─ Add examples (from actual code)                                    │
│                                                                         │
│  PHASE 7: CODE REVIEW AUDIT                                            │
│  └─ Agent D audits actual implementation code                          │
│  └─ Agent E reviews for security against OWASP                         │
│  └─ Agent F reviews for performance, edge cases                        │
│  └─ All issues logged and fixed                                        │
│                                                                         │
│  PHASE 8: FINAL DOCUMENTATION PASS                                     │
│  └─ Incorporate all fixes and learnings                                │
│  └─ Plan document becomes canonical reference                          │
│  └─ Implementation is frozen and production-ready                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Design Thinking (Human-Led)

**Goal**: Capture the problem, constraints, and success criteria in human language.

**Inputs**:
- Problem statement (what are we building and why?)
- Constraints (time, resources, security, performance requirements)
- Success metrics (how do we know it worked?)
- Known risks or areas of uncertainty

**Output**: Narrative requirements document (Markdown, prose)

**Example**:
```markdown
# Feature: Database Encryption

## Problem
Our database contains sensitive user data and API tokens. Currently unencrypted at rest.
If someone gains filesystem access, they can read the entire DB with any SQLite tool.

## Constraints
- Must work with existing better-sqlite3 code (zero app-level changes)
- Must support auto-migration (plaintext → encrypted)
- Must not break existing tests
- Must support Docker deployment

## Success Metrics
- All 140 tests pass unchanged
- DB file is unreadable without the key
- Docker compose environment includes key setup
- Performance impact <5%

## Known Risks
- SQL injection if key validation is weak
- File permissions if umask not set
- Test infrastructure must handle token hashing
```

---

## Phase 2: Initial Planning (AI-Led)

**Goal**: Create a comprehensive plan document that captures **all** architecture decisions, implementation approach, and assumptions.

**Prompt to AI**:
```
Given the requirements [paste from Phase 1], create a detailed implementation plan:
- What are the 5-7 main components?
- What's the dependency order?
- What edge cases exist?
- Where are the risk areas?
- What could go wrong and how will we handle it?
- Create a step-by-step implementation guide

Write this as a complete plan document. Assume this will be reviewed by 3 separate auditors.
```

**Output**: Comprehensive plan file (`.crustagent/crustaudits/PLAN_[FEATURE]_INITIAL.md`)

**Checklist before moving to Phase 3**:
- [ ] All 5+ components documented
- [ ] Dependency graph shown
- [ ] Edge cases listed
- [ ] Risk areas identified
- [ ] Unknown unknowns flagged (honest about uncertainty)
- [ ] Implementation steps numbered
- [ ] Success criteria defined
- [ ] Plan is **challengeable** (makes assumptions explicit)

---

## Phase 3: Plan Auditing (Multi-Agent Review)

**Goal**: Have the plan reviewed by 3+ independent agents, each focusing on different aspects.

### Audit Specialization

**Auditor A: Architecture & Completeness**
- Are all components necessary?
- Is the dependency order correct?
- Are there missing pieces?
- Is the approach the simplest one?

**Auditor B: Security & Risk**
- What are the attack vectors?
- Are we following OWASP?
- What happens if X fails?
- Are there silent failure modes?

**Auditor C: Edge Cases & Chaos**
- What happens with concurrent access?
- What if the process crashes mid-operation?
- What about partial failures?
- Are we handling all error states?

### Audit Process

Each auditor reads the plan and produces a review document:

```markdown
---
name: Plan Audit — Architecture & Completeness
reviewer: Auditor-A
date: 2026-03-16
plan_version: PLAN_SQLCipher_INITIAL_v1.md
---

## Issues Found

### Critical
1. **Missing: Stale temp file cleanup** — If migration crashes, `.tmp` file is orphaned.
   - Recommendation: Add cleanup logic on startup

### High
2. **Assumption unstated: Tests use `:memory:`** — If tests use real files, encryption breaks them.
   - Recommendation: Verify test architecture, document assumption

### Medium
3. **Missing test strategy** — How do we test encryption without slowing tests?
   - Recommendation: Document that in-memory DBs are unaffected

## Questions for Implementation
- [ ] Will you measure performance impact?
- [ ] Is key rotation a future concern?
- [ ] Should we add audit logging for DB access?

## Approved Patterns
- ✅ Drop-in package approach is solid
- ✅ Auto-migration logic is elegant
- ✅ Environment variable for key is standard practice
```

**Output files**:
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Architecture_A.md`
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Security_B.md`
- `.crustagent/crustaudits/AUDIT_[FEATURE]_EdgeCases_C.md`

**Update the original plan** with new section:

```markdown
## Phase 3 Audits & Refinements

### Audit Results Summary
- Auditor A: 2 critical, 1 high, 1 medium issues
- Auditor B: 1 critical (SQL injection), 2 high issues
- Auditor C: 2 high (crash recovery, test isolation)

### Incorporated Changes
1. ✅ Added stale temp file cleanup on startup (Auditor A critical)
2. ✅ Added SQL injection prevention via key validation (Auditor B critical)
3. ✅ Added TOCTOU symlink check on migration (Auditor C high)
4. ✅ Documented assumption: tests use :memory: (Auditor A)
5. ❓ Key rotation — deferred to future (noted as known limitation)

### Final Plan Status
**READY FOR IMPLEMENTATION** — See audit files for full details.
```

---

## Phase 4: Implementation (Execution)

**Goal**: Build the feature following the plan, but **document deviations**.

**Key insight**: Implementation will reveal what planning missed. This is **expected and valuable**.

### During Implementation

- Follow the plan as written
- When hitting unexpected issues, **document them**:
  ```markdown
  ## Deviations From Plan

  ### Issue 1: Token hashing broke tests
  **Plan said**: Token hashing optional for test tokens
  **Reality**: Test utilities insert plaintext, middleware hashes on lookup → mismatch
  **Fix applied**: Updated test utility to hash before INSERT
  **Learning**: Test infrastructure must mirror production security patterns
  ```

- Create file: `.crustagent/crustaudits/IMPLEMENTATION_LOG_[FEATURE].md`
- Track:
  - [ ] What worked as planned
  - [ ] What took longer than expected
  - [ ] What required additional work
  - [ ] Bugs found and fixed
  - [ ] Test coverage discovered during implementation

### Example Implementation Log Entry

```markdown
## 2026-03-16 Implementation Session 1

### Completed
✅ Package swap (better-sqlite3 → better-sqlite3-multiple-ciphers)
✅ Key validation regex implementation
✅ Database initialization with encryption

### Unexpected Discoveries
❌ Test token creation was incompatible with token hashing
   → Found: test/shared/app.ts insertd plaintext tokens
   → Middleware now hashes incoming tokens before lookup
   → Tests couldn't match plaintext in DB
   → Solution: Updated createTestToken() to hash before INSERT

### Time Variance
- Plan estimated: 2 hours
- Actual: 3.5 hours
- Additional time spent: Debugging test failures (1.5 hours)

### Learning
Test infrastructure must be treated as production-grade code. Security patterns
in middleware must be reflected in test utilities, not mocked/bypassed.
```

### Output
- Passing tests (140/140)
- Implementation log with all deviations
- Code that works but may differ from plan in details

---

## Phase 5: Post-Implementation Knowledge Capture

**Goal**: Write down what we **actually learned** by building it, not what we planned to learn.

### The Key Question
> "What would I tell another engineer starting this task tomorrow?"

**Output file**: `.crustagent/crustaudits/IMPLEMENTATION_LEARNINGS_[FEATURE].md`

**Structure**:

```markdown
---
name: Implementation Learnings — [Feature]
date: 2026-03-16
based_on: Real code + 140 passing tests + integration experience
---

# What We Learned By Actually Building It

## Biggest Discovery 1: Test Infrastructure Matters
**Plan assumed**: Test tokens could be plaintext, middleware would handle it
**Reality**: Test tokens MUST match production security patterns
**Why it matters**: Tests are the source of truth for API contracts
**For next time**: Treat test utilities as production code from day 1

## Biggest Discovery 2: File Permissions Are Silent Failures
**Plan said**: Set chmod 0o600 and it's done
**Reality**: Umask must be set BEFORE file creation (not after)
**Why it matters**: Files inherit umask during creation, chmod can't retroactively fix
**For next time**: Set umask in finally block to prevent side effects

## Pattern That Worked Well
**Drop-in package approach** — better-sqlite3-multiple-ciphers is truly API-compatible
→ Confidence: Can use this pattern for future encryption drop-ins

## Pattern That Failed
**Key validation in pragma string** — Initial attempt: `db.pragma("key = '${key}'")`
→ Risk: String interpolation enables SQL injection
→ Fix: Strict regex validation BEFORE pragma call

## Hidden Complexity Areas
1. **Token hashing cascades** — Changes to one query require changes to:
   - Auth route (create)
   - Auth route (verify)
   - Auth route (logout)
   - Middleware (lookup)
   - All test queries (lookup)
   → Lesson: Token handling is a system, not isolated pieces

2. **Migration crash recovery** — Stopping during `sqlcipher_export` leaves `.tmp` file
   → Plan didn't account for: Process crash during active migration
   → Fix: Cleanup orphaned `.tmp` on startup

## Metrics From Implementation
- Test count: 140 (unchanged)
- Test pass rate: 100%
- Performance regression: <1% (unnoticeable)
- Files changed: 9
- Lines of security code added: ~80

## Gotchas for Next Engineer
1. ✋ Don't skip key validation — SQL injection is real
2. ✋ Don't set umask without finally block — causes side effects
3. ✋ Don't forget PUID/PGID in Docker — permissions fail on volume mount
4. ✋ Don't store plaintext tokens — makes encryption pointless
5. ✋ Don't skip test infrastructure updates — will cause random failures

## Confidence Level
**HIGH** — All 140 tests pass, code is hardened, pattern is production-ready.
Ready for drop-in to other projects without modification.
```

---

## Phase 6: Documentation Completion

**Goal**: Write the public-facing documentation that someone ELSE will use to drop this in.

**Inputs**:
- Original plan
- Audit findings
- Implementation log
- Implementation learnings
- Real code examples

**Output file**: `.crustagent/knowledge/[FEATURE]-DropIn-Guide.md`

**Structure**:
- Prerequisites (architecture match checklist)
- Step-by-step instructions (tested, proven)
- **Troubleshooting section** (from actual failures)
- **Implementation checklist** (from actual gotchas)
- Red flags to watch for (from actual errors)
- How it works (deep explanation for learning)
- Reference implementation links (to PinchPad code)

**Key difference from planning docs**:
- Plan is "here's what I think will happen"
- Drop-in guide is "here's what **actually** happens"
- Troubleshooting comes from real errors, not hypothetical risks

---

## Phase 7: Code Review Audit

**Goal**: Have 3+ agents independently review the actual implementation code for security, performance, and correctness.

### Audit Specialization

**Code Auditor A: Security (OWASP)**
- Token handling secure?
- Crypto used correctly?
- Input validation complete?
- Error messages not leaking info?

**Code Auditor B: Performance & Reliability**
- Unexpected blocking operations?
- Resource leaks (open file handles)?
- Crash recovery scenarios covered?
- Concurrent access handled?

**Code Auditor C: Correctness & Edge Cases**
- All error states handled?
- Partial failure modes covered?
- Type safety enforced?
- Test coverage adequate?

### Audit Process

Each auditor reviews **actual code** (not plan):

```markdown
---
name: Code Audit — Security Review
auditor: Security-Auditor-A
date: 2026-03-16
files_reviewed: [src/server/db.ts, src/server/routes/auth.ts, src/server/middleware/auth.ts]
---

## Critical Issues
1. **SQL Injection in PRAGMA statement** (src/server/db.ts:134)
   Status: ✅ FIXED in code review (key validation prevents this)

## High Issues
1. **Token stored plaintext in DB** (src/server/routes/auth.ts:125)
   Status: ✅ FIXED (tokens are hashed before storage)

## Medium Issues
1. **File permissions race window** — Umask restored before chmod completes?
   Status: ✅ OK (finally block ensures restoration after chmod)

## Approved Patterns
✅ Token hashing matches industry standard (SHA-256)
✅ Database permissions hardened correctly (0o600)
✅ Auto-migration logic is safe (stale file cleanup present)
```

**Output files**:
- `.crustagent/crustaudits/CODE_AUDIT_Security.md`
- `.crustagent/crustaudits/CODE_AUDIT_Performance.md`
- `.crustagent/crustaudits/CODE_AUDIT_Correctness.md`

**Fix any issues** and re-audit until all auditors sign off.

---

## Phase 8: Final Documentation Pass

**Goal**: Incorporate all learnings, fixes, and audits into a single comprehensive reference document.

### Update Plan Document

The original plan becomes the **canonical reference** after final updates:

```markdown
---
name: SQLCipher Implementation Plan
version: 3.0 (FINAL)
status: PRODUCTION READY
tested_with: 140/140 tests passing, production deployment
---

[Original plan content]

---

## Phase 3: Audit Results & Refinements
[All audits summary]

## Phase 5: Implementation Learnings
[Key discoveries]

## Phase 7: Code Review Results
[All security/performance/correctness audits]

## Final Checklist
- [x] All 140 tests pass
- [x] Security audit passed
- [x] Performance audit passed
- [x] Code review audit passed
- [x] Drop-in guide complete
- [x] Troubleshooting guide complete
- [x] Production deployment successful

## Status
✅ PRODUCTION READY — Ready for drop-in to other projects
```

### Create Final Summary Document

```markdown
---
name: Implementation Summary — SQLCipher Encryption
date: 2026-03-16
effort: ~8 hours (1 session)
status: Complete
---

# SQLCipher Encryption — Full Cycle Summary

## What Was Built
AES-256 database encryption at rest for SQLite using SQLCipher. Drop-in compatible
with any better-sqlite3 project.

## Key Files
- Implementation: src/server/db.ts
- Audit: .crustagent/crustaudits/FULL_AUDIT_2026-03-16.md
- Drop-in guide: .crustagent/knowledge/SQLCipher-DropIn-Guide.md
- Learnings: .crustagent/crustaudits/IMPLEMENTATION_LEARNINGS_SQLCipher.md

## Results
- 140/140 tests passing
- 9 files modified
- 3 P0 security fixes applied
- 4 P1 security hardening measures added
- 0 breaking changes to API
- 0 performance regression

## Production Status
✅ Ready for immediate deployment
✅ Ready for drop-in to other projects
✅ Security audit passed
✅ Performance audit passed

## What Changed vs. Plan
- Plan: 2 hours → Actual: 3.5 hours (test discovery)
- Plan: Optional token hashing → Actual: Required for test/prod parity
- Plan: File chmod after creation → Actual: Umask before + chmod after (safer)
- Plan: No migration recovery → Actual: Stale temp cleanup added

## For Next Engineer
Read in this order:
1. This summary (overview)
2. Implementation learnings (what actually happened)
3. Drop-in guide (how to use it)
4. Audit reports (why it's secure)
5. Code (src/server/db.ts for reference)
```

---

## Workflow in Action: SQLCipher Example

### Phase 1: Requirements (Lucas)
```
Problem: DB unencrypted at rest
Constraint: Must work with existing code
Success metric: All tests pass, DB unreadable without key
```

### Phase 2: Planning (Claude)
Creates 15-page plan with all architecture, edge cases, risks

### Phase 3: Auditing (3 Agents)
- Agent A: "Missing stale temp cleanup, add it"
- Agent B: "SQL injection risk in key pragma, add validation"
- Agent C: "Test tokens won't match hashed lookup, document it"
Plan updated with findings

### Phase 4: Implementation (Claude)
- Follows plan
- Hits test failure (predicted by Auditor C)
- Fixes test utility
- All 140 tests pass
- Documents deviations in implementation log

### Phase 5: Learnings (Claude)
Writes: "Here's what we learned by actually building it..."

### Phase 6: Documentation (Claude)
Creates drop-in guide with troubleshooting from real failures

### Phase 7: Code Review (3 Agents)
- Agent D: "Security OK, token hashing is solid"
- Agent E: "Performance OK, <1% regression"
- Agent F: "Crash recovery OK, stale cleanup works"

### Phase 8: Final Pass (Claude)
Updates plan as canonical reference, marks PRODUCTION READY

---

## Using This Workflow for Your Projects

### For a New Feature
1. Write Phase 1 requirements (prose, what/why/constraints)
2. Run through Phases 2-8 as described
3. At end, you have:
   - Production-ready code
   - Comprehensive documentation
   - Security audits signed off
   - Drop-in guide for other projects
   - Learnings captured for future engineers

### For Auditing Existing Code
Skip Phases 1-5, start with Phase 7 (code review audit)

### For Extracting Patterns
After Phase 8, you have all the pieces to:
- Create drop-in guides (Phase 6 output)
- Build agent prompts (break Phase 6 into smaller tasks)
- Create troubleshooting tools (from Phase 6 troubleshooting section)

---

## Key Principles

1. **Planning is thinking, not prediction**
   - Plans are hypotheses to be tested, not prophecy
   - Deviations are learning, not failure

2. **Implementation is the real teacher**
   - Theory can't anticipate reality
   - Mistakes in code are more valuable than perfect plans
   - Tests reveal hidden assumptions

3. **Documentation captures learning**
   - Drop-in guides aren't written until after implementation
   - Troubleshooting comes from real errors
   - Checklists come from actual gotchas

4. **Audits happen at planning AND implementation**
   - Plan audit finds logical flaws early
   - Code audit finds security/performance issues late
   - Both are essential

5. **The human stays in the loop**
   - Phase 1 & all decisions are human-led
   - AI executes, documents, reviews
   - Human interprets learnings and decides direction

---

## Extraction: Breaking Into Vibecheck Prompts

Once a feature is complete, extract reusable prompts for your vibecheck methodology:

**Prompt 1: Pre-Implementation Audit**
```
I'm planning to implement [feature]. Here's my plan [paste Phase 2].
Review this from the perspective of: architecture completeness, security risks, edge cases.
Flag critical issues before implementation.
```

**Prompt 2: Implementation Discovery**
```
During implementation, I ran into [issue]. Here's what I learned [paste deviation log].
What does this tell us about the system design?
What should I change in the plan/docs?
```

**Prompt 3: Documentation Completion**
```
Here's what actually happened during implementation [paste Phase 5 learnings].
Create a troubleshooting guide for the next engineer who uses this.
Include: common errors, gotchas, red flags, how to fix them.
```

**Prompt 4: Code Review**
```
Review this code for security [paste code], performance [paste code], correctness [paste code].
Assume this will be used by other engineers. What could go wrong?
```

---

## Status

✅ **This workflow is production-tested** — Implemented for SQLCipher encryption in PinchPad
✅ **Ready for adoption** — Use for all future features
✅ **Extraction-ready** — Break into vibecheck prompts for your methodology

---

*Maintained by CrustAgent©™ + Lucas (vibecheck collaboration)*
*Canonical implementation: PinchPad©™ SQLCipher encryption (2026-03-16)*
*Ready for: Full-cycle development, AI-human collaboration, knowledge capture*
