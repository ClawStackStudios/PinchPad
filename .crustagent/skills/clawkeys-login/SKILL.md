---
name: clawkeys-login-flow©™
description: The standard Lobsterized©™ ClawKeys©™ login flow. Upload or paste your identity key — no passwords, no accounts, just your claw.
---

# ClawKeys©™ Login Skill — Re-entering the Ocean

## 🏗️ Flow Overview

Login is a dual-mode single-screen flow. The user presents their identity file OR pastes their raw cryptographic key, and the session is restored. No password. No account lookup by email. The key IS the identity.

---

## 🎨 Unified Login Form Design

This login experience uses a **unified form component** that maintains consistent structure and layout across all ClawStack applications while supporting **theme-aware color randomization**.

### Form Structure (EXACT - Consistent across all apps)

The login form follows this precise structure:

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Home                                         │ ← Small back button
│                                                         │
│              🦞                                         │ ← Lobster logo
│         (in gradient box)                               │
│                                                         │
│         Welcome Back                                    │
│         Login with your ClawChives©™ identity           │
│                                                         │
│  [Upload File] | [Paste ClawKey©™]                     │ ← Tab toggle
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Click to upload your identity file               │ │ ← File area / Paste area
│  │  .json files only                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ⚠️  Can't find your identity file?                   │
│  Your identity file is the only way to access...       │
│                                                         │
│  [🔑 Login with Identity File]                        │ ← Primary button
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Theme Color System

Each application defines **three core colors** that are applied consistently:

| Variable | Purpose | ClawStack Example |
|----------|---------|------------------|
| **PRIMARY_COLOR** | Container border, tab active, button gradient | cyan |
| **ACCENT_COLOR** | Logo gradient box, shadows | red |
| **WARNING_COLOR** | Security warning box, alert colors | amber |

The AI implementation **decides these colors based on the application's overall theme palette**, ensuring visual cohesion.

**For ClawStack Studios (Ocean + Coral theme):**
- PRIMARY_COLOR = `cyan` → Border, tabs, main button
- ACCENT_COLOR = `red` → Logo gradient box
- WARNING_COLOR = `amber` → Warning box

**Implementation allows other themes to randomize:**
- PRIMARY_COLOR could be: blue, teal, green, cyan
- ACCENT_COLOR could be: red, crimson, purple, orange
- WARNING_COLOR could be: amber, orange, yellow, lime

### Element Breakdown

**Back Button (Top-Left):**
- Small, outlined style
- ArrowLeft icon + "Back to Home" text
- Navigates to `/`
- Minimal styling (no filled background)

**Logo Section (Centered):**
- 🦞 Emoji inside a gradient box
- Gradient: `from-{ACCENT_COLOR}-500 to-{ACCENT_COLOR}-600`
- Rounded-2xl, shadow with accent color
- Title: "Welcome Back"
- Subtitle: "Login with your ClawChives©™ identity"

**Tab Toggle (Upload | Paste):**
- Two buttons in a flex container
- Border-radius and border styling
- Active tab: PRIMARY_COLOR background + white text
- Inactive tab: light gray background
- No visual divider between tabs

**Upload Mode Content:**
- File input (hidden, triggered by label click)
- Drag-drop area with dashed border
- Hover state: PRIMARY_COLOR border + light background
- Icon + text: "Click to upload your identity file"
- Subtext: ".json files only"

**Paste Mode Content:**
- Textarea for raw hu-key input
- Real-time validation feedback
- Display: "✓ Valid" (green) or "✗ Invalid" (red)

**Security Warning Box:**
- Background: WARNING_COLOR light tint
- Border: WARNING_COLOR medium tint
- Lock icon in WARNING_COLOR
- Title: "Can't find your identity file?"
- Explanation text

**Primary Login Button:**
- Full width
- Gradient: `from-{PRIMARY_COLOR}-600 to-{PRIMARY_COLOR}-700`
- Hover state: darker gradient
- Key icon + action text
- Smooth shadow with PRIMARY_COLOR

---

### Color Application Example

