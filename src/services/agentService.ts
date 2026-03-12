import { restAdapter } from '../lib/api';
import { encryptRecord, decryptRecord } from '../lib/shellCryption';

export interface LobsterKey {
  id: string;
  name: string;
  api_key?: string; // Only returned on creation
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
      response.data.map((key: LobsterKey) => decryptRecord(key, ['name'], shellKey, 'lobster_keys'))
    );
    return decryptedKeys;
  },

  async create(name: string, permissions: Record<string, boolean>, expiration_type: string, expiration_date: string | null, rate_limit: number | null, shellKey: CryptoKey): Promise<LobsterKey> {
    const tempId = crypto.randomUUID();
    const tempRecord = { id: tempId, name };
    const encrypted = await encryptRecord(tempRecord, ['name'], shellKey, 'lobster_keys');

    const response = await restAdapter.POST('/api/agents', {
      id: tempId,
      name: encrypted.name,
      permissions,
      expiration_type,
      expiration_date,
      rate_limit
    });

    return decryptRecord(response.data, ['name'], shellKey, 'lobster_keys');
  },

  async revoke(id: string): Promise<void> {
    await restAdapter.PUT(`/api/agents/${id}/revoke`, {});
  }
};
