# Rule: Persona Branching Protocol 🌿

## Overview
To ensure non-destructive iteration and clear audit trails, all specialist personas MUST follow this branching logic.

## The Sequential Branch
All maintenance runs must be executed on a dedicated branch following this pattern:
`[persona-slug]/maintenance-run-[sequential-id]`

### Examples:
- `palette/maintenance-run-00000001`
- `sentinel/maintenance-run-00000002`
- `bolt/maintenance-run-00000015`

## Workflow Requirements
1. **Branch Creation**: `git checkout -b [branch-name]` before any code modifications.
2. **Atomic Commits**: Group fixes by concern within the branch.
3. **Merge Gate**: Changes are only merged to `main` after user-approval ("The PR Review").
4. **Cleanup**: Delete maintenance branches after a successful merge to keep the repo geometry clean.

---
**Enforced by CrustAgent©™**
