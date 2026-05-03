import { getApiBaseUrl } from '../../shared/lib/api';
import { apiFetch } from '../../shared/lib/apiFetch';
import { generateUUID, generateHumanKey, hashToken, validateIdentityFile } from '../../shared/lib/crypto';

console.log('[CrustAgent] 🦞 Scuttling foundational imports for authService...');

const SESSION_KEYS = {
  token: 'pp_api_token',
  username: 'pp_username',
  uuid: 'pp_user_uuid',
  displayName: 'pp_display_name'
} as const;

const EXPIRY_KEY = 'pp_session_expiry';

/**
 * Reads the session from localStorage and validates expiry.
 * Returns null if no session exists or if it has expired.
 * If expired, clears all session keys.
 */
export function readSession(): { token: string; uuid: string; username: string; displayName: string | null } | null {
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

  return { token, uuid, username, displayName };
}

/**
 * AuthService uses apiFetch directly instead of restAdapter because:
 * - register() and login flows happen before a token is available
 * - verifyToken() and logout() DO have a token, but must explicitly handle Bearer auth
 * - This keeps the auth layer's fetch patterns explicit and separate from general API calls
 */
export const authService = {
  async register(username: string): Promise<{ uuid: string, huKey: string }> {
    const uuid = generateUUID();
    const huKey = generateHumanKey();
    const keyHash = await hashToken(huKey);

    const response = await apiFetch(`${getApiBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid, username, keyHash })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to register');
    }

    return { uuid, huKey };
  },

  async loginWithKey(token: string, uuid?: string, username?: string, displayName?: string | null): Promise<{ token: string, username: string, uuid: string, displayName: string | null }> {
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
        ...(uuid && { uuid })
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
    localStorage.setItem(SESSION_KEYS.uuid, data.user.uuid);
    if (displayName) {
      localStorage.setItem(SESSION_KEYS.displayName, displayName);
    }
    
    // Store exact expiry if provided, otherwise default to 24h fallback
    if (data.expiresAt) {
      localStorage.setItem(EXPIRY_KEY, String(new Date(data.expiresAt).getTime()));
    } else {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + 86400000));
    }

    return { token: data.token, username: data.user.username, uuid: data.user.uuid, displayName: displayName || null };
  },

  async login(identityFileContent: string): Promise<{ token: string, username: string, uuid: string, displayName: string | null }> {
    let identity;
    try {
      identity = JSON.parse(identityFileContent);
    } catch (e) {
      throw new Error('Invalid identity file format (not JSON)');
    }

    const missingFields = validateIdentityFile(identity);
    if (missingFields.length > 0) {
      throw new Error(`Invalid identity file format. Missing or invalid: ${missingFields.join(', ')}`);
    }

    const huKey = identity.token;
    const uuid = identity.uuid;
    const displayName = identity.displayName || null;
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
    localStorage.setItem(SESSION_KEYS.uuid, data.user.uuid);
    if (displayName) {
      localStorage.setItem(SESSION_KEYS.displayName, displayName);
    }
    
    if (data.expiresAt) {
      localStorage.setItem(EXPIRY_KEY, String(new Date(data.expiresAt).getTime()));
    } else {
      localStorage.setItem(EXPIRY_KEY, String(Date.now() + 86400000));
    }

    return { token: data.token, username: data.user.username, uuid: data.user.uuid, displayName: displayName || null };
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
