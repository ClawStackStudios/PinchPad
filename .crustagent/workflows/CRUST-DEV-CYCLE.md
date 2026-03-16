---
name: CrustAgent Development Cycle
description: Full coding workflow — plan, audit, build, review, document. Powered by Three-System Triangulated Verification.
type: workflow
version: 1.0.0
origin: PinchPad©™ (2026-03-16)
author: CrustAgent©™ + Lucas
---

# CrustAgent Development Cycle
## Plan → Audit → Build → Review → Document

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CRUST DEV CYCLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: REQUIREMENTS                                                  │
│  └─ Human defines feature, constraints, success criteria               │
│  └─ Output: requirements doc                                           │
│                                                                         │
│  PHASE 2: PLAN                                                          │
│  └─ CrustAgent writes implementation plan                              │
│  └─ Architecture, approach, edge cases, file list                      │
│  └─ Output: .crustagent/crustaudits/PLAN_[FEATURE].md                  │
│                                                                         │
│  PHASE 3: PLAN AUDIT (Three-System Review)                             │
│  └─ Synthesis Engine   → structural analysis, handoff notes            │
│  └─ Formalization Engine → success criteria, verification protocol     │
│  └─ Controlled Opposition → challenge every assumption                 │
│  └─ Plan updated with findings, marked READY or NEEDS REWORK           │
│                                                                         │
│  PHASE 4: IMPLEMENTATION                                               │
│  └─ Build from plan, log all deviations                                │
│  └─ Tests must pass before moving on                                   │
│  └─ Output: working code + implementation log                          │
│                                                                         │
│  PHASE 5: KNOWLEDGE CAPTURE                                            │
│  └─ Document what actually happened vs. plan                           │
│  └─ Gotchas, surprises, patterns that emerged                          │
│  └─ Output: learnings section appended to plan doc                     │
│                                                                         │
│  PHASE 6: DOCUMENTATION                                                │
│  └─ Drop-in guide / knowledge file                                     │
│  └─ Troubleshooting from real errors, checklists from real gotchas     │
│  └─ Output: .crustagent/knowledge/[FEATURE]-Guide.md                   │
│                                                                         │
│  PHASE 7: CODE REVIEW (Three-System Review)                            │
│  └─ Synthesis Engine   → pattern coherence, what divergences reveal    │
│  └─ Formalization Engine → coverage map, exact failure conditions      │
│  └─ Controlled Opposition → security pressure, silent failures         │
│  └─ Issues fixed, tests re-run                                         │
│                                                                         │
│  PHASE 8: FINAL PASS                                                   │
│  └─ Documentation updated with review findings                         │
│  └─ Plan doc becomes canonical reference                               │
│  └─ Commit + production-ready                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Three-System Protocol

Used in **Phase 3** (plan audit) and **Phase 7** (code review). Three agents, always run in this order.

```
┌──────────────────────┬─────────────────────────┬────────────────────────┐
│ SYNTHESIS ENGINE     │ FORMALIZATION ENGINE     │ CONTROLLED OPPOSITION  │
│ (runs first)         │ (runs second)            │ (runs last)            │
├──────────────────────┼─────────────────────────┼────────────────────────┤
│ Find patterns        │ Make claims falsifiable  │ Attack everything       │
│ Flag weak points     │ Define success criteria  │ Demand evidence         │
│ Hand off to other    │ Produce verification     │ Find silent failures    │
│ two engines          │ protocols                │ Force language tight    │
├──────────────────────┼─────────────────────────┼────────────────────────┤
│ Fails when:          │ Fails when:              │ Fails when:            │
│ over-validates,      │ leaves anything in       │ approves to avoid      │
│ resolves too early   │ "probably works"         │ conflict               │
└──────────────────────┴─────────────────────────┴────────────────────────┘
```

**Why this order**: Skeptic runs last so it must challenge the Formalization Engine's exact success criteria — not just assert "bad." Harder to dismiss criticism when "working" is already precisely defined.

---

## Phase 1: Requirements

**Who**: Human (Lucas)
**Output file**: none required — can be inline in the plan

**Capture**:
- What are we building?
- What constraints apply? (must not break X, must support Y)
- What does "done" look like? (specific, testable)
- What are the known risks?

