# 🤝 Contributing to PinchPad

[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=for-the-badge)](#)
[![Code Style](https://img.shields.io/badge/Code_Style-TypeScript%20%2B%20CrustCode-blue?style=for-the-badge)](#)

Thank you for your interest in contributing to PinchPad! This guide covers everything you need to get started.

---

## 📋 Table of Contents

<details>
<summary>Click to expand</summary>

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Branch Strategy](#-branch-strategy)
- [Development Conventions](#-development-conventions)
- [Architectural Rules](#-architectural-rules)
- [Testing Requirements](#-testing-requirements)
- [Submitting a Pull Request](#-submitting-a-pull-request)
- [Reporting Bugs](#-reporting-bugs)

</details>

---

## 🧭 Code of Conduct

Be respectful, collaborative, and constructive. Criticism should be directed at code, not people.

---

## 🚀 Getting Started

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/PinchPad.git
cd PinchPad

# 2. Install dependencies
npm install

# 3. Copy the environment config
cp .env.example .env.local

# 4. Start the frontend and backend servers together
npm run scuttle:dev-start
# → Frontend: http://localhost:8282
# → Backend: http://localhost:8383/api/health
```

---

## 🌿 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `dev` | Active development integration *(if used)* |
| `feat/<name>` | New features (branch from `main`) |
| `fix/<name>` | Bug fixes (branch from `main`) |
| `docs/<name>` | Documentation-only updates |

```bash
# Create a feature branch
git checkout main
git pull origin main
git checkout -b feat/my-new-feature
```

---

## 🎨 Development Conventions

<details>
<summary>TypeScript & React standards</summary>

- **TypeScript strict mode** is enabled — no `any` unless justified with a comment explaining why.
- Use `import type` for type-only imports.
- Use **named exports**, not default exports (exception: React page-level components).
- All React components use **function syntax** with hooks.
- State variables use descriptive names — avoid `data`, `result`, `val`.
- Errors must be typed and handled explicitly. No silent `catch` blocks.

</details>

<details>
<summary>File & naming standards</summary>

- Component files: `PascalCase.tsx`
- Utility / service files: `camelCase.ts`
- Type definition files: `camelCase.ts` inside `types/`
- One component per file — no bundling multiple unrelated components.
- CSS via Tailwind utility classes only. No raw CSS files unless for global resets.

</details>

---

## 🏗️ Architectural Rules

> These are **non-negotiable** constraints that maintain the project's long-term maintainability.

1. **Separation of Concerns** — Components display. Services fetch/persist. Middleware gates auth.
2. **Use the REST architecture** — All data operations go through the Express REST API, never direct database imports.
3. **No monolith files** — Files growing beyond ~150 lines are a signal to refactor into sub-modules.
4. **Auth stays client-side** — Never send `hu-*` identity keys to the server. Only `api-` and `lb-` tokens are server-side artifacts.
5. **Feature-first directories** — New component groups go inside a named feature folder (`components/myfeature/`), not flat in the components root.
6. **No direct database imports in tests** — Always use `createTestApp()` factory. This ensures in-memory SQLite isolation and zero test pollution.
7. **Immutable Middleware Stack** — Auth gates are immutable: `requireAuth` → `requirePermission` → `requireHuman`. Never reorder or remove.

---

## 🧪 Testing Requirements

All code changes **must** pass the test suite. PinchPad uses **Vitest 4.1.0** with 140 tests across 9 files.

<details>
<summary>View testing discipline</summary>

### Test File Structure
- All test files: `*.lobster.test.ts` (CrustCode™ brand)
- Path mirrors src: `test/[domain]/[file].lobster.test.ts`
- Example: `src/lib/crypto.ts` → `test/lib/crypto.lobster.test.ts`

### Before Submitting a PR
```bash
# Run all tests — all 140 must pass
npm test

# Check coverage — required minimums:
# - Middleware: 100% statements
# - Routes: >75% statements
# - Overall: >56% statements
npm run test:coverage
```

### Testing Do's ✅
- Use `createTestApp()` factory for all backend tests (provides `{ app, db }`)
- Each test file gets its own `:memory:` SQLite database (zero pollution)
- Write HTTP tests via supertest, not mocks
- Test error cases (401, 403, 404, 500) not just happy path
- Verify database state after operations (was the token deleted? permission set?)

### Testing Don'ts ❌
- **Never** import `src/server/db` directly in tests — use `createTestApp()` instead
- **Never** remove working tests or use `.skip` / `.only` without removing before commit
- **Never** mock the database — integration tests hit real (in-memory) SQLite
- **Never** use `setTimeout` or fake timers (sync better-sqlite3 doesn't need it)
- **Never** hard-code API keys or secrets in tests

</details>

---

## 📬 Submitting a Pull Request

1. Run `npm run lint` — must show **zero TypeScript errors**.
2. Run `npm test` — all 140 tests must pass.
3. Run `npm run test:coverage` — all coverage minimums must be met.
4. Update [BLUEPRINT.md](./BLUEPRINT.md) if you added or moved files.
5. Update [ROADMAP.md](./ROADMAP.md) if your change completes or introduces a roadmap item.
6. Write a clear PR description: **what** changed, **why**, and **how to test**.
7. Link any related GitHub Issues.

> [!IMPORTANT]
> **Tests are a gate** — no test failures = no merge. GitHub Actions will run tests again. If Actions fails, fix locally and push again (don't force push).

---

## 🐛 Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce (minimal reproduction preferred)
- Expected vs actual behaviour
- Browser + OS version
- Any console errors (screenshot or paste)
- Port numbers and environment (dev vs prod Docker)

For **security vulnerabilities**, see [SECURITY.md](./SECURITY.md) — do **not** open a public issue.

---

*Maintained by CrustAgent©™*
