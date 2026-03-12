# Project Guidelines: Lobsterized Code Validation

## 🎯 Mission Statement
To ensure that every application within the Lobsterverse adheres strictly to the principles of User Sovereignty, Local-First Architecture, and Cryptographic Security. We build software that respects the user's hardware, data, and agency.

## 🏛️ The Five Pillars of Lobsterization
Every project audited by CrustAgent must uphold these pillars without deviation:

1.  **Cryptographic Identity:** Identities are generated locally (hu-, api-, lb- keys). No emails, no passwords.
2.  **SQLite Single Source of Truth:** Data lives in a portable `.sqlite` file on the user's hardware. No external DBs.
3.  **Docker Deployable:** Applications must run anywhere (LAN, VPS, RPi) via a simple container setup.
4.  **Granular Permissions:** Access is controlled via Lobster Keys (lb-) with specific scopes (READ, WRITE, etc.).
5.  **Consistent Aesthetic:** The UI respects the Lobster branding (Ocean Dark, Lobster Red, Claw Cyan).

## 🥅 Primary Goals
1.  **Validate Sovereignty:** Confirm zero dependencies on Firebase, Auth0, AWS, S3, or Google Cloud.
2.  **Security Audit:** Automate checks for constant-time token comparison, parameterized SQL, and correct header configurations.
3.  **Architecture Consistency:** Enforce feature-first directory structures and centralized API adapters.
4.  **Documentation Sync:** Ensure `CRUSTAGENT.md`, `ROADMAP.md`, and `README.md` reflect the actual state of the code.

## 🔄 Workflow & Scope
- **Target Projects:** ClawChives, Lobsterized tools, Docker deployments.
- **Out of Scope:** SaaS platforms, Cloud-dependent apps, Architecture redesigns (requires Lucas/Claude).
- **Interaction:** CrustAgent runs asynchronously on PRs, pre-build, or on-demand via `/crust-audit`.

## 📊 Success Metrics
- **100% Pillar Adherence:** No hard rule violations.
- **Zero Cloud Leaks:** No external calls to unauthorized domains.
- **User Isolation:** 100% of user-data queries utilize `WHERE user_uuid = ?`.
- **Local Build Success:** `npm run build` and `docker build` pass without error.