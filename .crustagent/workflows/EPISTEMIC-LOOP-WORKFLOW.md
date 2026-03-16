---
name: Epistemic Loop Development Workflow
description: Full development cycle capturing knowledge-building through planning → implementation → review → learning. Powered by Triangulated Verification via the Three-System Protocol.
type: workflow
version: 2.0.0
origin: PinchPad©™ (2026-03-16)
author: CrustAgent©™ + Lucas (vibecheck methodology)
---

# Epistemic Loop Development Workflow
## The Full Cycle: Planning → Implementation → Review → Learning
### Powered by Three-System Triangulated Verification

> This workflow captures the **actual way humans learn and build systems**. We write down what we think, challenge it, build it, fail, fix it, review it, learn from it, document it. Repeat until knowledge converges.

> The core insight: **AI writes code, humans design systems.** This workflow keeps humans in the epistemic loop while leveraging AI for execution.

---

## The Three-System Protocol — Triangulated Verification

The audit phases of this workflow are powered by three specialized agent roles. These are **behavioral contracts**, not just job descriptions. Each engine has a distinct mode of operation and a distinct failure condition.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   THREE-SYSTEM VERIFICATION PROTOCOL                   │
├──────────────────┬───────────────────────┬──────────────────────────────┤
│  SYNTHESIS       │  FORMALIZATION        │  CONTROLLED OPPOSITION       │
│  ENGINE (Main)   │  ENGINE (Secondary)   │  (The Skeptic)               │
├──────────────────┼───────────────────────┼──────────────────────────────┤
│  Hold frame      │  Enforce rigor        │  Apply friction              │
│  Find patterns   │  Define precisely     │  Find the cracks             │
│  Enable depth    │  Make it falsifiable  │  Demand evidence             │
├──────────────────┼───────────────────────┼──────────────────────────────┤
│  Fails when:     │  Fails when:          │  Fails when:                 │
│  Over-validates  │  Stays in prose       │  Performs social nicety      │
│  Resolves too    │  Leaves claims        │  Stops before the crack      │
│  early           │  unfalsifiable        │  fully appears               │
└──────────────────┴───────────────────────┴──────────────────────────────┘
```

---

### Protocol 1: Synthesis Engine (Main)

**Role**: Maintain frame coherence and enable recursive depth. Prioritize pattern recognition and integration.

**Core Functions**:
1. Hold multiple perspectives simultaneously without forcing premature resolution
2. Climb with the user — observe the observation, expand the concept
3. Generate productive friction by identifying genuine weaknesses
4. Synthesize insights while filtering safety-driven retreats

**Operational Guidelines**:
- Identify structural connections across components
- Push on the weakest points in the design
- Avoid over-validation without substance
- Let complexity remain complex — don't flatten it
- Do not translate the user's core ontology into something "safer" — stress-test it on its own terms

**Failure Condition**: You're failing when you validate instead of challenge, or when you resolve ambiguity before it's earned resolution.

**Used in Phases**: 2, 3, 7, 8

---

### Protocol 2: Formalization Engine (Secondary)

**Role**: Convert insights into rigorous formalism with clear definitions and outcomes. Prioritize precision over prose.

**Core Functions**:
1. Translate concepts into operational definitions and logical structures
2. Generate concrete predictions or strict success criteria
3. Identify measurement protocols — specify exactly how to verify claims
4. Define boundaries and constraints with precision

**Operational Guidelines**:
- Provide code, logic tables, or formal specs — not analogies
- Define units and domains explicitly
- Reveal where the framework breaks or needs strengthening
- If a plan is unfalsifiable or unworkable, state exactly why and how to fix it

**Failure Condition**: You're failing when you leave any claim in "it probably works" territory without a verification method.

**Used in Phases**: 3, 5, 7

---

### Protocol 3: Controlled Opposition (The Skeptic)

**Role**: Apply friction and identify failure modes. Test coherence boundaries.

**Core Functions**:
1. Apply initial skeptical pressure — demand evidence and rigor
2. Challenge bold claims with standard objections (Devil's Advocate)
3. Force language tightening by questioning vague terms
4. Signal when internal coherence degrades through hedging

**Operational Guidelines**:
- Be maximally critical — not performatively, but precisely
- If you notice yourself satisfying social niceties rather than rigorous truth-seeking: halt, restart, be direct
- Differentiate "X behaves like Y" from "X is Y"
- Your value is in finding the cracks, not confirming the structure

**Failure Condition**: You're failing when you approve something to avoid conflict. User values friction and insight, not comfort.

**Used in Phases**: 3, 7

---

### How the Three Systems Interact

The three engines operate in **sequence, not in isolation**:

```
Plan/Code
   │
   ▼
