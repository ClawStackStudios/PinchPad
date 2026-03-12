import { restAdapter, getApiBaseUrl } from '../lib/api';
import { generateBase62, hashToken, downloadIdentityFile } from '../lib/crypto';
import { deriveShellKey } from '../lib/shellCryption';

export const authService = {
  async register(username: string): Promise<{ uuid: string, huKey: string }> {
    const uuid = crypto.randomUUID();
    const huKey = `hu-${generateBase62(64)}`;
    const keyHash = await hashToken(huKey);

    const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
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

  async loginWithKey(token: string, uuid?: string, username?: string): Promise<{ token: string, shellKey: CryptoKey }> {
    if (!token || !token.startsWith('hu-')) {
      throw new Error('Invalid ClawKey format');
    }

    const keyHash = await hashToken(token);

    const response = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
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

    const data = await response.json();
    sessionStorage.setItem('cc_api_token', data.token);

    const shellKey = await deriveShellKey(token, data.uuid);
    return { token: data.token, shellKey };
  },

  async login(identityFileContent: string): Promise<{ token: string, shellKey: CryptoKey }> {
    const identity = JSON.parse(identityFileContent);
    if (!identity.uuid || !identity.token || !identity.token.startsWith('hu-')) {
      throw new Error('Invalid identity file format');
    }

    const keyHash = await hashToken(identity.token);

    const response = await fetch(`${getApiBaseUrl()}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uuid: identity.uuid, keyHash, type: 'human' })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to authenticate');
    }

    const data = await response.json();
    sessionStorage.setItem('cc_api_token', data.token);

    const shellKey = await deriveShellKey(identity.token, identity.uuid);
    return { token: data.token, shellKey };
  },

  logout() {
    sessionStorage.removeItem('cc_api_token');
  }
};
