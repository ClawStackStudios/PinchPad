export function generateBase62(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomBuffer = new Uint8Array(1);

  while (result.length < length) {
    crypto.getRandomValues(randomBuffer);
    const val = randomBuffer[0];
    if (val < 248) { // 256 - (256 % 62) = 248
      result += charset[val % 62];
    }
  }
  return result;
}

// ─── Token Hashing ────────────────────────────────────────────────────────

const mathPow = Math.pow;
const maxWord = mathPow(2, 32);

/**
 * Pure-JavaScript SHA-256 implementation (fallback for non-Secure Contexts).
 * Used when crypto.subtle is unavailable (e.g., HTTP on LAN IPs).
 *
 * This is a reference implementation; in production, prefer crypto.subtle.digest().
 * Ported from: https://geraintluff.github.io/sha256/
 */
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
 * Hashes a token using SHA-256.
 * Uses Web Crypto API (crypto.subtle) in Secure Contexts (HTTPS or localhost).
 * Falls back to pure-JS implementation on plain HTTP (e.g., LAN IPs).
 *
 * @param token - The plaintext token (e.g., "hu-abc123...")
 * @returns Promise resolving to hex-encoded hash string
 */
export async function hashToken(token: string): Promise<string> {
  // Try Web Crypto API first (faster, hardware-accelerated if available)
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // If SubtleCrypto fails for any reason, fall through to JS fallback
      console.warn('[Crypto] SubtleCrypto.digest failed, using fallback SHA-256:', e);
    }
  }

  // Fallback for non-Secure Contexts (plain HTTP on LAN IPs, etc.)
  return fallbackSha256(token);
}

export function downloadIdentityFile(username: string, uuid: string, token: string) {
  const identity = {
    username,
    uuid,
    token,
    createdAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(identity, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pinchpad_identity_${username}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