**Template**:
```markdown
## Feature: [Name]

### What
[What is being built]

### Constraints
- [constraint 1]
- [constraint 2]

### Done When
- [ ] [measurable outcome 1]
- [ ] [measurable outcome 2]

### Known Risks
- [risk 1]
- [risk 2]
```

---

## Phase 2: Plan

**Who**: CrustAgent
**Output file**: `.crustagent/crustaudits/PLAN_[FEATURE]_v1.md`

**Plan must include**:
- [ ] All components and their dependencies (in order)
- [ ] Which files will be created/modified
- [ ] Edge cases and how they're handled
- [ ] Risk areas flagged explicitly
- [ ] Step-by-step implementation order
- [ ] Test strategy
- [ ] Assumptions stated explicitly (not buried)

**Plan template**:
```markdown
---
name: Plan — [Feature]
version: v1
status: DRAFT — PENDING AUDIT
---

## Components
[list with dependencies]

## Files Changed
[list]

## Implementation Steps
1. [step]
2. [step]

## Edge Cases
[list]

## Risk Areas
[list]

## Assumptions
[list — must be explicit so auditors can challenge them]

## Test Strategy
[how this will be verified]
```

---

## Phase 3: Plan Audit (Three-System Review)

**Who**: Three agents in sequence
**Input**: Phase 2 plan
**Output files**:
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Synthesis.md`
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Formalization.md`
- `.crustagent/crustaudits/AUDIT_[FEATURE]_Skeptic.md`

After all three, plan gets a new section appended: `## Phase 3 Audit Results`.

---

### Agent 1 — Synthesis Engine (Run First)

**Invoke with**:
```
You are the Synthesis Engine reviewing a coding plan.

Your job: identify structural patterns, premature resolutions, and the weakest points.
Do NOT validate to be helpful. Push on weak points. Name the assumptions that are being made implicitly.
Flag specific areas for the Formalization and Skeptic engines.

Output format:
---
## Structural Analysis
[Patterns, how components connect]

## Premature Resolutions
[Decisions made before the problem is fully understood]

## Weakest Points
[Specific areas flagged for pressure — with reasons]

## Handoff: Formalization Engine
Focus on: [specific claims that need measurable success criteria]

## Handoff: Skeptic
Apply pressure to: [specific assumptions to challenge]
---

Plan: [paste plan]
```

---

### Agent 2 — Formalization Engine (Run Second)

**Invoke with**:
```
You are the Formalization Engine reviewing a coding plan.

Your job: take every claim in this plan and make it falsifiable.
Produce exact success criteria, exact verification steps (commands/tests), and a list of anything that's currently unfalsifiable.
Code and logic only — no analogies.

Output format:
---
## Falsifiability Assessment
[Each component: FALSIFIABLE / NEEDS WORK / UNFALSIFIABLE]

## Success Criteria (Strict)
[Numbered, measurable outcomes — each one testable]

## Verification Protocol
[Exact commands or test cases to verify each criterion]

## Unfalsifiable Claims
[What makes them unfalsifiable, what would fix it]

## Boundary Conditions
[Exact inputs that should break or stress-test the design]
---

Plan: [paste plan]
Synthesis audit: [paste]
```

---

### Agent 3 — Controlled Opposition / Skeptic (Run Last)

**Invoke with**:
```
You are the Controlled Opposition reviewing a coding plan.

Your job: maximum pressure. You have the Formalization Engine's success criteria — now attack them.
Find every assumption that could fail. Demand evidence. Tighten vague language.
If you notice yourself being agreeable to avoid conflict — halt and restart.
You are not here to approve. You are here to find the cracks.

Output format:
---
## Challenge Log

### [Component or Claim]
Assumption: [what the plan assumes]
Objection: [direct challenge]
Verdict: HOLD / NEEDS FIX / CRITICAL FLAW

## Vague Language
[Terms that are undefined but load-bearing]

## Rejected Approvals
[Things I almost let through — and why I didn't]

## Minimum Required Changes Before Implementation
[Ordered — must be fixed before code is written]
---

Plan: [paste plan]
Synthesis audit: [paste]
Formalization audit: [paste]
```

---

### After All Three: Update Plan

Append to plan document:

