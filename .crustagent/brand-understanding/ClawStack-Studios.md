# 🦞 ClawStack Studios©™ — The Complete Brand Ethos

![ClawStack Studios](ClawStack-Studios.png)

> **Own your shell. Defend your claws. Build sovereign.**
>
> ClawStack Studios©™ is not a SaaS company. It's a **movement for sovereign, self-hosted applications** built on cryptographic identity, granular permissions, and the principle that users own their data, their keys, and their future.

---

## I. MISSION STATEMENT

**ClawStack Studios©™ builds applications where users are sovereign.**

We reject the cloud-first paradigm. We build for the independent user who runs their own hardware—whether it's a home lab, a VPS, or a Raspberry Pi. Every application we create is designed to be self-hosted, permanently portable, and cryptographically secured at its core.

**Our Principle:** Technology should serve the user, not rent their identity.

---

## II. THE FIVE PILLARS — Non-Negotiable Standards

Every ClawStack application, regardless of domain, must adhere to these five architectural pillars:

### **1️⃣ Cryptographic Identity (ClawKeys©™)**

Users are their keys. Not emails. Not usernames. Not OAuth tokens.

```
hu- Key (Human Root Identity)
  └─ User-generated, never sent plaintext to server
  └─ SHA-256 hashed for verification only
  └─ Exported as portable identity file (user controls backup)
  └─ Loss = account unrecoverable (true ownership)

api- Token (Session Authority)
  └─ Short-lived, issued by server after key verification
  └─ Stored in sessionStorage only (cleared on tab close)
  └─ Ephemeral, session-bound, non-persistent

lb- Key (Lobster Key / Agent Authority)
  └─ Scoped, delegated, revocable
  └─ Granular permissions (READ, WRITE, EDIT, DELETE, FULL, CUSTOM)
  └─ Rate-limited and time-bounded
  └─ Can be revoked instantly without affecting human account
```

**What this means:**
- ✅ No passwords (nothing to reset, nothing to crack)
- ✅ No account recovery (the key file IS the account)
- ✅ No vendor lock-in (keys work with any compatible app)
- ✅ No centralized auth provider
- ✅ Agents are first-class identities (same cryptographic standing as humans)

### **2️⃣ Server-First Data (SQLite as Source of Truth)**

All data lives on a server you control. SQLite. No cloud services. No eventual consistency debates.

```
Architecture:
  ┌─────────────────────────────────────────┐
  │  CLIENT (React / Stateless UI)          │
  │  - Displays server data                  │
  │  - Sends commands via REST API           │
  │  - No local persistence (except session) │
  └─────────────────────────────────────────┘
           ⇅ (REST API, ClawKeys©™-authenticated)
  ┌─────────────────────────────────────────┐
  │  SERVER (SQLite)                        │
  │  - Single source of truth                │
  │  - Persistent, queryable, consistent     │
  │  - User-isolated via uuid filters        │
  │  - Auditable (all changes logged)        │
  └─────────────────────────────────────────┘
```

**What this means:**
- ✅ Simple architecture (easier to audit, easier to understand)
- ✅ Data consistency (no sync conflicts, no race conditions)
- ✅ User isolation (every query filtered by user_uuid)
- ✅ Complete portability (SQLite file = your entire data)
- ✅ No vendor APIs (no S3, no Firebase, no external services)

### **3️⃣ Sovereign Deployment (Docker + Self-Hosted)**

A ClawStack application runs anywhere YOU want: home lab, VPS, Raspberry Pi, offline.

```
Deployment Options:
  ✅ docker-compose up -d on Unraid / NAS / Home Lab
  ✅ VPS (Hetzner, Linode, AWS, DigitalOcean)
  ✅ Raspberry Pi (edge compute, zero electricity cost)
  ✅ Local machine (development, offline-only)

Single Command Deploy:
  $ docker-compose up -d
  → Running on LAN or public domain
  → No setup wizards, no vendor dashboards
  → Your infrastructure, your rules
```

