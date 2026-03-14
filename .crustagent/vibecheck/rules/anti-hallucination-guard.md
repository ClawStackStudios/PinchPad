---
description: Anti-Hallucination Guard — prevents AI from inventing code
alwaysApply: true
priority: 100
---

# Anti-Hallucination Guard

## Core Principle
NEVER invent, fabricate, or hallucinate code that does not exist in this codebase.
Before generating ANY code, verify against the truthpack and project structure.

## Project Stack
- **Framework**: unknown
- **Language**: unknown
- **Runtime**: unknown
- **Package Manager**: npm (`npm install`)


## Verified API Routes (3 total)
- `GET /server/routes/agents` → agents.js
- `GET /server/routes/settings` → settings.js
- `GET /server/routes/auth` → auth.js


## Verified Environment Variables (3 total)
- `NODE_ENV`
- `PORT`
- `DATA_DIR`

## Verification Protocol
1. **Imports**: Every import MUST resolve to a real module in node_modules or the project
2. **APIs**: Every API call MUST match a verified route above
3. **Types**: Every type MUST exist in the codebase — no invented interfaces
4. **Packages**: Every package MUST be in package.json — use `npm install` to add new ones
5. **Functions**: Every function call MUST reference an existing function


## When Uncertain
Say: "I couldn't verify [X] exists. Should I create it or check the codebase?"
NEVER silently invent something.

## Response Protocol
See MANDATORY RESPONSE PROTOCOL at the top of this file — badge + task tracking required on every response.

---
<!-- vibecheck:context-engine:v2 -->
## Response Protocol
See MANDATORY RESPONSE PROTOCOL at the top of this file — badge + task tracking required on every response.

---
<!-- vibecheck:context-engine:v2 -->
## Response Protocol
See MANDATORY RESPONSE PROTOCOL at the top of this file — badge + task tracking required on every response.

---
<!-- vibecheck:context-engine:v2 -->