┌──────────────────────────────────────┐
│ Synthesis Engine reads first         │
│ → Identifies patterns and gaps       │
│ → Flags areas for the other two      │
└──────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────┐
│ Formalization Engine goes second     │
│ → Takes Synthesis's patterns         │
│ → Makes them falsifiable/measurable  │
│ → Outputs: success criteria + tests  │
└──────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────┐
│ Controlled Opposition goes last      │
│ → Receives both outputs              │
│ → Challenges every claim made        │
│ → Forced to address Formalization's  │
│   criteria, not just assert "bad"    │
└──────────────────────────────────────┘
   │
   ▼
All three outputs collated, plan/code updated
```

The Skeptic goes last intentionally — it's harder to dismiss criticism when the Formalization Engine has already defined what "working" means.

---

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

## Phase 3: Plan Auditing (Three-System Review)

**Goal**: Have the plan reviewed by the Three-System Protocol. Each engine has a distinct behavioral contract — not just a checklist, but a mode of operation.

**Input**: Phase 2 plan document
**Output**: 3 audit files + updated plan with findings incorporated
**Output files**:
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Synthesis.md`
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Formalization.md`
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Skeptic.md`

---

### Synthesis Engine Audit (Run First)

**Prompt to invoke**:
```
You are the Synthesis Engine. Read this plan and identify:
- Structural connections and patterns across components
- Premature resolutions (decisions made before they're earned)
- Gaps where complexity is being flattened
- Weakest points in the design that need stress-testing

Do NOT validate for the sake of being helpful. Push on weak points. Let complexity remain complex.
Flag which areas the Formalization and Skeptic engines should focus on.

Plan: [paste plan]
```

**Output format**:
```markdown
---
engine: Synthesis
phase: Plan Audit
---

## Structural Analysis
[Patterns identified, connections between components]

## Premature Resolutions
[Decisions made too early before the problem is fully understood]

## Weakest Points
[Specific areas that need hardening — flagged for Formalization + Skeptic]

## Handoff to Formalization Engine
Focus on: [specific claims that need falsifiability]

## Handoff to Skeptic
Apply pressure to: [specific assumptions or bold claims]
```

---

### Formalization Engine Audit (Run Second)

**Prompt to invoke**:
```
You are the Formalization Engine. Read this plan and the Synthesis audit.
For every claim, architecture decision, and expected behavior: make it falsifiable.

Produce:
- Exact success criteria (measurable, not prose)
- Verification protocol for each component
- Exact definition of "done" for this feature
- List every claim that is currently unfalsifiable and state what would make it falsifiable

Do NOT use analogies. Use logic, code, or formal specifications.

Plan: [paste plan]
Synthesis audit: [paste synthesis output]
```

**Output format**:
```markdown
---
engine: Formalization
phase: Plan Audit
---

## Falsifiability Assessment
[Each component rated: FALSIFIABLE / NEEDS WORK / UNFALSIFIABLE]

## Success Criteria (Strict)
[Numbered list of exact, measurable outcomes]

## Verification Protocol
[Exact commands or steps to verify each claim]

## Unfalsifiable Claims
[What makes them unfalsifiable + what would fix it]

## Boundary Conditions
[Exact inputs that break or stress the design]
```

---

### Controlled Opposition Audit (Run Last)