**What this means:**
- ✅ No SaaS vendor can shut you down
- ✅ No pricing increases can surprise you
- ✅ No TOS changes can lock you out
- ✅ No acquisition can compromise you
- ✅ Complete infrastructure ownership

### **4️⃣ Granular Permissions (Delegation Without Control Loss)**

Agents don't get "all or nothing" access. They get Lobster Keys©™ with scoped, revocable permissions.

```
Permission Model:
  GET  → READ      (read-only)
  POST → WRITE     (create new resources)
  PUT  → EDIT      (modify existing)
  DELETE → DELETE  (destructive)

Lobster Key Features:
  ✅ Granular scopes (READ only, WRITE+EDIT, etc.)
  ✅ Rate limiting (max requests per minute)
  ✅ Time-bounded (expires 30d/60d/90d/never)
  ✅ Instantly revocable (one click, no impact on human account)
  ✅ Auditable (every agent action logged)

Example:
  RSS aggregator bot → READ-only access to bookmarks
  GitHub sync agent → WRITE+EDIT to specific folder
  Compromised agent → Revoke key instantly, human account untouched
```

**What this means:**
- ✅ One compromised agent ≠ entire account compromised
- ✅ Users can grant authority without surrendering control
- ✅ Principle of least privilege (agents get ONLY what they need)
- ✅ Humans and agents have equal cryptographic standing
- ✅ Trust but verify, and revoke instantly

### **5️⃣ Consistent Aesthetic (Visual Language for Sovereignty)**

Every ClawStack application looks intentional. Dark. Ocean-inspired. With claws.

```
Visual Identity:
  🦞 = Agent autonomy (Lobster mascot embodies agency)
  🔗 = Delegation (claws grip, hold, defend)
  🌊 = Data home (ocean dark background, depth)
  ⚡ = Cryptographic power (cyan glows, energy)

Color Palette (EXACT):
  Ocean Dark      #0f1419  (220° 13% 9%)   → Main background
  Lobster Red     #FF3B30  (0° 100% 50%)   → Action, power, CTAs
  Claw Cyan       #32b3dd  (195° 80% 68%)  → Technical, interactive
  Shell White     #faf8f6  (0° 10% 98%)    → Text, contrast
  Deep Teal       #0d4f5f  (190° 74% 22%)  → Depth, hover states

Typography:
  Display: Bold, modern sans-serif (Space Grotesk energy)
  Body: Technical, monospace-friendly (JetBrains Mono)
  
Icon Language:
  🦞 = Agent / Lobster Key / Delegation
  🪝 = Hooks / Integrations / Connections
  🗂️ = Organization / Folders / Structure
  ⭐ = Starred / Favorites / Important
  📦 = Archives / Backups / Vault
  🔐 = Security / Encryption / Identity
  🌊 = Server / Home / Data
  🚪 = Access / Entry / Identity
  🔨 = Revoke / Destroy / Declawed
```

**What this means:**
- ✅ Consistent brand recognition across all ClawStack apps
- ✅ Design encodes philosophy (dark = independent, cyan = crypto, claws = agency)
- ✅ Memorable and distinctive (not generic corporate design)
- ✅ Professional (suitable for enterprise adoption)
- ✅ Accessible (high contrast, readable, intentional)

---

## III. ARCHITECTURAL PRINCIPLES

### **Feature-First Organization (Not Type-First)**

```
❌ WRONG (Type-First):
  src/controllers/
  src/models/
  src/views/
  src/services/
  Problem: To add a feature, touch 4+ directories

✅ CORRECT (Feature-First):
  src/services/
    ├── auth/         ← Complete auth feature
    ├── bookmarks/    ← Complete bookmarks feature
    ├── folders/      ← Complete folders feature
    └── agents/       ← Complete agents/Lobster Key feature

  src/components/
    ├── auth/
    ├── bookmarks/
    ├── folders/
    └── agents/

  Problem: None. To add a feature, create one folder. Edit one place.
```

