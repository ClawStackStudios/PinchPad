import { restAdapter } from '../../shared/lib/api';
import { generateRandomString, generateUUID, hashToken } from '../../shared/lib/crypto';


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
  async getAll(): Promise<LobsterKey[]> {
    const response = await restAdapter.GET('/api/agents');
    return response.data;
  },

  async create(name: string, permissions: Record<string, boolean>, expiration_type: string, expiration_date: string | null, rate_limit: number | null): Promise<LobsterKey> {
    const tempId = generateUUID();
    const apiKey = `lb-${generateRandomString(64)}`;

    // Hash for server authentication
    const apiKeyHash = await hashToken(apiKey);

    const response = await restAdapter.POST('/api/agents', {
      id: tempId,
      name,
      api_key: apiKey,
      api_key_hash: apiKeyHash,
      permissions,
      expiration_type,
      expiration_date,
      rate_limit
    });

    return { ...response.data, api_key: apiKey }; // Return the plaintext key for the one-time display
  },

  async revoke(id: string): Promise<void> {
    await restAdapter.PUT(`/api/agents/${id}/revoke`, {});
  },

  async delete(id: string): Promise<void> {
    await restAdapter.DELETE(`/api/agents/${id}`);
  }
};
