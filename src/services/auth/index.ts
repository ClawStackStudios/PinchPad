import { getApiBaseUrl } from '../../shared/lib/api';
import { apiFetch } from '../../shared/lib/apiFetch';
import { generateBase62, hashToken } from '../../shared/lib/crypto';

console.log('[CrustAgent] 🦞 Scuttling foundational imports for authService...');

const SESSION_KEYS = {
  token: 'cc_api_token',
  username: 'cc_username',
  displayName: 'cc_display_name',
  uuid: 'cc_user_uuid'
} as const;

const EXPIRY_KEY = 'cc_session_expiry';

/**
 * Reads the session from localStorage and validates expiry.
 * Returns null if no session exists or if it has expired.
 * If expired, clears all session keys.
 */
export function readSession(): { token: string; uuid: string; username: string; displayName: string } | null {
  const token = localStorage.getItem(SESSION_KEYS.token);
  const uuid = localStorage.getItem(SESSION_KEYS.uuid);
  const username = localStorage.getItem(SESSION_KEYS.username);
  const displayName = localStorage.getItem(SESSION_KEYS.displayName);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  // Check if any required field is missing
  if (!token || !uuid || !username) {
    return null;
  }

  // Check expiry
  if (expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      // Session expired, clear all keys
      Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
  }

  return { token, uuid, username, displayName: displayName || '' };
}

/**
 * AuthService uses apiFetch directly instead of restAdapter because:
 * - register() and login flows happen before a token is available
 * - verifyToken() and logout() DO have a token, but must explicitly handle Bearer auth
 * - This keeps the auth layer's fetch patterns explicit and separate from general API calls
 */
// Browser-compatible UUID v4 generator
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const authService = {
  async register(username: string, displayName?: string): Promise<{ uuid: string, huKey: string }> {
    const uuid = generateUUID();
    const huKey = `hu-${generateBase62(64)}`;
    const keyHash = await hashToken(huKey);

    const response = await apiFetch(`${getApiBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, username, displayName, keyHash })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to register');
    }

    return { uuid, huKey };
  },

  async loginWithKey(token: string, uuid?: string, username?: string): Promise<{ token: string, username: string, displayName: string | null, uuid: string }> {
    if (!token || !token.startsWith('hu-')) {
      throw new Error('Invalid ClawKey©™ format');
    }

    const keyHash = await hashToken(token);

    const response = await apiFetch(`${getApiBaseUrl()}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyHash,
        type: 'human',
        ...(uuid && { uuid }),
        ...(username && { username })
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.suggestion ? `${err.error}. ${err.suggestion}` : (err.error || 'Failed to authenticate'));
    }

    const pearl = await response.json();
    const data = pearl.data;
    localStorage.setItem(SESSION_KEYS.token, data.token);
    localStorage.setItem(SESSION_KEYS.username, data.user.username);
    if (data.user.displayName) localStorage.setItem(SESSION_KEYS.displayName, data.user.displayName);
    localStorage.setItem(SESSION_KEYS.uuid, data.user.uuid);
    
    // Store exact expiry if provided, otherwise default to 24h fallback
    if (data.expiresAt) {
      localStorage.setItem(EXPIRY_KEY, String(new Date(data.expiresAt).getTime()));
    } else {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + 86400000));
    }

    return { token: data.token, username: data.user.username, displayName: data.user.displayName || null, uuid: data.user.uuid };
  },

  async login(identityFileContent: string): Promise<{ token: string, username: string, displayName: string | null, uuid: string }> {
    const identity = JSON.parse(identityFileContent);
    const huKey = identity.token || identity.huKey; // Handle both formats
    const uuid = identity.uuid;

    if (!uuid || !huKey || !huKey.startsWith('hu-')) {
      throw new Error('Invalid identity file format');
    }

    const keyHash = await hashToken(huKey);

    const response = await apiFetch(`${getApiBaseUrl()}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, keyHash, type: 'human' })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to authenticate');
    }

    const pearl = await response.json();
    const data = pearl.data;
    localStorage.setItem(SESSION_KEYS.token, data.token);
    localStorage.setItem(SESSION_KEYS.username, data.user.username);
    if (data.user.displayName) localStorage.setItem(SESSION_KEYS.displayName, data.user.displayName);
    localStorage.setItem(SESSION_KEYS.uuid, data.user.uuid);
    
    if (data.expiresAt) {
      localStorage.setItem(EXPIRY_KEY, String(new Date(data.expiresAt).getTime()));
    } else {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + 86400000));
    }

    return { token: data.token, username: data.user.username, displayName: data.user.displayName || null, uuid: data.user.uuid };
  },

  async verifyToken(token: string): Promise<{ uuid: string, username: string, displayName: string | null }> {
    const response = await apiFetch(`${getApiBaseUrl()}/api/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token expired or invalid');
    }

    const result = await response.json();
    return {
      uuid: result.data.userUuid,
      // fallback to local storage since validate only returns uuid and keyType
      username: localStorage.getItem(SESSION_KEYS.username) || 'User',
      displayName: localStorage.getItem(SESSION_KEYS.displayName)
    };
  },

  async logout() {
    const token = localStorage.getItem(SESSION_KEYS.token);
    if (token) {
      try {
        await apiFetch(`${getApiBaseUrl()}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (e) {
        console.warn('[Auth] Server-side logout failed, clearing local session anyway.');
      }
    }
    Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(EXPIRY_KEY);
  }
};
