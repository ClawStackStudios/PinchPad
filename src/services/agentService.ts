import { restAdapter } from '../lib/api';
import { encryptRecord, decryptRecord } from '../lib/shellCryption';
import { generateBase62, hashToken } from '../lib/crypto';

// Browser-compatible UUID v4 generator
function generateUUID(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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
    const tempId = generateUUID();
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