```markdown
## Phase 3: Audit Results

| Engine | Critical | High | Medium |
|---|---|---|---|
| Synthesis | N | N | N |
| Formalization | N | N | N |
| Skeptic | N | N | N |

## Changes Made
1. ✅ [fix]
2. ✅ [fix]
3. ❓ [deferred — reason]

## Status
**READY FOR IMPLEMENTATION** / **NEEDS REWORK: [areas]**
```

---

## Phase 4: Implementation

**Who**: CrustAgent
**Output**: Working code + implementation log

**Rules**:
- Follow the plan
- When you deviate — log it immediately
- Tests must pass before calling implementation done
- Never skip the log entry when something surprising happens

**Implementation log** (append to plan doc, or separate file):

```markdown
## Implementation Log

### Completed
✅ [what was done]

### Deviations From Plan
❌ [What plan said]
→ [What actually happened]
→ [Fix applied]
→ [What this reveals about the original plan]

### Test Results
[pass/fail counts, any failures and how resolved]
```

---

## Phase 5: Knowledge Capture

**Who**: CrustAgent
**Output**: Appended to plan doc as `## Phase 5: What We Learned`

This is the most important phase for future engineers. Write it as if you're briefing the next person who has to touch this code.

**Template**:
```markdown
## Phase 5: What We Learned

### Biggest Surprises
1. [Thing the plan got wrong] → [What actually happened] → [Why it matters]

### Patterns That Worked
- [Pattern] — [Why it worked]

### Gotchas for Next Engineer
1. ✋ [Don't do X — because Y]
2. ✋ [Always do X — because Y]

### Things That Cascaded
[Changes that required unexpected downstream changes — e.g. token hashing requires updating test utilities]

### Metrics
- Files changed: N
- Tests: N/N passing
- Time variance from plan: [planned vs actual]
```

---

## Phase 6: Documentation

**Who**: CrustAgent
**Output file**: `.crustagent/knowledge/[FEATURE]-Guide.md`

**Structure** (mandatory sections):

```markdown
# [Feature] — Drop-In Guide

## Prerequisites
[Architecture match checklist — confirm the target project is compatible]

## Step 1 — [First major step]
[Verbatim copy-paste blocks, not prose descriptions]

## Step 2 — [Second major step]
...

## Verification
[Exact commands to confirm it works]

## Troubleshooting
[From real errors during implementation — not hypothetical]

### [Error or symptom]
Cause: [exact cause]
Fix: [exact fix]
Verify: [how to confirm fixed]

## Implementation Checklist
- [ ] [From real gotchas, not made-up checklist items]

## Red Flags
[From real failures — specific signs something is wrong]
```

**Rule**: Troubleshooting section comes from Phase 4/5 failures, not hypotheticals. If you didn't actually hit the error, don't write the troubleshooting entry.

---

## Phase 7: Code Review (Three-System Review)

**Who**: Three agents in sequence
**Input**: All modified/created source files + Phase 4 implementation log
**Output files**:
- `.crustagent/crustaudits/CODE_AUDIT_[FEATURE]_Synthesis.md`
- `.crustagent/crustaudits/CODE_AUDIT_[FEATURE]_Formalization.md`
- `.crustagent/crustaudits/CODE_AUDIT_[FEATURE]_Skeptic.md`

**Critical distinction from Phase 3**: Phase 3 audited the plan. Phase 7 audits actual code. The Skeptic now has implementation evidence — divergences from plan, real test coverage, real edge cases.

---

### Agent 1 — Synthesis Engine (Run First)

**Invoke with**:
```
You are the Synthesis Engine performing a post-implementation code review.

Read the code and the implementation log.
Identify:
- Architectural decisions that are implicit in the code (not just stated in plan)
- Where implementation diverged from plan — and what that reveals about the original design
- Cross-cutting concerns handled consistently vs. inconsistently across files
- Functions or patterns that are doing too much or too little

Flag specific lines/functions for Formalization and Skeptic to pressure-test.

Files: [list + paste code]
Implementation log: [paste]
```

---

### Agent 2 — Formalization Engine (Run Second)

