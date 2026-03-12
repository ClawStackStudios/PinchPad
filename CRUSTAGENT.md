# CRUSTAGENT.md

## Project State
- **Version:** 1.0.0
- **Docker Status:** Ready
- **Active Features:**
  - ClawKeys©™ Auth System (Implemented)
  - ShellCryption©™ (Implemented)
  - Secure Vault (Implemented)
  - Lobster Keys Agent Management (Implemented)

## Active Feature Map
- **Auth:** Complete. `hu-` keys generated client-side, hashed via SHA-256, verified constant-time.
- **Notes/Vault:** Complete. Uses ShellCryption to encrypt `title` and `content` fields.
- **Agents:** Complete. Generates `lb-` keys and stores permissions.

## Known Pitfalls
- `better-sqlite3` must be built for the correct architecture.
- Web Crypto API requires a secure context (HTTPS or localhost).
- `sessionStorage` is used for `api-` tokens, so tokens are cleared on tab close.

## Session Log
- 2026-03-12 | gemini-3.1-pro-preview | Initialized Full-Stack App with ClawKeys and ShellCryption | Success