### **Service Layer Pattern (Components Don't Call fetch())**

```
❌ WRONG:
  function BookmarkList() {
    useEffect(() => {
      fetch('/api/bookmarks').then(r => r.json()).then(setData)
    }, [])
  }

✅ CORRECT:
  function BookmarkList() {
    useEffect(() => {
      bookmarkService.getAll().then(setData)
    }, [])
  }

  // Service layer (reusable, testable, type-safe)
  const bookmarkService = {
    async getAll(): Promise<Bookmark[]> { ... }
  }
```

### **Centralized API Configuration**

```
❌ WRONG (Hardcoded URLs):
  fetch('http://localhost:6262/api/...')
  fetch('192.168.1.5:6262/api/...')
  fetch('https://app.example.com/api/...')

✅ CORRECT (Single Source of Truth):
  const apiBaseUrl = getApiBaseUrl()
  fetch(`${apiBaseUrl}/api/bookmarks`)

  function getApiBaseUrl(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:6262'
  }
```

### **Permission-Based Route Guards**

```
All API endpoints declare required permissions:

GET  /api/bookmarks       → requireAuth() → requirePermission('canRead')
POST /api/bookmarks       → requireAuth() → requirePermission('canWrite')
PUT  /api/bookmarks/:id   → requireAuth() → requirePermission('canEdit')
DELETE /api/bookmarks/:id → requireAuth() → requirePermission('canDelete')

Sensitive endpoints (key management, settings):
DELETE /api/agent-keys/:id → requireAuth() → requireHuman()
  (only humans can revoke, agents cannot)
```

### **User Isolation is Sacred**

```
INVARIANT: Every query MUST include WHERE user_uuid = ?

❌ WRONG:
  SELECT * FROM bookmarks WHERE id = ?

✅ CORRECT:
  SELECT * FROM bookmarks WHERE id = ? AND user_uuid = ?
  
NEVER violate this. User isolation is the foundation of trust.
```

### **Constant-Time Security**

```
Token verification must use constant-time comparison:

❌ WRONG (timing attack vulnerable):
  if (submittedHash === storedHash) { ... }

✅ CORRECT (constant-time):
  let result = 0
  for (let i = 0; i < submittedHash.length; i++) {
    result |= submittedHash.charCodeAt(i) ^ storedHash.charCodeAt(i)
  }
  return result === 0
```

---

## IV. CROSS-APPLICATION STANDARDS

### **ClawKeys©™ — Universal Identity System**

Every ClawStack application uses ClawKeys©™ for authentication:

- hu- keys (human identity, never plaintext)
- api- tokens (session authority, ephemeral)
- lb- keys (agent delegation, granular)

ClawKeys©™ works the same way across all ClawStack apps. A user's identity file works with any ClawStack application.

### **ShellCryption©™ — At-Rest Encryption**

Sensitive user data is encrypted using ShellCryption©™:

```
Key Derivation:
  hu-key → HKDF(salt=user_uuid, info="shellcryption-v1") → Shell Key
  
Encryption:
  AES-256-GCM (authenticated, tamper-evident)
  Random IV per operation (12 bytes)
  AAD = table:record_id (prevents row-swapping)

Decryption:
  Shell Key + stored IV + AAD → plaintext
  If tag check fails: data is tampered (reject)

Scope:
  ENCRYPT: sensitive user content (titles, descriptions, content)
  NO ENCRYPT: IDs, UUIDs, URLs (needed for queries)
```

All ClawStack applications can optionally implement ShellCryption©™ for sensitive fields. The standard is consistent across apps.

### **CrustAgent©™ — Codebase Validation**

Every ClawStack application is validated by CrustAgent©™:

