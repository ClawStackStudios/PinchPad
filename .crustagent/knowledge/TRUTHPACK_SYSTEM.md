# Knowledge Base: Truthpack Verification System 🩺💎

## Overview
The "Truthpack" is a collection of JSON-based stability anchors used by agents to verify project integrity. It resides in the Vibecheck ecosystem.

## Core Truthpacks

### 🛡️ `security.json`
- **Purpose**: Defines the cryptographic and authorization invariants.
- **Checks**:
    - Presence of `requireAuth` on sensitive routes.
    - Consistency of `hu-` and `lb-` key handling.
    - Environmental secret isolation status.

### 🧱 `blueprint.json`
- **Purpose**: Maps the project's structural geometry.
- **Checks**:
    - Feature-folder adherence (`src/features/...`).
    - SQLite table existence and FK constraints.
    - Port allocation (6262 and 5757).

## The `truthpack-updater` Skill
- **Function**: Automatically synchronizes the JSON anchors with the actual codebase during "molt" events.
- **Execution**: `npm run vibecheck:sync-truth` (Coming soon).

## Verification Workflow
Agents use the `molt-certification` skill to cross-reference their changes against the Truthpack, ensuring no architectural rot or security drift occurs during feature iteration.

---
**Maintained by CrustAgent©™**
