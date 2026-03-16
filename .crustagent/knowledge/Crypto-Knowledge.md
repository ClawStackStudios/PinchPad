Ready for review
Select text to add comments on the plan
PinchPad©™ — Fix: crypto.subtle Unavailable on LAN HTTP (Mirror ClawChives Pattern)
Why This Is Happening — Root Cause Deep Dive
The Web Crypto Spec
window.crypto.subtle (SubtleCrypto API) is gated behind Secure Contexts by the W3C spec:

"A feature is a Secure Context if the current environment is either HTTPS, localhost (127.0.0.1/::1), or explicitly isolated via COOP+COEP headers."

When the Docker container is accessed via http://192.168.1.6:8282 (plain HTTP, LAN IP), the browser marks the page as not a Secure Context:

window.isSecureContext === false
window.crossOriginIsolated === false
window.crypto.subtle === undefined ← crash source
window.crypto.getRandomValues() however is always available — it does not require a Secure Context. This is why key/UUID generation works, but hashing fails.

The Error Chain
User clicks "Create ClawKey"
  → authService.ts: hashToken(huKey)         ← calls src/lib/crypto.ts:19
  → crypto.ts: window.crypto.subtle.digest() ← window.crypto.subtle = undefined
  → TypeError: Cannot read properties of undefined (reading 'digest')
  → ClawKey creation crashes
The ShellCryption Problem (Secondary)
src/lib/shellCryption.ts also uses crypto.subtle for AES-256-GCM:

crypto.subtle.importKey() — in deriveShellKey()
crypto.subtle.deriveKey() — in deriveShellKey()
crypto.subtle.encrypt() — in encryptField()
crypto.subtle.decrypt() — in decryptField()
These are called on every note read/write. Unlike hashing (which has a pure-JS fallback), there is no safe fallback for encryption — you cannot implement AES-256-GCM in plain JS without a trusted cryptographic library. Attempting to do so would silently corrupt the zero-knowledge guarantee.

The correct approach for ShellCryption: detect the insecure context and show a warning, blocking note operations until the user accesses over HTTPS or localhost.

The CORS Problem (Tertiary)
server.ts:27: origin: process.env.CORS_ORIGIN || 'http://localhost:8282'

When accessed over a LAN IP without CORS_ORIGIN set, every API call gets CORS-rejected because the request origin is http://192.168.1.6:8282 but CORS only allows http://localhost:8282. This is a secondary failure that surfaces after the crypto error is fixed.

Why COEP/COOP Headers Are NOT the Fix
One approach is to enable Cross-Origin-Opener-Policy: same-origin + Cross-Origin-Embedder-Policy: require-corp headers. This makes crossOriginIsolated = true which restores crypto.subtle on non-HTTPS. However, ClawChives explicitly disables these headers in their helmet config:

crossOriginEmbedderPolicy: false,
crossOriginOpenerPolicy: false,
Why? COEP require-corp blocks any cross-origin resource (images, fonts, iframes) that doesn't send a Cross-Origin-Resource-Policy header. For a self-hosted LAN app, this would break external resources and is too restrictive. ClawChives chose the JS fallback approach instead, which we will mirror.

The Fix: Mirror ClawChives Pattern Exactly
1. src/lib/crypto.ts — Guard hashToken() + add fallbackSha256()
Current (broken):

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);  // ← crashes on LAN HTTP
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
Fix (copy ClawChives pattern exactly):

Add the fallbackSha256() pure-JS SHA-256 implementation (copied verbatim from CC's crypto.ts lines 98-167)
Guard hashToken() with if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest)
Fall through to fallbackSha256(token) if SubtleCrypto unavailable
Use crypto.subtle (not window.crypto.subtle) for broader compatibility
Also guard generateBase62() — it already uses window.crypto.getRandomValues which is safe, but change window.crypto.getRandomValues → crypto.getRandomValues for consistency.

2. server.ts — Fix Helmet COEP/COOP + Fix CORS default
Current Helmet (line 22-24):