**Invoke with**:
```
You are the Formalization Engine performing a post-implementation code review.

For every security, performance, and correctness claim in the code:
produce exact verification protocols.

Produce:
- Specific test cases that verify each security property
- Exact inputs that would break each function (boundary values, nulls, type mismatches)
- Coverage map: what is NOT tested that should be
- Explicit failure conditions for each function ("this function fails when...")

No assertions. Code-level evidence only.

Files: [list + paste code]
Synthesis review: [paste]
```

---

### Agent 3 — Controlled Opposition / Skeptic (Run Last)

**Invoke with**:
```
You are the Controlled Opposition performing a post-implementation code review.

You have the implementation log, the Synthesis review, and the Formalization review.
Find every place where the code could silently fail, be bypassed, or produce incorrect results.

Rules:
- If the Formalization Engine defined a success criterion, find an edge case that satisfies it but still produces wrong behavior
- Apply OWASP top 10 pressure
- Challenge the test suite — are tests verifying correctness, or just passing?
- Look for timing windows, race conditions, unhandled exceptions
- "Probably fine" = look harder

Files: [list + paste code]
Synthesis review: [paste]
Formalization review: [paste]
```

**Output format** (same as Phase 3 Skeptic, but code-level):
```markdown
---
engine: Controlled Opposition
phase: Code Review
---

## Challenge Log

### [Function or file]
Claim: [what the code assumes it's doing]
Challenge: [specific objection]
Finding: [what actually happens under pressure]
Verdict: HOLD / NEEDS FIX / CRITICAL

## Rejected Approvals
[Things I almost approved — and the reason I didn't]

## Minimum Required Changes Before Ship
[Ordered list]
```

---

## Phase 8: Final Pass

**Who**: CrustAgent
**Output**: Updated docs + git commit

**Steps**:
1. Apply all fixes from Phase 7
2. Re-run full test suite — must be 100% passing
3. Update knowledge guide with any new findings from code review
4. Update plan doc with Phase 7 results section
5. Commit everything with descriptive message covering all phases

**Plan doc final section**:
```markdown
## Phase 7: Code Review Results

| Engine | Critical | High | Medium |
|---|---|---|---|
| Synthesis | N | N | N |
| Formalization | N | N | N |
| Skeptic | N | N | N |

## Fixes Applied
1. ✅ [fix]

## Final Test Results
Tests: N/N passing

## Status
✅ PRODUCTION READY
```

---

## File Output Map

```
.crustagent/
├── crustaudits/
│   ├── PLAN_[FEATURE].md                       ← Phase 2, updated through Phase 8
│   ├── AUDIT_[FEATURE]_Synthesis.md            ← Phase 3
│   ├── AUDIT_[FEATURE]_Formalization.md        ← Phase 3
│   ├── AUDIT_[FEATURE]_Skeptic.md              ← Phase 3
│   ├── CODE_AUDIT_[FEATURE]_Synthesis.md       ← Phase 7
│   ├── CODE_AUDIT_[FEATURE]_Formalization.md   ← Phase 7
│   └── CODE_AUDIT_[FEATURE]_Skeptic.md        ← Phase 7
└── knowledge/
    └── [FEATURE]-Guide.md                      ← Phase 6
```

The plan doc (`PLAN_[FEATURE].md`) is a living file — sections appended after each phase. By Phase 8, it contains the full history of the feature from requirements through production.

---

## Quick Reference

```
PHASE 1  Human defines requirements
PHASE 2  CrustAgent writes plan → PLAN_[FEATURE].md
PHASE 3  Three-System audits PLAN → Synthesis → Formalization → Skeptic (in order)
PHASE 4  CrustAgent implements + logs deviations
PHASE 5  CrustAgent captures what was actually learned
PHASE 6  CrustAgent writes drop-in guide → knowledge/[FEATURE]-Guide.md
PHASE 7  Three-System audits CODE → Synthesis → Formalization → Skeptic (in order)
PHASE 8  Fix, re-test, update docs, commit
```

**Hard rules**:
- Skeptic always runs last — it challenges Formalization's criteria, not just vibes
- Tests must pass before Phase 5 begins
- Troubleshooting docs come from real failures only
- Plan doc is appended to throughout — never rewritten, only extended

---

*Maintained by CrustAgent©™*
*Origin: PinchPad©™ — 2026-03-16*
