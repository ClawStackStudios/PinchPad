---
name: clawkeys-setup-flow©™
description: The standard Lobsterized©™ ClawKeys©™ account creation and identity hatching flow. From landing page to dashboard — zero passwords, full sovereignty.
---

# ClawKeys©™ Setup Skill — Identity Hatching

## 🎨 UI Design System Note

This skill uses the **unified ClawStack login form design** for the final flow (Step 4 → Login). The login form employs **consistent structure with theme-aware colors** across all applications. For ClawStack Studios:

- **PRIMARY_COLOR** = cyan (borders, buttons, tabs)
- **ACCENT_COLOR** = red (logo gradient)
- **WARNING_COLOR** = amber (warnings)

See `clawkeys-login` skill for complete login form documentation.

---

## 🏗️ Flow Overview

The setup wizard is a 4-step linear flow. No passwords. No cloud accounts. The user hatches their identity from cryptographic randomness.

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                    CLAWCHIVES©™ SETUP WIZARD                        │
  └─────────────────────────────────────────────────────────────────────┘

  [STEP 1: welcome]          [STEP 2: profile]        [STEP 3: generating]
  ┌───────────────┐          ┌───────────────┐         ┌───────────────┐
  │ Before we     │          │ Username      │         │               │
  │ begin...      │          │ ┌───────────┐ │   800ms │   ⟳ Hatching  │
  │               │          │ │           │ │  spinner │     Identity  │
  │ • No password │  ──────► │ └───────────┘ │ ──────► │               │
  │ • Key file    │ "Get     │               │         │  generateHu-  │
  │   is identity │  Started"│ Display Name  │         │  manKey()     │
  │ • Store safe  │          │ ┌───────────┐ │         │  generateUUID │
  │               │          │ │ (optional)│ │         │  ()           │
  │ [Get Started] │          │ └───────────┘ │         └───────┬───────┘
  └───────────────┘          │               │                 │
                             │ [Generate Key]│                 │ auto-advance
                             └───────────────┘                 ▼

  [STEP 4: complete]
  ┌──────────────────────────────────────────┐
  │  Identity Hatched!                       │
  │                                          │
  │  Username:  alice                        │
  │  Key:       hu-aB3xK9mZ2pQ7rT1... (...) │
  │  UUID:      3f4a2b1c-...                 │
  │                                          │
  │  [Copy ClawKey]                          │
  │  [Download Identity File]  ← MANDATORY   │
  │                                          │
  │  [Complete Setup] ← disabled until       │
  │                    hasDownloaded = true  │
  │  [Back to Reef] ← navigate home          │
  └──────────────────────────────────────────┘
            │
            │ on "Complete Setup"
            ▼
  ┌──────────────────────────┐     ┌──────────────────────────┐
  │ POST /api/auth/register  │     │ POST /api/auth/token     │
  │ { uuid, username,        │────►│ { type:"human", uuid,    │
  │   keyHash }              │     │   keyHash }              │
  └──────────────────────────┘     └──────────┬───────────────┘
                                              │
                                              ▼
                                   sessionStorage.setItem(×4)
                                              │
                                              ▼
                                        Dashboard
