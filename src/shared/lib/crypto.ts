/**
 * Cryptographic utilities for key generation and file handling
 */

/** Uses Web Crypto's secure RNG to build a URL-safe alphanumeric string without modulo bias */
export function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const result = new Array(length);
  const maxUint8 = 256;
  const limit = maxUint8 - (maxUint8 % chars.length); // 256 - (256 % 62) = 248
  const randomValues = new Uint8Array(1);

  for (let i = 0; i < length; i++) {
    let r: number;
    do {
      crypto.getRandomValues(randomValues);
      r = randomValues[0];
    } while (r >= limit); // Reject values that would cause modulo bias
    result[i] = chars[r % chars.length];
  }

  return result.join("");
}

/** Identity key for human users: `hu-<64 chars>` */
export function generateHumanKey(): string {
  return `hu-${generateRandomString(64)}`;
}

/** Identity key for agents: `lb-<64 chars>` */
export function generateAgentKey(): string {
  return `lb-${generateRandomString(64)}`;
}

/** REST API key: `api-<32 chars>` */
export function generateApiKey(): string {
  return `api-${generateRandomString(32)}`;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for non-secure HTTP contexts (e.g., local Unraid deployments)
  // crypto.getRandomValues is available even when crypto.randomUUID is absent.
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Set version (4) and variant (10) for UUIDv4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // 🛡️ Sentinel Security Fix: Removed insecure Math.random() fallback.
  // Predictable UUIDs can lead to ID guessing and collision attacks.
  // Application must fail securely if a cryptographically secure PRNG is unavailable.
  throw new Error("Secure random number generation is not supported in this environment. Please use a secure context (HTTPS).");
}

// ─── Identity File ────────────────────────────────────────────────────────────

/** The data embedded in a downloaded identity key file */
export interface IdentityData {
  username: string;
  uuid: string;
  token: string;       // The hu-* key — this IS the secret credential
  createdAt: string;
}

/**
 * Validates that a parsed object looks like a valid IdentityData file.
 * Returns an array of field names that are missing or invalid.
 */
export function validateIdentityFile(data: unknown): string[] {
  if (!data || typeof data !== "object") return ["file is not a valid JSON object"];
  const d = data as Record<string, unknown>;
  const missing: string[] = [];
  if (typeof d.username !== "string" || !d.username) missing.push("username");
  if (typeof d.uuid !== "string" || !d.uuid) missing.push("uuid");
  if (typeof d.token !== "string" || !d.token.startsWith("hu-")) missing.push("token (must start with hu-)");
  return missing;
}

/** Downloads a JSON identity file to the user's device */
export function downloadIdentityFile(data: IdentityData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pinchpad_identity_${data.username}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

// ─── Token Hashing ────────────────────────────────────────────────────────────

const mathPow = Math.pow;
const maxWord = mathPow(2, 32);

function fallbackSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  let i, j;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 2;
  function isPrime(n: number) {
    for (let factor = 2; factor <= Math.sqrt(n); factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  }
  const getFractionalBits = (n: number) => ((n - Math.floor(n)) * maxWord) | 0;
  let k_idx = 0;
  while (k_idx < 64) {
    if (isPrime(primeCounter)) {
      hash[k_idx] = getFractionalBits(mathPow(primeCounter, 1 / 2));
      k[k_idx] = getFractionalBits(mathPow(primeCounter, 1 / 3));
      k_idx++;
    }
    primeCounter++;
  }
  ascii += '\x80';
  while (ascii.length % 64 !== 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);
  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Hashes a token using SHA-256 for secure storage in IndexedDB.
 * This prevents plaintext tokens from being readable if browser storage is compromised.
 *
 * @param token - The plaintext token (e.g., "hu-abc123...")
 * @returns Promise resolving to hex-encoded hash string
 */
export async function hashToken(token: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Fallback for non-secure HTTP contexts
  return fallbackSha256(token);
}

/**
 * Verifies a plaintext token against a stored hash using constant-time comparison.
 * This prevents timing attacks during authentication.
 *
 * @param plaintextToken - The token to verify (from user's identity file)
 * @param storedHash - The hash stored in IndexedDB
 * @returns Promise resolving to true if token matches
 */
export async function verifyToken(plaintextToken: string, storedHash: string): Promise<boolean> {
  const computedHash = await hashToken(plaintextToken);

  // Constant-time string comparison to prevent timing attacks
  if (computedHash.length !== storedHash.length) return false;

  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }

  return result === 0;
}

// ─── AES-256-GCM Encryption ──────────────────────────────────────────────────

/**
 * AES-256-GCM encryption using Web Crypto API
 * Password is derived via PBKDF2 with random salt
 */
export async function encryptData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const keyMaterial = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['encrypt']);
  const dataBytes = encoder.encode(data);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBytes
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * AES-256-GCM decryption using Web Crypto API
 */
export async function decryptData(encrypted: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const keyMaterial = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  const key = await crypto.subtle.importKey('raw', keyMaterial, 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return decoder.decode(plaintext);
}