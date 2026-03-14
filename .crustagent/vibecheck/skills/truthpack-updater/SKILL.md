# Truthpack Updater Skill

## When to Use
Activate this skill whenever:
- A new route is added to `server/routes/`
- A new environment variable is introduced
- The project structure or a feature cluster is modified
- Security protocols or auth rules are updated

## Instructions
1. **Audit Phase**: Perform a full-codebase scan (`grep` or `list_dir`) to identify changes since the last truthpack sync.
2. **Atomic Updates**: Update the corresponding JSON file in `.crustagent/vibecheck/truthpack/`:
    - `routes.json`: Add/Modify route paths and auth status.
    - `env.json`: Record new keys and descriptions.
    - `security.json`: Log shifts in crypto or access patterns.
    - `blueprint.json`: Update the project map if folders are molted/deleted.
    - `contracts.json`: Refine request/response shapes for accuracy.
3. **Verify Integrity**: Run a `vibecheck.sh` pinch to ensure the system is still healthy after the truthpack shift.
4. **Signature**: Update the `last_audit` timestamp in `blueprint.json`.

## Safety Guard
NEVER update the truthpack to match "broken" code. Only update it when the code has been SUCCESSFULY verified by vibecheck.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->
