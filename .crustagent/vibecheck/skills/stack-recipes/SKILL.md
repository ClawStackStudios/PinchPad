# Sovereign Stack Recipes

This skill contains verified "Stability Locks" for the ShellPlate codebase. Follow these patterns strictly to maintain CrustCode©™ standards and prevent codebase sprawl.

## 🧪 Testing Patterns (Vitest)
- **Vertical Audit**: Colocate as `*.test.ts` next to the implementation.
- **Backend**: Use `supertest` for route testing. Mock `authMiddleware.requireAuth` for isolation.
- **Frontend**: Use `vitest` + `jsdom`. Mock API calls using `vi.mock`.

## 🎨 UI & Components (Tailwind)
- **Architecture**: Keep components in `src/features/[feature]/components`.
- **Styling**: Vanilla Tailwind utility classes only. Avoid `index.css` for component styling.
- **Conditional Classes**: Use the `cn()` utility (`src/lib/utils.ts`) for all conditional logic.
- **Transparency**: Leverage `backdrop-blur` and `bg-opacity` for the Lobsterized/Glassmorphism look.

## 🛤️ API & Routing (Express)
- **Service Layer**: Keep business logic in `server/services/`. Routes should only handle req/res.
- **Security**: Always wrap `requireAuth` for non-public endpoints.
- **Error Handling**: Use the global error handler. Return `{ error: "msg" }` on failure.
- **Contracts**: All new endpoints must be added to the `.crustagent/vibecheck/truthpack/routes.json` file.

## 💾 Database (SQLite)
- **Raw SQL**: Prefer prepared statements using `better-sqlite3`.
- **Migrations**: Update `server/database.js` for any schema changes.
- **Backups**: Verified by `scuttle-db-backup` scuttle-skill.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->