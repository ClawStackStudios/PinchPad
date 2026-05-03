# 🛡️ CRUSTSECURITY.md - PinchPad©™ Security Manifest

**Maintained by CrustAgent©™**

This document outlines the security invariants, threat models, and cryptographic protocols that form the "Hardened Shell" of **PinchPad©™**. In this burrow, sovereignty is not a feature; it is the foundation.

---

## 🔒 The Three Claws of Sovereignty

### 1. ClawKeys©™ Identity Protocol (`hu-`)
PinchPad does not use traditional passwords. Identity is anchored to a **ClawKey©™**:
- **Format**: `hu-` prefixed Ed25519-derived identifier.
- **Generation**: Created entirely client-side during the initial "Hatch" (setup).
- **Persistence**: Stored in the browser's secure `localStorage`. It never leaves the client in a way that allows impersonation.
- **Invariant**: No central authority holds your identity key. If you lose your ClawKey©™, you lose access to the Burrow.

### 2. ShellCryption©™ Zero-Knowledge Storage
Every "Pearl" (note) is encrypted before it ever touches the disk:
- **Algorithm**: AES-256-GCM (Authenticated Encryption).
- **Key Derivation**: Keys are derived from your identity and a user-provided passphrase using PBKDF2 (100,000 iterations).
- **Zero-Knowledge**: The server stores only the encrypted ciphertext and the authentication tag. The server has **zero** capability to decrypt your pearls.

### 3. LobsterKeys©™ Agent Delegation (`lb-`)
For autonomous agents and external integrations, we use **LobsterKeys©™**:
- **Format**: `lb-` prefixed random entropy tokens.
- **Granularity**: Keys are scoped to specific "Pots" (folders) or read-only access.
- **Revocation**: Any LobsterKey can be instantly crushed (revoked) from the Dashboard without affecting your main identity.

---

## 🏗️ Architectural Invariants

- **User Isolation**: Every database query is strictly filtered by `user_uuid`. No cross-contamination of burrows is physically possible at the schema layer.
- **HardShell Auth**: The middleware stack (`requireAuth` -> `requirePermission`) is immutable. Access is denied by default; permission must be explicitly granted.
- **Token Ephemerality**: Session tokens (`api-`) have a strict 24-hour TTL and are stored only in memory or transient storage.
- **Sovereign Export**: Archival exports (PDF, HTML, MD) are "hatched" client-side. This ensures that decrypted data is only ever visible to the sovereign user in their own browser environment.

---

## 🌪️ Threat Model & Mitigations

| Threat | Mitigation | Status |
| :--- | :--- | :--- |
| **Server Compromise** | Zero-Knowledge ShellCryption©™ ensures the attacker only gets useless ciphertext. | ✅ Active |
| **Brute Force** | Rate limiting on all `/api/auth` endpoints and high PBKDF2 iterations. | ✅ Active |
| **SQL Injection** | Exclusive use of `better-sqlite3` parameterized queries. No string concatenation. | ✅ Active |
| **XSS / Data Leak** | Strict Content Security Policy (CSP) and `dompurify` on all rendered markdown. | ✅ Active |
| **Identity Theft** | ClawKeys©™ are physically tied to the device's storage. | ✅ Active |

---

## ⚓ The Sovereign Commitment
PinchPad©™ is built for the long molt. We prioritize the safety of your thoughts over the convenience of our features. If a feature compromises the shell, it does not belong in the burrow.

**Stay Clawed. Stay Sovereign.** 🦞⚓🌊
