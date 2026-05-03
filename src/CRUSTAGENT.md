# 🦞 PinchPad©™ - Source Level CRUSTAGENT.md

This document serves as the MAIN locus for high-level **CrustCode©™** patterns, codebase knowledge, and stability locks for the source directory of **PinchPad©™**.

## 🦀 CrustCode©™ Patterns & Architecture Constraints
1. **Feature Separation**: The `/src` directory must enforce clean separation of concerns by feature (e.g., `features/auth`, `features/notes`). Monolithic files are strictly forbidden.
2. **Layout Architecture**: Maintain a full-screen **Sidebar + Main** structure for authenticated routes using `DashboardLayout`, `Sidebar`, and `AppHeader`. Pure architectural mirroring from ClawChives.
3. **React/Vite Paradigm**: Prioritize TSX/TS components. Leverage React 19's capabilities along with Vite's build optimizations.
4. **Tailwind Ecosystem**: Ensure usage of `@tailwindcss/vite` pattern for styling. Adhere to the `MoltTheme` for view transitions.

## 🔒 Source Stability Locks
- **Dashboard Integrity**: All authenticated Feature Pages (Notes, Settings, Agents) MUST be wrapped in `DashboardLayout`. 
- **PinchKeys©™ Authorization**: Client-side cryptography happens strictly within browser contexts. Do not offload `hu-` key generation to the server.
- **ShellCryption©™ Integrity**: AES-256-GCM is non-negotiable for `title` and `content` fields. Keys (`hk-`) must never be transmitted over the wire un-hashed.
- **SQLite Transactions**: Database actions must avoid race conditions. Given Node.js async nature and `better-sqlite3`'s synchronous API, ensure thread-safe wrapping where necessary.
- **Jewel Marker Protocol**: Attachments must be referenced using the `[*pearl-jewel*](UUID)` syntax. Absolute API URLs in content are legacy and should be scuttled.
- **Port Parity**: Maintain 8282 (UI) and 8383 (API) separation. Any change to these ports must be reflected in the Scuttle scripts and Vite proxy config.
- **Security Mirror**: CORS and Helmet logic MUST remain synchronized with ClawChives.

## 🧠 Codebase Topology
- `/src/components` - Shared, reusable aesthetic & layout elements.
- `/src/context` - React context providers (AuthContext, ThemeContext).
- `/src/features` - Modular domain logic (Auth, Notes, Agents).
- `/src/lib` - Utility functions, cryptographic helpers, and API wrappers.
- `/src/pages` - Top-level route components.
- `/src/services` - Abstractions for connecting to external/internal endpoints.

## 🚀 Knowledge Delegation
For granular feature specifics, audits, skills, or operational workflows, please refer to the files located inside `.crustagent/` at the root of the project.