```typescript
// For ClawStack Studios:
const theme = {
  primary: 'cyan',    // border-2 border-cyan-500
  accent: 'red',      // from-red-500 to-red-600
  warning: 'amber',   // bg-amber-50 border-amber-200
}

// Applied to JSX:
<div className="border-2 border-cyan-500">
  <div className="bg-gradient-to-br from-red-500 to-red-600">🦞</div>
  <button className="bg-cyan-600">Upload File (active tab)</button>
  <div className="bg-amber-50 border-amber-200">⚠️ Warning</div>
  <button className="from-cyan-600 to-cyan-700">Login with Key</button>
</div>
```

---

## 🏗️ Flow Overview

Login is a dual-mode single-screen flow. The user presents their identity file OR pastes their raw cryptographic key, and the session is restored. No password. No account lookup by email. The key IS the identity.

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                    CLAWCHIVES©™ LOGIN SCREEN                        │
  └─────────────────────────────────────────────────────────────────────┘

  DUAL-MODE IMPLEMENTATION:

  ┌──────────────────────────────────────────┐
  │     Login with ClawKey©™                 │
  │                                          │
  │  TWO ACTION BUTTONS (no username field): │
  │                                          │
  │  [Upload ClawKey]                        │
  │  ↓ Opens file browser, accepts .json    │
  │                                          │
  │  [Paste ClawKey]                         │
  │  ↓ Opens textarea for raw hu-key paste  │
  │                                          │
  │  [Back to Reef] ← navigate home          │
  └──────────────────────────────────────────┘

  UPLOAD PATH:
            │
            │ on "Upload ClawKey" → file selected
            ▼
  ┌──────────────────────────┐
  │ FileReader.readAsText()  │
  │ JSON.parse()             │
  │ validateIdentityFile()   │
  │ Extract: uuid, username  │
  └──────────┬───────────────┘
             │ valid
             ▼
  ┌──────────────────────────┐
  │ hashToken(identity.token)│
  │ → SHA-256(hu-key) hex    │
  └──────────┬───────────────┘
             │
             ├──► POST /api/auth/token
             │    { type:"human", uuid, keyHash }
             │
             ▼
  sessionStorage.setItem(×4) + login context
             │
             ▼
        Landing Page

  PASTE PATH:
            │
            │ on "Paste ClawKey" → textarea shown
            ▼
  ┌──────────────────────────┐
  │ User pastes hu-[64chars] │
  │ Real-time validation:    │
  │  - starts with "hu-"     │
  │  - exactly 67 chars      │
  │ ✓ Valid or ✗ error shown │
  └──────────┬───────────────┘
             │ valid format
             ▼
  ┌──────────────────────────┐
  │ hashToken(pasted_key)    │
  │ → SHA-256(hu-key) hex    │
  └──────────┬───────────────┘
             │
             ├──► POST /api/auth/lookup
             │    { keyHash } ← get uuid + username
             │
             ├──► POST /api/auth/token
             │    { type:"human", uuid, keyHash }
             │
             ▼
  sessionStorage.setItem(×4) + login context
             │
             ▼
        Landing Page
```

**Key Difference:** Upload extracts uuid/username from JSON. Paste requires `/api/auth/lookup` endpoint to resolve uuid from keyHash.

---

## 📋 Pre-Login Checklist

These conditions must be true before login can succeed:

- [ ] API server is running and reachable at the configured URL (`getApiBaseUrl()` resolves correctly)
- [ ] `GET /api/health` returns `200 OK`
- [ ] No active session already exists in `sessionStorage` (if `cc_api_token` is set, the app should redirect to the dashboard, not show the login screen)
- [ ] User has their identity file (`clawchives_identity_{username}.json`) available on disk or clipboard
- [ ] The identity file was generated by ClawChives©™ and has NOT been manually edited (malformed JSON will fail `validateIdentityFile()`)
- [ ] The `uuid` in the identity file is registered in the server's `users` table (i.e., the account exists — setup was previously completed)
- [ ] Browser supports `crypto.subtle.digest()` (required for SHA-256 hashing; available on all HTTPS origins and localhost)

---

## 🔑 Step-by-Step: The Login

### Step 1 — File Selection

**What the user sees:**
- A drop zone / file upload area labeled for `.json` files
- "Login with Identity File" button — **disabled** until a file is selected
- No username or password fields

**What the code does:**
- Renders a file input (or styled drop zone) accepting `application/json` / `.json`
- On file selection via drag-and-drop OR click-to-browse:
  - Stores the `File` object in component state (`selectedFile`)
  - Displays the filename as confirmation (e.g., `clawchives_identity_alice.json selected`)
  - Enables the "Login with Identity File" button

**State changes:**
- `selectedFile` — the browser `File` object
- Login button enabled state changes from `disabled` to `active`

---

### Step 2 — File Parse and Validation

**Triggered by:** User clicking "Login with Identity File"

**What the code does:**
```typescript
// 1. Read the file
const text = await readFileAsText(selectedFile)  // FileReader.readAsText()