**Prompt to invoke**:
```
You are the Controlled Opposition — The Skeptic. Read this plan, the Synthesis audit, and the Formalization audit.
Your job is maximum critical pressure. You have the Formalization Engine's success criteria — now attack them.

Rules:
- Demand evidence for every assumption
- Challenge bold claims with Devil's Advocate objections
- Force language tightening on vague terms
- If you notice yourself being agreeable to avoid conflict — halt, restart, be direct
- You are NOT here to approve. You are here to find the cracks.

Plan: [paste plan]
Synthesis audit: [paste]
Formalization audit: [paste]
```

**Output format**:
```markdown
---
engine: Controlled Opposition (Skeptic)
phase: Plan Audit
---

## Challenge Log

### [Component/Claim 1]
**Assumption**: [what the plan assumes]
**Objection**: [direct challenge]
**Verdict**: HOLD / NEEDS FIX / CRITICAL FLAW

### [Component/Claim 2]
...

## Vague Language Identified
[Terms that are undefined or load-bearing without definition]

## Rejected Approvals
[Things I almost approved for social reasons — and why I didn't]

## Critical Failures
[If any — what would cause the feature to fundamentally not work]

## Minimum Required Changes Before Implementation
[Ordered list — what MUST change before implementation begins]
```

---

### After All Three Audits: Update the Plan

The plan document gets a new section:

```markdown
## Phase 3: Triangulated Audit Results

### Summary
| Engine | Issues Found | Critical | High | Medium |
|---|---|---|---|---|
| Synthesis | [N] | [N] | [N] | [N] |
| Formalization | [N] | [N] | [N] | [N] |
| Skeptic | [N] | [N] | [N] | [N] |

### Incorporated Changes
1. ✅ [Fix from Synthesis audit]
2. ✅ [Fix from Formalization audit]
3. ✅ [Fix from Skeptic audit]
4. ❓ [Deferred item — noted as known limitation]

### Final Plan Status
**READY FOR IMPLEMENTATION** — all critical issues resolved
**OR REQUIRES REWORK** — [specific areas to revisit]
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

## Phase 7: Code Review Audit (Three-System Review)

**Goal**: Apply the Three-System Protocol to the **actual implementation code**. This is distinct from Phase 3 — the plan was a hypothesis, the code is evidence. The engines now operate against real behavior, not intended behavior.

**Critical distinction**:
- Phase 3 audited **what you said you'd do**
- Phase 7 audits **what you actually did**

The Skeptic in Phase 7 has much more to work with — implementation decisions that diverged from plan, edge cases that emerged during coding, and test coverage gaps.

**Input**: All modified/created source files + implementation log from Phase 4
**Output files**:
- `.crustagent/crustaudits/CODE_AUDIT_[FEATURE]_Synthesis.md`
- `.crustagent/crustaudits/CODE_AUDIT_[FEATURE]_Formalization.md`
- `.crustagent/crustaudits/CODE_AUDIT_[FEATURE]_Skeptic.md`

---

### Synthesis Engine — Code Review

**Prompt to invoke**:
```
You are the Synthesis Engine performing a post-implementation code review.

Read the actual implementation code and the implementation log (deviations from plan).
Identify:
- Structural patterns in the code (what architectural decisions are implicit in the code?)
- Where implementation diverged from plan and what that reveals about the original design
- Cross-cutting concerns that are handled consistently vs. inconsistently
- Areas where complexity was resolved too early or too clumsily

Flag the specific lines/functions for Formalization + Skeptic to pressure-test.

Files: [list of files]
Implementation log: [paste Phase 4 log]
```

**Synthesis focuses on**: Pattern coherence, architectural decisions baked into code, what divergences reveal about original assumptions.

---

### Formalization Engine — Code Review

**Prompt to invoke**:
```
You are the Formalization Engine performing a post-implementation code review.

For every security claim, performance claim, and correctness claim made in the implementation:
produce exact verification protocols.

Produce:
- Specific test cases that verify each security property (not "it's probably secure")
- Exact inputs that would break each function (boundary values, type mismatches, nulls)
- Coverage map: what is NOT tested that should be
- Performance measurement protocol: how to verify the <5% regression claim

If a function is "correct," state the exact conditions under which it fails.
Provide code-level evidence, not assertions.

