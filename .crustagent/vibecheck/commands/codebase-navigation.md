# Codebase Navigation Skill 🦞🗺️

## Project Map
### Structure: Feature-Based Sovereign Cluster
The project is decoupled into a React frontend and an Express/SQLite backend.

**Top-level directories:**
- `.crustagent/`: The brain—skills, memories, rules, vibes, and truthpack.
- `src/`: Core logic.
  - `src/server/`: The backend Burrow (Routes, DB, Middleware).
  - `src/pages/`: Feature-clustered UI pages.
  - `src/components/`: Modular building blocks.
- `data/`: SQLite storage (ClawStack.db).
- `scripts/`: Dev-hardening and verification tools.

### API Entry Points (src/server/routes/)
The following are the verified routes anchored in `routes.json`:
- `/api/auth/` -> `auth.ts` (Identity hashing and session tokens)
- `/api/notes/` -> `notes.ts` (Sovereign note management)
- `/api/agents/` -> `agents.ts` (Lobster Key orchestration)

### Key Configuration
- **Package Manager**: `npm` (Lockfile: `package-lock.json`)
- **Frontend Stack**: Vite + React + TSX + Tailwind CSS 4
- **Backend Stack**: Node.js + Express + better-sqlite3
- **Security**: ShellCryption©™ + ClawKeys©™ Protocol

---
*Maintained by CrustAgent©™*
<!-- vibecheck:context-engine:v3 -->