// 2. Parse JSON
const parsed = JSON.parse(text)

// 3. Validate structure
const identity = validateIdentityFile(parsed)
// throws if: missing fields, wrong types, token doesn't start with "hu-"
```

**`validateIdentityFile()` checks:**
- `identity.token` exists and is a `string`
- `identity.token` starts with `"hu-"`
- `identity.token` has length of exactly 67 (`"hu-"` + 64 chars)
- `identity.uuid` exists and is a non-empty `string`
- `identity.username` exists and is a non-empty `string`

**On validation failure:**
- Error message displayed in the UI (e.g., "Invalid identity file — please select a ClawChives©™ identity file")
- `selectedFile` remains set; user can try again without re-selecting
- No API calls are made

---

### Step 3 — Key Hashing

**What the code does (immediately after successful validation):**
```typescript
const keyHash = await hashToken(identity.token)
// hashToken: SHA-256(hu-key) → hex string
// identity.token (raw hu- key) is NEVER sent to server
```

**The raw `identity.token` (`hu-` key) is used exactly once** — as input to `hashToken()`. After hashing, it is not stored, not logged, and not referenced again in the login flow.

---

### Step 4 — Token Exchange

**What the code does:**
```typescript
const response = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type:    "human",
    uuid:    identity.uuid,
    keyHash: keyHash
  })
})

const { token } = await response.json()
```

On success:
```typescript
sessionStorage.setItem("cc_api_token",  token)
sessionStorage.setItem("cc_username",   identity.username)
sessionStorage.setItem("cc_user_uuid",  identity.uuid)
sessionStorage.setItem("cc_key_type",   "human")

onSuccess(identity.uuid)  // triggers navigation to dashboard
```

---

## 🔐 Cryptographic Operations

### `validateIdentityFile(parsed: unknown): IdentityFile`

```typescript
// Location: src/components/auth/LoginForm.tsx (or src/lib/crypto.ts)

interface IdentityFile {
  username:  string
  uuid:      string
  token:     string    // raw hu-[64chars] key
  createdAt: string
}

function validateIdentityFile(parsed: unknown): IdentityFile {
  if (typeof parsed !== "object" || parsed === null) throw new Error("Not an object")
  const { username, uuid, token, createdAt } = parsed as Record<string, unknown>

  if (typeof token !== "string")           throw new Error("token must be a string")
  if (!token.startsWith("hu-"))            throw new Error("token must start with hu-")
  if (token.length !== 67)                 throw new Error("token must be 67 characters")
  if (typeof uuid !== "string" || !uuid)   throw new Error("uuid is required")
  if (typeof username !== "string" || !username) throw new Error("username is required")

  return { username, uuid, token, createdAt: String(createdAt ?? "") }
}
```

### `hashToken(token: string): Promise<string>`

```typescript
// Location: src/lib/crypto.ts

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}
// Input:  "hu-aB3xK9mZ2pQ7rT1wYn..." (67 chars)
// Output: "e3b0c44298fc1c149afb..." (64 hex chars = 256 bits)
```

### Full Crypto Flow During Login

```
  Browser (Client)                          Server
  ────────────────                          ──────

  identity.token = "hu-[64chars]"
  (read from identity file — stays in RAM)
        │
        ▼
  hashToken(identity.token)
  → crypto.subtle.digest("SHA-256", ...)
        │
        ▼
  keyHash = "e3b0c44..." (hex, 64 chars)
        │
        ├──── POST /api/auth/token ──────────► looks up user by uuid
        │     { type:"human",                  retrieves stored keyHash
        │       uuid: "3f4a2b1c-...",          timingSafeEqual(
        │       keyHash: "e3b0c44..." }           incoming keyHash,
        │                                          stored keyHash
        │                                       ) → true
        │                                       generates api-[32chars]
        │                                       INSERT INTO api_tokens
        │◄─── { token: "api-[32chars]" } ───────
        │
        ▼
  sessionStorage.setItem(×4)
  → onSuccess(uuid)
  → Dashboard rendered