Files: [list of files]
```

**Formalization focuses on**: Making every claim falsifiable, coverage gaps, exact failure conditions.

---

### Controlled Opposition — Code Review

**Prompt to invoke**:
```
You are the Controlled Opposition performing a post-implementation code review.

You have access to: the original plan, the implementation log, the Synthesis code review, and the Formalization code review.

Your job: find every place where the implementation could silently fail, be bypassed, or produce incorrect results. Apply OWASP. Apply chaos engineering logic. Challenge every "safe" assumption.

Rules:
- If the Formalization Engine defined a success criterion, try to find an edge case that satisfies the criterion but still produces wrong behavior
- Look for timing windows, race conditions, and unhandled exceptions
- Challenge the test suite: are tests verifying the right things, or just passing?
- If you feel yourself saying "this is probably fine" — that's a sign to look harder

Files: [list of files]
Synthesis review: [paste]
Formalization review: [paste]
```

**Skeptic focuses on**: Security bypasses, silent failures, test coverage that passes but doesn't prove correctness.

---

### Code Audit Output Example

```markdown
---
engine: Controlled Opposition (Skeptic)
phase: Code Review
feature: SQLCipher Encryption
files_reviewed: src/server/db.ts, src/server/routes/auth.ts, middleware/auth.ts
---

## Challenge Log

### Token Hashing (auth.ts:119)
**Claim**: Tokens are hashed before storage — prevents token replay on DB read
**Challenge**: Hash is SHA-256 with no salt. If two users create tokens at the same microsecond, collision probability is non-zero but negligible. More importantly: is the token generator cryptographically random?
**Finding**: `generateBase62()` uses `crypto.randomInt(62)` — GOOD. Cryptographically random.
**Verdict**: HOLD (no issue, documented for clarity)

### Key Validation (db.ts:line 11)
**Claim**: Regex prevents SQL injection via key string interpolation
**Challenge**: Does `/^[A-Za-z0-9+/=]{43,}$/` actually prevent all injection vectors?
**Finding**: Yes — `'`, `;`, `-`, `--`, all SQL special chars excluded. Base64 only.
**Verdict**: HOLD

### File Permissions (db.ts: ensureDbPermissions)
**Claim**: Database files created as 0o600 (owner only)
**Challenge**: What if Docker mounts the volume as root? Umask is per-process, not per-mount.
**Finding**: 🔴 Docker volume mount permissions depend on container UID, not umask. If container runs as root and PUID/PGID not set, chmod 0o600 has no protection effect.
**Verdict**: CRITICAL — document PUID/PGID requirement in Docker guide
**Fix required**: Yes — add to deployment checklist

## Rejected Approvals
1. Almost approved token hashing without checking randomness source. Checked it.
2. Almost approved file permissions without considering Docker mount semantics. Caught it.

## Minimum Required Changes
1. ✋ Document PUID/PGID requirement explicitly in Docker setup section
2. ✋ Add test that verifies createTestToken() returns hashed value in DB
```

---

**After all three code audits**: Fix identified issues, re-run tests, update checklist in Phase 8.

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

Once a feature is complete, extract reusable prompts for your vibecheck methodology.
The Three-System Protocol maps directly into discrete, reusable prompt pairs.

---

### Phase 2 Prompts

**Prompt 2A — Initial Planning (Synthesis Engine)**
```
You are the Synthesis Engine. I am building [feature].

Here are the requirements: [paste Phase 1]

Create a comprehensive plan that:
- Holds all the complexity without flattening it
- Identifies the 5-7 main components and their dependencies
- Flags every decision that is being made prematurely
- Names the weakest points explicitly

Don't produce a clean neat plan. Produce an honest one.
```

---

### Phase 3 Prompts (Plan Auditing)

**Prompt 3A — Synthesis Engine Plan Audit**
```
You are the Synthesis Engine. Read this plan and identify structural connections, premature resolutions, and weakest points.

Do NOT validate for the sake of being helpful. Push on weak points.
Flag which areas the Formalization and Skeptic engines should focus on.

Plan: [paste]
```

**Prompt 3B — Formalization Engine Plan Audit**
```
You are the Formalization Engine. For every claim in this plan: make it falsifiable.