app.use(helmet({
  contentSecurityPolicy: false,
}));
Fix (mirror ClawChives):

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,      // Don't restrict cross-origin resources
  crossOriginResourcePolicy: false,       // Don't restrict cross-origin resource loading
  crossOriginOpenerPolicy: false,         // Don't isolate — let crypto.subtle use JS fallback
  originAgentCluster: false,              // Don't force origin-keyed clusters (console warning)
}));
This also fixes the browser console warning:

The page requested an origin-keyed agent cluster using the Origin-Agent-Cluster header...

Current CORS (line 26-29):

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8282',
  credentials: true,
}));
Fix (open to all private LAN IPs by default, mirror ClawChives corsConfig philosophy):

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : true,  // 'true' = mirror request origin — allows any LAN IP
  credentials: true,
}));
When CORS_ORIGIN is unset, true tells the cors middleware to reflect the Origin header back — effectively allowing any origin. This is the LAN self-hosted philosophy: don't force the user to configure anything for basic LAN access. When CORS_ORIGIN is explicitly set, only those origins are allowed (security).

3. src/lib/shellCryption.ts — Add Secure Context guard with clear error
Add this at the top of the file (before any function):

export function isShellCryptionAvailable(): boolean {
  return typeof crypto !== 'undefined' && crypto.subtle != null;
}
In deriveShellKey(), add guard at the top:

export async function deriveShellKey(huKey: string, userUuid: string): Promise<CryptoKey> {
  if (!isShellCryptionAvailable()) {
    throw new Error('ShellCryption requires a Secure Context (HTTPS or localhost). Notes are unavailable over plain HTTP LAN access. Use HTTPS or access via localhost.');
  }
  // ... rest of existing function unchanged
}
This causes any note operation to throw a clear error instead of crashing silently. The UI already has try/catch around note operations so this will display gracefully.

Critical Files to Modify
File	Change
src/lib/crypto.ts	Add fallbackSha256() + guard hashToken() + use crypto not window.crypto
server.ts	Disable COEP/COOP/CORP/OriginAgentCluster in Helmet + fix CORS default to true
src/lib/shellCryption.ts	Add isShellCryptionAvailable() guard + throw descriptive error in deriveShellKey()
Do NOT modify:

src/services/authService.ts — uses hashToken() which will be fixed
src/services/noteService.ts — uses deriveShellKey() which will now throw clearly
src/services/agentService.ts — uses hashToken() which will be fixed
Any test files — server-side tests are unaffected
After the Fix: What Works vs. What Requires HTTPS
Feature	Plain HTTP LAN	HTTPS or localhost
Register (ClawKey creation)	✅ Works (fallbackSha256)	✅ Works (SubtleCrypto)
Login (hash + token exchange)	✅ Works (fallbackSha256)	✅ Works (SubtleCrypto)
Create / Revoke LobsterKey	✅ Works	✅ Works
Agent API calls	✅ Works	✅ Works
View note list	✅ Works (no crypto needed for listing)	✅ Works
Read / Write encrypted notes	❌ ShellCryption requires SubtleCrypto	✅ Works
This matches the expected zero-knowledge security model: encrypted data cannot be processed without a Secure Context. The app does not silently fail — it surfaces a clear error.

Truthpack Updates After Fix
Update truthpack/security.json:

Note: crypto.subtle guarded with fallbackSha256 for non-secure contexts
Note: ShellCryption (AES-256-GCM) requires Secure Context; throws descriptive error on plain HTTP
Update truthpack/env.json:

CORS_ORIGIN: now defaults to true (mirror request origin) when unset — works for any LAN IP without configuration. Set to restrict.
Update truthpack/blueprint.json:

Note: crossOriginIsolated headers are intentionally disabled (COEP/COOP/CORP = false)
Verification Steps
Rebuild Docker: docker compose -f docker-compose.dev.yml up --build
Access from LAN IP: http://192.168.1.6:8282
Open DevTools Console → check: no more COOP/OriginAgentCluster warning
Create a ClawKey → should succeed without crypto.subtle error
Login with the key → should succeed
Try to create/read a note → should fail with a descriptive error (ShellCryption unavailable)
Access via http://localhost:8282 → note creation should work fully
Run npm test — all 140 tests must still pass (server-side only, unaffected)
No console errors on CORS for LAN IP access (verify Network tab)
Maintained by CrustAgent©™