```

---

## 📋 Pre-Hatch Checklist

These conditions must be true before setup can succeed:

- [ ] API server is running and reachable at the configured URL (`getApiBaseUrl()` resolves correctly)
- [ ] `GET /api/health` returns `200 OK` (API is healthy)
- [ ] No existing session is active in `sessionStorage` (`cc_api_token` is absent)
- [ ] Target username is not already registered on the server (uniqueness enforced at `POST /api/auth/register`)
- [ ] Browser supports `crypto.getRandomValues()` (all modern browsers; required for key generation)
- [ ] Browser supports `crypto.subtle.digest()` (required for SHA-256 hashing)
- [ ] User is prepared to **download and securely store** the identity file — losing it means losing the account permanently
- [ ] `navigator.clipboard` available (for planned Copy ClawKey feature; not blocking current implementation)

---

## 🪪 Step-by-Step: The Hatching

### Step 1 — Welcome

**What the user sees:**
- Heading: "Before we begin..."
- Bulleted explanation of the ClawKeys©™ identity model:
  - No password required
  - A key file IS the identity
  - Key file must be stored safely — losing it locks you out permanently
- Single button: "Get Started"

**What the code does:**
- Renders static informational content
- No state mutations, no API calls, no crypto

**State at entry:** `step = "welcome"`, all other state is initial/empty

**Buttons:**
- `[Get Started]` → sets `step = "profile"`
- `[Back to Reef]` → navigates to landing page (`/`)

---

### Step 2 — Profile

**What the user sees:**
- Username input (required, text field)
- Display Name input (optional, text field)
- Button: "Generate Key" (enabled only when username is non-empty)

**What the code does:**
- Controlled input: `username` state updated on every keystroke
- Controlled input: `displayName` state updated on every keystroke
- "Generate Key" button is disabled when `username.trim() === ""`

**State at entry:** `step = "profile"`, `username = ""`, `displayName = ""`

**State changes on input:** `setUsername(value)`, `setDisplayName(value)`

**On "Generate Key" click:**
1. Sets `step = "generating"` → immediately renders spinner
2. After 800ms timeout, executes crypto operations (see Cryptographic Operations section)
3. On completion, sets `step = "complete"`

**Buttons:** `[Generate Key]` (disabled if username empty) → triggers generating phase

---

### Step 3 — Generating

**What the user sees:**
- Spinner / loading animation
- Text: "Hatching your identity..." (or similar)
- No interactive elements — user cannot navigate away or interact

**What the code does (within the 800ms window):**
```typescript
// Both operations run during the 800ms spinner delay
const key  = generateHumanKey()  // 64 Base-62 chars prefixed with "hu-"
const uuid = generateUUID()       // crypto.randomUUID() → RFC-4122 v4

setGeneratedKey(key)
setGeneratedUUID(uuid)
```

**State changes:**
- `generatedKey` — the raw `hu-[64chars]` string
- `generatedUUID` — the RFC-4122 v4 UUID string

**Duration:** Exactly 800ms (hardcoded `setTimeout`)

**Auto-advances to:** `step = "complete"` (no user input required)

---

### Step 4 — Complete

**What the user sees:**
- "Identity Hatched!" confirmation heading
- Username display (the value entered in Step 2)
- Key preview: first 20 characters of the raw key followed by `…` (e.g., `hu-aB3xK9mZ2pQ7rT1wYn…`)
- UUID display (full UUID string)
- **Download Identity File** button — always visible, always enabled
- **Complete Setup** button — **disabled** until `hasDownloaded = true`

**What the code does on Download:**
1. Constructs the identity file object (see Identity File Format section)
2. Serializes to JSON string
3. Creates a `Blob` with `type: "application/json"`
4. Creates an object URL via `URL.createObjectURL(blob)`
5. Programmatically clicks an `<a>` element with `download="clawchives_identity_{username}.json"`
6. Sets `hasDownloaded = true` → enables "Complete Setup" button

**State:**
- `hasDownloaded` — boolean gate; `false` until download triggered
- Read state used: `generatedKey`, `generatedUUID`, `username`, `displayName`

**On "Complete Setup" click (requires `hasDownloaded = true`):**
See API Calls Made section for the full sequence.

**Buttons:**
- `[Download Identity File]` — always enabled on this step
- `[ ] PLANNED: [Copy ClawKey]` — not yet implemented (see Planned Additions)
- `[Complete Setup]` — disabled until `hasDownloaded = true`

---

## 🔐 Cryptographic Operations

All cryptography runs **client-side only**. The raw `hu-` key is **never transmitted** to the server.

### Key Generation — `generateHumanKey()`

```typescript
// Location: src/lib/crypto.ts

const BASE62_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const KEY_LENGTH = 64  // characters (not bytes)

function generateHumanKey(): string {
  const bytes = new Uint8Array(KEY_LENGTH)
  crypto.getRandomValues(bytes)                        // CSPRNG — browser native
  const chars = bytes.map(b => BASE62_CHARSET[b % 62]) // bias is negligible at 62 chars
  return "hu-" + String.fromCharCode(...chars)
}
// Result: "hu-" + 64 Base-62 characters = 67 total characters
// Entropy: ~381 bits (64 × log2(62) ≈ 381)
```

### UUID Generation — `generateUUID()`

```typescript
// Location: src/lib/crypto.ts

