# PinchPad Roadmap

## Current Status (v1.0.0-prototype)
- [x] Initialized NPM environment.
- [x] Secured API keys in `.env.local`.
- [x] Added Docker support.
- [x] Initial Architecture Blueprint.

## 🦞 Phase 1: Refining the Shell (Q1 2026) - [COMPLETE]
- [x] **Refactor App.tsx:** Separated monolithic component into modular pages and components.
- [x] **State Management:** Formalized Auth Context and Note Context.
- [x] **Enhanced UI:** Moved to specialized component files for better maintenance.
- [x] **Dashboard Overhaul:** Implemented full-screen Sidebar + Main architecture (mirroring ClawChives).

## 🔒 Phase 2: Strengthening the Pot (Q2 2026)
- [ ] **Pearl Full-Screen View:** Dedicated `/notes/:id` route for viewing and editing individual pearls in full-screen mode.
- [ ] **Pearl Inline Expand:** Card expansion in-place (no navigation) with quick star/pin/delete actions for rapid note management.
- [ ] **Multi-Device Sync:** Secure syncing of `hu-` keys across browsers.
- [ ] **Rich-Text Support:** Implement secure rich-text editing in the pot.
- [ ] **Attachment Support:** Encrypted file attachments.

## 🤖 Phase 3: Agent Evolution (Q3 2026)
- [ ] **Granular Permissions:** More fine-grained `lb-` key permissions.
- [ ] **Usage Quotas:** Rate limiting and quotas per Agent key.
- [ ] **Agent Marketplace Interface:** Template keys for popular AI frameworks.

## 🚢 Phase 4: Production Readiness (Q4 2026)
- [ ] **Unit Tests:** Rigorous testing of crypto functions.
- [ ] **Security Audit:** Community-driven security review of ClawKeys/ShellCryption.
- [ ] **Full Deployment Docs:** One-click deployment strategies.




----

1. Add a new API endpoint to `/api/keys` that allows fetching ClawKey details for the authenticated user. This endpoint should be protected by `requireAuth` and `requirePermission('canRead')`. It should return the `id`, `name`, `expiration_type`, and `created_at` fields for each active ClawKey belonging to the user.

2. Implement the ability to edit existing ClawKey details. Create a new API route `PUT /api/agents/:id` that accepts `name`, `permissions`, `expiration_type`, and `expiration_date` in the request body. This route should be protected by `requireAuth` and `requirePermission('canEdit')`. It should update the corresponding ClawKey in the database and return the updated record. Ensure that sensitive fields like the `api_key` are not returned.

3. In the `Agents` component, add a loading state that is displayed while the `agentService.getAll` call is in progress. Show a skeleton loader or a simple 'Loading lobsters...' message to provide better UX.

4. Enhance the ClawKey creation form in the `Agents` component. Add fields for `expiration_type` (e.g., dropdown with 'never', 'one-time', 'daily', 'monthly') and `expiration_date` (if 'one-time' is selected). Also, include an optional field for `rate_limit`.

5. Integrate a toast notification system to provide user feedback for actions like creating, revoking, or updating ClawKeys. Display success messages (e.g., 'Lobster key created successfully') and error messages (e.g., 'Failed to revoke key').

6. Implement the functionality to edit existing notes. When a note is selected, populate the input fields with its title and content, and allow the user to update it.

7. Add a delete button for each note. When clicked, it should prompt the user for confirmation before deleting the note via the API.

- [DONE] 8. Enhance the UI for the notes list. Currently, notes are displayed as plain divs. Refactor them to use a more visually appealing card-like structure with a subtle hover effect.

- [DONE] 9. When fetching notes or performing create/update/delete operations, display a loading indicator to provide feedback to the user.

- [DONE] 10. When there are no notes, display a clear message indicating that the vault is empty and prompt the user to create a new note.

- [DONE] 11. In the 'Notes' component, add a placeholder 'Note Title' to the title input field.

- [DONE] 12. In the 'Notes' component, add a placeholder 'Write your secure note here...' to the content textarea.

- [DONE] 13. In the 'Notes' component, implement the 'New Note' button to clear the title and content fields and reset the editing state.

- [DONE] 14. In the 'Notes' component, add a 'Clear' button next to the 'Save Note' button that clears the title and content fields.

- [DONE] 15. In the 'Notes' component, add a confirmation dialog before deleting a note when the trash icon is clicked.

----

GEMINI's Suggestions

To keep the PinchPad habitat truly sovereign and "Hard-Shelled," here are a
  few ways we can molt the codebase into a higher security tier:


  1. 🦞 The Lobster Trap (Hash the Agent Keys)
  Right now, the lb- (Lobster) keys for your agents are stored plaintext in the
  lobster_keys table.
   * The Risk: If someone steals your clawstack.db, they can steal your agents'
     identities.
   * The Hardening: We should only store the SHA-256 hash of the lb- key. When
     an agent calls the API, we hash their provided key and compare it. This
     ensures even the DB owner can't "impersonate" an agent.


  2. 🛡️ The Lead Shell (Argon2 Identity Hashing)
  The user's hu- key hash is currently generated using a simple SHA-256.
   * The Risk: If the DB is leaked, an attacker could attempt a massive
     GPU-accelerated brute-force attack against that hash.
   * The Hardening: We should use a memory-hard KDF (like Argon2 or at least
     Bcrypt) for the server-side key_hash. This makes offline attacks
     computationally expensive.


  3. 🐚 Encrypted Metadata
  Currently, the title and content of your notes are encrypted, but the Note ID,
  Created Date, and Lobster Key names are plaintext.
   * The Risk: Metadata leakage. An observer can see when you write and how many
     notes you have.
   * The Hardening: We could encrypt the names of your Lobster Keys and even
     "pad" the ciphertext of your notes so an attacker can't guess the content
     length.


  4. 🗜️ The Pincer Grip (Session Binding)
  Currently, an api- token can be used from any device once stolen.
   * The Hardening: We can bind the session token to the User-Agent or a unique
     Client Fingerprint. If the token is used from a different browser, the
     "Pincer Grip" fails and the session is immediately declawed.


  5. 🌊 Secure Key Molting (Key Rotation)
  A feature to "Molt" your identity.
   * The Feature: It would allow you to provide your old hu- key and a new one.
     The browser would decrypt everything in the Pot and re-encrypt it with the
     new shell in one atomic operation.


  Which of these "Crusty" upgrades should we tackle first? I'd recommend
  starting with #1 (Hashing Lobster Keys), as it's a critical missing piece of
  the Zero-Knowledge promise. 🦞🛡️