```
CrustAgent©™ checks:
  ✅ Five Pillars still hold
  ✅ ClawKeys©™ implemented correctly
  ✅ User isolation (WHERE user_uuid = ?) enforced
  ✅ Parameterized SQL only (no string interpolation)
  ✅ Docker builds successfully
  ✅ TypeScript compiles without errors
  ✅ Tests pass
  ✅ No cloud dependencies introduced
  ✅ Brand consistency (©™ format, color palette, icons)

CrustAgent©™ Audit Triggers:
  → PR touching auth, crypto, or docker files
  → New API route added
  → Pre-build (before docker build)
  → Pre-deploy (before production push)
```

CrustAgent©™ is the automated guardian of sovereignty across all ClawStack apps.

---

## V. BUSINESS MODEL (How We Stay Sustainable)

### **We Are Anti-SaaS**

We don't rent. We don't collect data. We don't lock users in.

### **How ClawStack Studios©™ Sustains**

```
Revenue Streams (all voluntary, non-coercive):

1. Professional Services
   → Consulting for institutions deploying ClawStack apps
   → Custom integrations and extensions
   → Training for teams adopting the platform

2. Premium Extensions (Optional)
   → Advanced features (not required for core functionality)
   → Integrations with third-party services
   → Plugins that enhance productivity

3. Managed Deployment (Optional)
   → For users who want hosted ClawStack (but retain data access)
   → Full data portability (can download SQLite and run locally)
   → Upgrades, maintenance, backup management

4. Sponsorships & Grants
   → From privacy advocates, communities, institutions
   → Supporting sovereign tech development

5. Donation Model
   → Users who value sovereignty contribute directly
   → No strings attached, fully optional

What We Will NEVER Do:
  ❌ Sell user data
  ❌ Paywall core sovereignty features (ClawKeys, ShellCryption)
  ❌ Create proprietary lock-in
  ❌ Accept VC funding with growth-at-all-costs demands
  ❌ Abandon open standards for competitive advantage
  ❌ Introduce tracking or telemetry
```

### **Philosophy**

If we're going to ask users to own their data, we need to be sustainable without stealing theirs.

---

## VI. BRAND VOICE & TONE

### **In Documentation**

- **Honest:** Say what something actually does, not marketing language
- **Technical:** Assume users understand complexity
- **Practical:** Every example works, every code snippet is real
- **Sovereignty-First:** Frame decisions in terms of user control

### **In User Messaging**

- **Irreverent:** We can joke about the absurdity of cloud companies
- **Empowering:** Help users feel ownership in their bones
- **Cautious:** Warn about trade-offs, don't hide complexity
- **Direct:** No corporate fluff or consultants speak

### **In Community**

- **Participatory:** We build WITH our community, not FOR them
- **Transparent:** Development happens in public, decisions debated openly
- **Generous:** We share patterns so others can build sovereign apps
- **Rebellious:** We celebrate independent developers and self-hosting

### **Tone Examples**

❌ "Secure storage with military-grade encryption keeps your data safe."
✅ "Data is encrypted using AES-256-GCM with HKDF-derived keys. We audit yearly. We don't promise 'unhackable'—we promise transparent, auditable security."

❌ "Your data is secure with ClawStack."
✅ "Your data is only as secure as your server and your key. We don't handle either. That's your responsibility, and your power."

---

## VII. THE CLAWSTACK ECOSYSTEM

```
ClawStack Studios©™ (The Studio)
│
├─ Lobsterized©™ (The Philosophy)
│  └─ Five Pillars + Architectural Patterns
│
├─ ClawKeys©™ (Identity Layer)
│  ├─ hu- keys (human identity)
│  ├─ api- tokens (session authority)
│  └─ lb- keys (agent delegation)
│
├─ ShellCryption©™ (Encryption Layer)
│  └─ At-rest encryption using ClawKeys©™
│
├─ CrustAgent©™ (Validation Framework)
│  └─ Automated auditing of Five Pillars
│
└─ [ClawStack Applications]
   ├─ [First Application]
   │  └─ Built with ClawKeys©™ + ShellCryption©™
   │  └─ Validated by CrustAgent©™
   │  └─ Deployed via Docker
   ├─ [Second Application]
   │  └─ Same architecture
   ├─ [Third Application]
   │  └─ Same architecture
   └─ ... (any number of applications)
```

