import { getApiBaseUrl } from '../lib/api';
import { apiFetch } from '../lib/apiFetch';
import { generateBase62, hashToken } from '../lib/crypto';
import { deriveShellKey } from '../lib/shellCryption';

const SESSION_KEYS = {
  token: 'cc_api_token',
  username: 'cc_username',
  uuid: 'cc_user_uuid'
} as const;

export const authService = {
  async register(username: string): Promise<{ uuid: string, huKey: string }> {
    const uuid = crypto.randomUUID();
    const huKey = `hu-${generateBase62(64)}`;
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

  async loginWithKey(token: string, uuid?: string, username?: string): Promise<{ token: string, shellKey: CryptoKey, username: string, uuid: string }> {
    if (!token || !token.startsWith('hu-')) {
      throw new Error('Invalid ClawKey format');
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
    sessionStorage.setItem(SESSION_KEYS.token, pearl.token);
    sessionStorage.setItem(SESSION_KEYS.username, pearl.username);
    sessionStorage.setItem(SESSION_KEYS.uuid, pearl.uuid);

    const shellKey = await deriveShellKey(token, pearl.uuid);
    return { token: pearl.token, shellKey, username: pearl.username, uuid: pearl.uuid };
  },

  async login(identityFileContent: string): Promise<{ token: string, shellKey: CryptoKey, username: string, uuid: string }> {
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
    sessionStorage.setItem(SESSION_KEYS.token, pearl.token);
    sessionStorage.setItem(SESSION_KEYS.username, pearl.username);
    sessionStorage.setItem(SESSION_KEYS.uuid, pearl.uuid);

    const shellKey = await deriveShellKey(huKey, pearl.uuid);
    return { token: pearl.token, shellKey, username: pearl.username, uuid: pearl.uuid };
  },

  async verifyToken(token: string): Promise<{ uuid: string, username: string }> {
    const response = await apiFetch(`${getApiBaseUrl()}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token expired or invalid');
    }

    return await response.json();
  },

  async logout() {
    const token = sessionStorage.getItem(SESSION_KEYS.token);
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
    Object.values(SESSION_KEYS).forEach(k => sessionStorage.removeItem(k));
  }
};
