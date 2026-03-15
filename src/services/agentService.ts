import { restAdapter } from '../lib/api';
import { encryptRecord, decryptRecord } from '../lib/shellCryption';
import { generateBase62, hashToken } from '../lib/crypto';

export interface LobsterKey {
  id: string;
  name: string;
  api_key?: string; // Decrypted on the fly for the human
  api_key_hash?: string; // Server side hash
  permissions: string; // JSON string
  expiration_type: string;
  expiration_date: string | null;
  rate_limit: number | null;
  is_active: number;
  created_at: string;
  last_used: string | null;
}

export const agentService = {
  async getAll(shellKey: CryptoKey): Promise<LobsterKey[]> {
    const response = await restAdapter.GET('/api/agents');
    const decryptedKeys = await Promise.all(
      response.data.map((key: LobsterKey) => decryptRecord(key, ['name', 'api_key'], shellKey, 'lobster_keys'))
    );
    return decryptedKeys;
  },

  async create(name: string, permissions: Record<string, boolean>, expiration_type: string, expiration_date: string | null, rate_limit: number | null, shellKey: CryptoKey): Promise<LobsterKey> {
    const tempId = crypto.randomUUID();
    const apiKey = `lb-${generateBase62(64)}`;
    
    // Hash for server authentication
    const apiKeyHash = await hashToken(apiKey);
    
    // Encrypt both name AND the api_key for sovereign recovery
    const tempRecord = { id: tempId, name, api_key: apiKey };
    const encrypted = await encryptRecord(tempRecord, ['name', 'api_key'], shellKey, 'lobster_keys');

    const response = await restAdapter.POST('/api/agents', {
      id: tempId,
      name: encrypted.name,
      api_key_encrypted: encrypted.api_key,
      api_key_hash: apiKeyHash,
      permissions,
      expiration_type,
      expiration_date,
      rate_limit
    });

    const decrypted = await decryptRecord(response.data, ['name', 'api_key'], shellKey, 'lobster_keys');
    return { ...decrypted, api_key: apiKey }; // Return the plaintext key for the one-time display
  },

  async revoke(id: string): Promise<void> {
    await restAdapter.PUT(`/api/agents/${id}/revoke`, {});
  }
};
