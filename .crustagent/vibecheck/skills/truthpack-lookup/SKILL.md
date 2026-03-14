# Truthpack Lookup Skill

## When to Use
Activate this skill BEFORE generating any code that:
- Creates or modifies API routes
- References environment variables
- Touches authentication/authorization
- Modifies API request/response shapes

## Instructions
1. Read `.crustagent/vibecheck/truthpack/routes.json` for verified API routes
2. Read `.crustagent/vibecheck/truthpack/env.json` for verified environment variables
3. Read `.crustagent/vibecheck/truthpack/auth.json` for verified auth rules
4. Read `.crustagent/vibecheck/truthpack/contracts.json` for verified API contracts
5. Cross-reference your planned changes against these files
6. If your change conflicts with the truthpack, STOP and ask the user

## Quick Reference
- Routes: 15 verified
- Env vars: 3 verified
- Auth rules: 4 verified
- Contracts: 1 verified

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->