```

**Security note:** Server uses constant-time comparison for `keyHash` verification. Timing attacks that attempt to infer whether a hash is correct by measuring response latency are mitigated at the server level.

---

## ⚙️ Session State Written

On successful token exchange, four keys are written to `sessionStorage`:

| Key              | Value                          | Description                                         |
|------------------|--------------------------------|-----------------------------------------------------|
| `cc_api_token`   | `"api-[32chars]"`              | Bearer token for all subsequent authenticated API calls |
| `cc_username`    | `"alice"` (from identity file) | Display name for UI personalization                 |
| `cc_user_uuid`   | `"3f4a2b1c-..."`              | User UUID; used for client-side identity tracking   |
| `cc_key_type`    | `"human"`                      | Key type; gates human-only UI features (e.g., r.jina.ai controls) |

**Lifecycle:** `sessionStorage` is tab-scoped. All four keys are cleared automatically when the browser tab is closed. A page refresh also clears session. Users must log in again after any session loss — this is expected and intentional behavior.

**`cc_key_type` significance:** Components check `cc_key_type === "human"` to conditionally render features unavailable to agent (`lb-`) sessions. Login always writes `"human"` here. Agent sessions are established via a separate flow and write `"lobster"` or `"agent"`.

---

## 🔌 API Call Made

One API call is made during login. It uses `getApiBaseUrl()` from `src/config/apiConfig.ts`.

### POST /api/auth/token

```
POST {apiBase}/api/auth/token
Content-Type: application/json

Request Body:
{
  "type":    "human",
  "uuid":    "3f4a2b1c-dead-beef-cafe-0123456789ab",
  "keyHash": "e3b0c44298fc1c149afb4c8996fb92427ae41e4649b934ca495991b7852b855"
}

Success Response — 200 OK:
{
  "token": "api-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
}

Error Responses:
  401 Unauthorized  → keyHash does not match stored hash (constant-time comparison failed)
  404 Not Found     → UUID does not exist in users table (account never registered)
  400 Bad Request   → Missing or malformed type, uuid, or keyHash fields
  429 Too Many Requests → Rate limit exceeded (planned: security component 02)
  500 Internal      → Server error
```

**This endpoint does NOT require a bearer token.** It is one of only two public endpoints (`/api/auth/register` and `/api/auth/token`). All other endpoints require `Authorization: Bearer api-[32chars]`.

---

## ✅ Implemented Features

### Dual-Mode Login: Upload + Paste ClawKey

**Status: IMPLEMENTED**

The login form now presents two distinct action buttons with no username field:

```
[Upload ClawKey]  ← file browser for .json identity files
[Paste ClawKey]   ← textarea for raw hu-[64chars] keys
[Back to Reef]    ← navigate home
```

**Upload Mode Behavior:**
- File browser accepts `.json` files only
- Reads file, parses JSON, validates structure via `validateIdentityFile()`
- Extracts `uuid`, `username` from identity file
- Hashes token via `hashToken()` → SHA-256 hex
- POSTs `/api/auth/token` with `{ type:"human", uuid, keyHash }`
- On success: writes sessionStorage, redirects to landing page

**Paste Mode Behavior:**
- Textarea for raw key input
- Real-time validation as user types:
  - Must start with `"hu-"`
  - Must be exactly 67 characters total (`"hu-"` + 64)
  - Visual feedback: ✓ Valid or ✗ errors shown
- On submission (requires valid format):
  1. Hash key via `hashToken()` → SHA-256 hex
  2. POST `/api/auth/lookup` with `{ keyHash }` to get `{ uuid, username }`
  3. POST `/api/auth/token` with `{ type:"human", uuid, keyHash }`
  4. On success: writes sessionStorage, redirects to landing page

**Key Architectural Decision:**
The paste flow requires server-side UUID resolution via a lookup endpoint (`/api/auth/lookup`). This endpoint accepts a keyHash and returns `{ uuid, username, exists: boolean }`. Rate-limiting recommended to prevent enumeration attacks.

**Implementation location:** `src/features/auth/components/LoginForm.tsx`

---

## ☠️ Known Failure Modes

### Wrong Identity File
- **Trigger:** User uploads a JSON file that is not a ClawChives©™ identity file (e.g., a bookmark export, a settings file, or a different app's JSON)
- **Symptom:** `validateIdentityFile()` throws; error message displayed to user
- **Recovery:** Upload the correct `clawchives_identity_{username}.json` file

### Expired or Revoked Session Token (api- token)
- **Note:** The identity file contains the `hu-` key (root credential), not an `api-` token. The `api-` token is issued fresh on every login. There is no "expired identity file" — only an expired session (which simply requires re-login using the same identity file).

### Server Down or Unreachable
- **Trigger:** `POST /api/auth/token` throws a network error or times out
- **Symptom:** Login button spins indefinitely or shows a generic network error
- **Recovery:** Verify API server is running, check Docker logs, ensure `VITE_API_URL` resolves correctly for the current environment
- **Critical Check:** `getApiBaseUrl()` in `src/config/apiConfig.ts` — production builds use relative paths; dev uses `http://localhost:4242`