function generateUUID(): string {
  return crypto.randomUUID()  // RFC-4122 v4 UUID, browser native
}
// Result: "3f4a2b1c-dead-beef-cafe-0123456789ab"
```

### Key Hashing — `hashToken()`

```typescript
// Location: src/lib/crypto.ts

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)                          // UTF-8 encode
  const hashBuffer = await crypto.subtle.digest("SHA-256", data) // SHA-256
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("") // hex string
}
// Input:  "hu-aB3xK9mZ2pQ7rT1wYn..." (67 chars)
// Output: "e3b0c44298fc1c149afb..." (64 hex chars = 256 bits)
```

### Full Crypto Flow on "Complete Setup"

```
  Client                                          Server
  ──────                                          ──────

  generatedKey = "hu-[64chars]"
        │
        ▼
  hashToken(generatedKey)
        │
        ▼
  keyHash = SHA-256(hu-key) as hex string
        │
        ├──── POST /api/auth/register ──────────► stores { uuid, username, keyHash }
        │     { uuid, username, keyHash }
        │
        ├──── POST /api/auth/token ─────────────► validates keyHash (constant-time)
        │     { type: "human", uuid, keyHash }    generates api-token
        │                                         stores in api_tokens table
        │◄─── { token: "api-[32chars]" } ─────────
        │
        ▼
  sessionStorage.setItem(×4)
  onComplete(username, generatedKey)
        │
        ▼
      Dashboard

  NOTE: generatedKey (the raw hu- key) is ONLY used for:
    1. Displaying the key preview in Step 4 UI
    2. Writing into the downloaded identity file
    3. Passing to hashToken() — then discarded
  It is NEVER stored in sessionStorage, localStorage, or sent to any server.
```

---

## 📦 Identity File Format

The downloaded file is the user's **sole credential**. Losing it means losing the account.

### JSON Structure

```json
{
  "username": "alice",
  "uuid": "3f4a2b1c-dead-beef-cafe-0123456789ab",
  "token": "hu-aB3xK9mZ2pQ7rT1wYnXcVbNmLkJhGfDsApOiUeWqZrTyMnBvCxZlKjHgFdSaP",
  "createdAt": "2026-03-07T14:22:00.000Z"
}
```

### Field Descriptions

| Field       | Type        | Description                                                           |
|-------------|-------------|-----------------------------------------------------------------------|
| `username`  | `string`    | The username chosen during Step 2 of setup                            |
| `uuid`      | `string`    | RFC-4122 v4 UUID; the server-side user identifier                     |
| `token`     | `string`    | The raw `hu-[64chars]` key. This IS the identity. Guard it carefully. |
| `createdAt` | `string`    | ISO-8601 timestamp of when the identity was hatched                   |

### Filename Pattern

```
clawchives_identity_{username}.json
```

Example: `clawchives_identity_alice.json`

### Security Warnings

- The `token` field is the **plaintext `hu-` key**. Anyone who obtains this file can authenticate as the user.
- This file must be stored in a secure location (password manager, encrypted drive, offline backup).
- ClawChives©™ cannot recover a lost identity file. There is no password reset. There is no "forgot my key."
- Do not store this file in cloud sync folders (Dropbox, iCloud, Google Drive) unless the sync target is encrypted.

---

## ⚙️ Session State Written

On successful "Complete Setup", four keys are written to `sessionStorage`:

| Key              | Value                          | Description                                    |
|------------------|--------------------------------|------------------------------------------------|
| `cc_api_token`   | `"api-[32chars]"`              | Session bearer token for all subsequent API calls |
| `cc_username`    | `"alice"` (chosen username)    | Display name for UI personalization            |
| `cc_user_uuid`   | `"3f4a2b1c-..."`              | User UUID for client-side identity tracking    |
| `cc_key_type`    | `"human"`                      | Key type context; gates human-only UI features |

**Lifecycle:** All four keys are cleared when the browser tab is closed (`sessionStorage` is tab-scoped). Refreshing the page also clears session — this is expected behavior. Users must log in again via the login flow after any session loss.

---

## 🔌 API Calls Made

Two sequential API calls are made during "Complete Setup". Both use `getApiBaseUrl()` from `src/config/apiConfig.ts`.

### Call 1 — Register User

```
POST {apiBase}/api/auth/register
Content-Type: application/json