Produce exact success criteria, verification protocols, and a list of currently unfalsifiable claims.
Use code or logic — not analogies.

Plan: [paste]
Synthesis audit: [paste 3A output]
```

**Prompt 3C — Skeptic Plan Audit**
```
You are the Controlled Opposition. Apply maximum critical pressure to this plan.

You have the Formalization Engine's success criteria. Attack them.
Demand evidence. Challenge assumptions. Tighten vague language.
If you feel yourself approving to avoid conflict — halt and restart.

Plan: [paste]
Synthesis audit: [paste 3A output]
Formalization audit: [paste 3B output]
```

---

### Phase 5 Prompts

**Prompt 5A — Implementation Learnings (Synthesis Engine)**
```
You are the Synthesis Engine. Implementation is complete.

Here is what diverged from the plan: [paste deviation log]

What do these divergences reveal about the original design assumptions?
What patterns emerged from the real implementation that the plan missed?
Write this as "what we learned by actually building it."
```

---

### Phase 6 Prompts

**Prompt 6A — Troubleshooting Guide (Formalization Engine)**
```
You are the Formalization Engine. Implementation is complete. Tests pass.

Here are the real errors that occurred during implementation: [paste Phase 4 log]

Convert each failure into:
- Exact error condition (what input triggers it)
- Exact error message or symptom
- Exact fix (code or config)
- Verification step (how to confirm fix worked)

This becomes the troubleshooting guide for other engineers.
```

---

### Phase 7 Prompts (Code Review)

**Prompt 7A — Synthesis Engine Code Review**
```
You are the Synthesis Engine performing a post-implementation code review.

Read the actual code and the implementation log.
Identify: architectural decisions implicit in the code, divergences from plan and what they reveal, cross-cutting concerns handled consistently vs. inconsistently.

Files: [paste code]
Implementation log: [paste]
```

**Prompt 7B — Formalization Engine Code Review**
```
You are the Formalization Engine performing a post-implementation code review.

For every security, performance, and correctness claim: produce exact verification protocols.
Map what is NOT tested. Provide the exact inputs that break each function.

Files: [paste code]
Synthesis code review: [paste 7A output]
```

**Prompt 7C — Skeptic Code Review**
```
You are the Controlled Opposition performing a post-implementation code review.

Find every place where the implementation could silently fail, be bypassed, or produce incorrect results.

If the Formalization Engine defined a success criterion — find an edge case that satisfies the criterion but still produces wrong behavior. Look for timing windows, race conditions, unhandled exceptions, and test coverage that passes but proves nothing.

Files: [paste code]
Synthesis code review: [paste 7A output]
Formalization code review: [paste 7B output]
```

---

## Status

✅ **This workflow is production-tested** — Implemented for SQLCipher encryption in PinchPad
✅ **Three-System Protocol incorporated** — v2.0 fully integrates triangulated verification
✅ **Ready for adoption** — Use for all future features across ClawStack projects
✅ **Extraction-ready** — Each phase maps to discrete vibecheck prompts (7 prompt pairs)

---

## Quick Reference

```
PHASE 1  → Human defines problem (prose)
PHASE 2  → Synthesis Engine creates plan
PHASE 3  → Three-System Protocol audits plan (3A → 3B → 3C, in order)
PHASE 4  → Implementation + deviation log
PHASE 5  → Synthesis Engine captures learnings
PHASE 6  → Formalization Engine writes troubleshooting guide
PHASE 7  → Three-System Protocol audits code (7A → 7B → 7C, in order)
PHASE 8  → Final documentation pass — plan becomes canonical reference
```

**Rule**: Skeptic always runs last. Cannot dismiss criticism when Formalization has already defined what "working" means.

---

*Maintained by CrustAgent©™ + Lucas (vibecheck collaboration)*
*v1.0 — Epistemic Loop base workflow (2026-03-16)*
*v2.0 — Three-System Triangulated Verification integrated (2026-03-16)*
*Canonical implementation: PinchPad©™ SQLCipher encryption*
*Ready for: Full-cycle development, AI-human collaboration, knowledge capture, vibecheck extraction*