### Account Does Not Exist (Wrong Server)
- **Trigger:** The UUID in the identity file does not exist in the server's `users` table (e.g., user is pointing at a different ClawChives©™ instance, or the data volume was reset)
- **Symptom:** `POST /api/auth/token` returns `404 Not Found`
- **Recovery:** Run setup again on this server instance (creates a new account) — or locate the correct server data volume
- **Note:** This is distinct from a wrong key — a 404 means the uuid isn't registered, not that the key is incorrect

### keyHash Mismatch (Wrong Key File / Tampered File)
- **Trigger:** The `token` in the uploaded file does not hash to the stored `keyHash` on the server — either the file was manually edited, corrupted, or this is a different user's key file
- **Symptom:** `POST /api/auth/token` returns `401 Unauthorized`
- **Recovery:** Locate the original, unmodified identity file

### Lost Identity File — The Terminal Failure
- **Trigger:** User cannot find their `clawchives_identity_{username}.json` file anywhere
- **Outcome:** **Account is permanently inaccessible.** There is no password reset. There is no recovery email. The `hu-` key cannot be reconstructed from the server (only its SHA-256 hash is stored).
- **Prevention:** Keep at least two copies of the identity file in separate secure locations (password manager + encrypted external drive recommended)
- **Server-Side Reality:** The server has `{ uuid, username, keyHash }` — but `keyHash` is a one-way hash. The original `hu-` key cannot be derived from it. Even a server administrator cannot recover the account without the original key.

### Browser Crypto API Unavailable
- **Trigger:** `crypto.subtle.digest()` is undefined (non-HTTPS context in a strict browser, or a very old browser)
- **Symptom:** `hashToken()` throws immediately; login fails before any network call
- **Recovery:** Access ClawChives©™ over HTTPS. Local dev at `http://localhost` is always permitted by browsers.

### IndexedDB Version Conflict (Edge Case)
- **Trigger:** Client-side IndexedDB schema version has changed between sessions (e.g., after an app upgrade)
- **Symptom:** Dashboard fails to load after login; IndexedDB errors in browser console
- **Recovery:** Open browser DevTools → Application → Storage → IndexedDB → Delete the ClawChives©™ database → Refresh → Log in again. Client-side data is re-synced from the server.

---

## 🦞 Lobster Wisdom

*"A lobster does not ask the ocean to remember its password. It returns to the same rock, presents its shell, and the sea knows it by its form alone. Your identity file is that shell — carry it as a lobster carries its molt: close, private, and irreplaceable. The ocean has no recovery desk. The claw that unlocks your burrow was grown by you alone."*

---

*This SKILL.md is part of the ClawChives©™ CrustAgent©™ skill library. Update this document whenever LoginForm.tsx, validateIdentityFile(), or the /api/auth/token endpoint contract is modified.*