Request Body:
{
  "uuid":     "3f4a2b1c-dead-beef-cafe-0123456789ab",
  "username": "alice",
  "keyHash":  "e3b0c44298fc1c149afb4c8996fb92427ae41e4649b934ca495991b7852b855"
}

Success Response — 201 Created:
{
  "message": "User registered successfully"
}

Error Responses:
  409 Conflict      → Username or UUID already registered
  400 Bad Request   → Missing required fields
  500 Internal      → Server error (DB write failed)
```

### Call 2 — Issue Session Token

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
  401 Unauthorized  → keyHash does not match stored hash (constant-time comparison)
  404 Not Found     → UUID not found in users table
  400 Bad Request   → Missing type, uuid, or keyHash
```

**Token storage after Call 2:**
```typescript
sessionStorage.setItem("cc_api_token",  token)
sessionStorage.setItem("cc_username",   username)
sessionStorage.setItem("cc_user_uuid",  uuid)
sessionStorage.setItem("cc_key_type",   "human")
```

---

## ✅ Button Layout — Step 4 Complete

### Copy ClawKey Button

**Status: IMPLEMENTED**

The complete step displays two vertically-stacked action buttons above the "Complete Setup" button:

```
┌──────────────────────────────────────────┐
│  [Copy ClawKey]                          │
│  [Download Identity File]  ← MANDATORY   │
│                                          │
│  [Complete Setup] ← enabled after        │
│                    hasDownloaded = true  │
│  [Back to Reef]  ← navigate home         │
└──────────────────────────────────────────┘
```

**Copy ClawKey behavior:**
- `navigator.clipboard.writeText(generatedKey)` — copies the full raw `hu-[64chars]` string to clipboard
- Shows "Copied!" confirmation (2-second timeout before reverting to "Copy ClawKey")
- Does NOT fulfill the download requirement — `hasDownloaded` must still become `true`
- Two actions are independent (copy for convenience, download for security)

**Implementation location:** `src/features/auth/components/SetupWizardStep4Complete.tsx`

---

## ☠️ Known Failure Modes

### Username Already Taken
- **Trigger:** `POST /api/auth/register` returns `409 Conflict`
- **Symptom:** Setup completes client-side but server rejects the registration
- **Recovery:** User must restart the wizard and choose a different username
- **Note:** The identity file may have already been downloaded with the rejected UUID/key — this file is now orphaned. The user should discard it.

### Server Unreachable
- **Trigger:** `fetch()` throws a network error or `GET /api/health` times out
- **Symptom:** "Complete Setup" fails silently or shows a generic error
- **Recovery:** Verify API server is running, check `VITE_API_URL` in docker-compose, check CORS configuration
- **Critical Check:** Ensure `getApiBaseUrl()` is resolving to the correct origin — see `src/config/apiConfig.ts`

### Download Gate Not Cleared
- **Trigger:** User closes the download dialog without saving, or the browser silently blocks the download
- **Symptom:** "Complete Setup" button remains disabled; `hasDownloaded` never becomes `true`
- **Recovery:** Click "Download Identity File" again — a new download will be triggered (same key, same UUID, idempotent)
- **Note:** The identity file content is deterministic from the in-memory state — re-downloading produces the same file

### Browser Crypto API Unavailable
- **Trigger:** `crypto.getRandomValues` or `crypto.subtle.digest` are undefined (non-HTTPS context, very old browser)
- **Symptom:** Key generation throws an exception; wizard crashes
- **Recovery:** Access ClawChives©™ over HTTPS, or use a modern browser (Chrome 60+, Firefox 57+, Safari 11+)
- **Note:** Local dev at `http://localhost` is an exception — browsers grant crypto APIs to localhost origins

### Duplicate UUID Collision (Theoretical)
- **Trigger:** `crypto.randomUUID()` generates a UUID already in the database
- **Probability:** ~1 in 2^122 (practically impossible)
- **Recovery:** Server returns 409; user can retry (new UUID generated each wizard run)

---

## 🦞 Lobster Wisdom

*"A lobster does not hatch with a password — it hatches with claws. The shell is its credential, the claw is its key, and the ocean floor is its alone. Guard your identity file as a lobster guards its molt: expose it to no one, lose it to nothing, and carry it always in a place only the tide knows."*

---

*This SKILL.md is part of the ClawChives©™ CrustAgent©™ skill library. Update this document whenever SetupWizard.tsx or the auth registration flow is modified.*