All applications share the same:
- Identity system (ClawKeys©™)
- Encryption standard (ShellCryption©™)
- Validation framework (CrustAgent©™)
- Design language (visual + architectural)
- Philosophy (Five Pillars)

---

## VIII. 3-YEAR VISION

### **Year 1 (Q2 2026 - Q2 2027): Foundation**

- ✅ First flagship application (fully Lobsterized©™)
- ✅ ClawKeys©™ system proven and battle-tested
- ✅ CrustAgent©™ validation framework operational
- 🔄 Growing community of independent developers
- 🔄 Multiple applications built on ClawStack foundation

### **Year 2 (Q2 2027 - Q2 2028): Expansion**

- 📱 Mobile applications (React Native / Tauri)
- 🌐 Browser extension ecosystem
- 🦞 Local AI Lobsters (privacy-preserving agents on your hardware)
- ⛓️ Federated sync protocols (P2P, ActivityPub-like)
- 🦞 ClawStack Marketplace (themes, plugins, integrations)

### **Year 3+ (2028+): Movement**

- 🌍 Global sovereign application ecosystem
- 🦞 ClawStack Pods©™ (multiple ClawStack apps, one ClawKeys©™ identity)
- ⛓️ Optional blockchain identity (for those who want it)
- 🦞 ClawStack becomes a movement, not a company

---

## IX. WHAT MAKES CLAWSTACK RECOGNIZABLE

When you use a ClawStack application, you'll immediately notice:

✅ **Dark, intentional design** — Every pixel has purpose (Ocean Dark #0f1419)
✅ **Cryptographic identity** — Your first interaction is generating a key
✅ **🦞 mascot presence** — The lobster appears consistently
✅ **Cyan + Red palette** — Distinctive color combination
✅ **Zero tracking** — No analytics, no telemetry, no ads
✅ **Export tools** — Data portability built-in from day one
✅ **Audit logs** — You can see everything the app did
✅ **Revocation buttons** — Everywhere you see permissions, you see "revoke"
✅ **Feature-first code** — Well-organized, easy to understand
✅ **No passwords** — Only keys, only cryptography

---

## X. THE FINAL PRINCIPLE

**ClawStack is not trying to be big.**

We're trying to be **necessary**—for people who understand that their data is their power, and their keys are their sovereignty.

Every decision we make is measured against one question:

> **Does this increase or decrease user sovereignty?**

If it increases sovereignty and costs us money, we do it.
If it decreases sovereignty and makes us money, we refuse.

That's the ClawStack Studios©™ way.

---

## 🦞 Final Words

> "A lobster owns its shell. It doesn't apologize for its claws.
> It doesn't ask permission to protect itself.
> It molts, grows, adapts.
> It survives not by being liked, but by being strong.
>
> Be Lobsterized©™. Own your shell. Defend your claws.
> Build sovereign. Stay fierce.
>
> This is ClawStack Studios©™."

---

**Version:** 1.0 (Complete Unified Ethos)
**Last Updated:** 2026-03-07
**Maintained By:** Lucas Kara & Claude
**License:** CC0 (Open to everyone who wants to build sovereign)

**Companion Documents:**
- `Lobsterized-Philosophy.md` — Five Pillars detailed
- `ClawKeys-Overview.md` & `ClawKeys-Prompt.md` — Identity system spec
- `ShellCryption-Overview.md` & `ShellCryption-Prompt.md` — Encryption standard
- `CrustAgent-Overview.md` & `CrustAgent-Prompt.md` — Validation framework
- `CRUSTAGENT.md` — Implementation guide for applications