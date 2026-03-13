# 🦞 PinchPad©™ - Project Knowledge

This document stores detailed context, memories, and known operational quirks of PinchPad to ensure CrustAgent maintains continuous context across sessions.

## 🛠️ Project State & Context
- **Version:** 1.0.0 (Prototype status)
- **Primary Objective:** Build a secure note-taking platform with agentic delegation using minimal dependencies and maximum aesthetic fidelity (Dark Mode, High Contrast).
- **Recent Infrastructure Events:** The project underwent a full codebase audit and integration of CrustAgent patterns to enforce strict architectural controls.
- **Deployment Strategy:** Local bare metal via `npm run dev`, and Containerized via `docker-compose`. 

## ⚠️ Known Quirks & Pitfalls
1. **SQLite Compilation**: `better-sqlite3` is highly native. Watch for architecture mismatches between host OS and Docker environment (arm64 vs amd64).
2. **Web Crypto Contexts**: `window.crypto` requires a secure context. Ensure localhost or HTTPS.
3. **Session State**: `sessionStorage` manages local state for API access. Full page refreshes or tab closures will wipe state by design, encouraging re-authorization via `hu-` keys.

## 🌊 The Reef's Future (Roadmap Hooks)
- Potential enhancement of `LobsterKeys©™` Agent token permissions.
- Further expansion of the `MoltTheme` aesthetics across the app using `framer-motion` and `lucide-react`.
- Expanding the test coverage. Future test suites should utilize tools like `vitest` for the Vite ecosystem.

*This file is maintained and updated dynamically by CrustAgent as the project evolves.*
