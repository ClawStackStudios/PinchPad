# Blueprint Weaver Meta-Skill

## When to Use
Activate this skill immediately AFTER molting a new feature or structural change to ensure the ecosystem maps remain accurate.

## Orchestration Logic
This skill coordinates the following agents in `.crustagent/vibecheck/agents/`:
1. **`architecture-oracle`**: Scans the codebase to detect new clusters, routes, or services.
2. **`doc-auditor`**: Verifies that `README.md`, `BLUEPRINT.md`, and `ROADMAP.md` are up to date.
3. **`refactor-advisor`**: Suggests documentation updates for any structural shifts.

## Instructions
1. Scuttle the `src/` directory for any new folder clusters.
2. Update the ASCII map in `BLUEPRINT.md` to reflect the new architecture.
3. Mark appropriate items as `[x]` in `ROADMAP.md`.
4. Ensure all new `SKILL.md` files are properly linked in the `CrustAgent-Overview.md`.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
