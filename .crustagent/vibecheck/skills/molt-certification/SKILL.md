# Molt Certification Meta-Skill

## When to Use
Activate this skill as the final gate before:
- Merging a feature into the main branch
- Building the production Docker image
- Declaring a task "Done" to Lucas

## Orchestration Logic
This skill coordinates the following agents in `.crustagent/vibecheck/agents/`:
1. **`deploy-checker`**: Verifies `docker-compose.yml` and build pipeline health.
2. **`code-auditor`**: Checks for CrustCode©™ naming conventions and structure.
3. **`quality-enforcer`**: Validates test coverage and linting status.
4. **`truthpack-enforcer`**: Ensures zero drift between code and the verified truthpack.

## Instructions
1. Run `npm run build` and `npm test` to verify zero-regression.
2. Execute a `vibecheck.sh` pinch to ensure both ports (:5757, :6262) are healthy.
3. Verify that a `walkthrough.md` exists and accurately describes the changes.
4. If any agent flags a "Yellow Vibe," STOP and fix before certification.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
