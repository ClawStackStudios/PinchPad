import { restAdapter, getApiBaseUrl } from '../../shared/lib/api';

export interface PearlShare {
  id: string;
  pearl_id: string;
  pearl_title: string;
  share_hash: string;
  is_active: number;
  created_at: string;
  expires_at: string | null;
}

export interface PublicPearl {
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  photos: {
    id: string;
    filename: string;
    mimeType: string;
    url: string;
  }[];
}

export const shellProxyService = {
  /**
   * Fetch all active shares for the current user
   */
  async getShares(): Promise<PearlShare[]> {
    const response = await restAdapter.GET('/api/shares');
    return response.data;
  },

  /**
   * Create a new share for a pearl
   */
  async createShare(pearlId: string, expiresAt?: string | null): Promise<PearlShare> {
    const response = await restAdapter.POST(`/api/shares/pearl/${pearlId}`, { expiresAt });
    return response.data;
  },

  /**
   * Revoke an active share
   */
  async revokeShare(shareId: string): Promise<void> {
    await restAdapter.DELETE(`/api/shares/${shareId}`);
  },

  /**
   * Public endpoint to fetch a shared pearl using its hash
   */
  async getPublicShare(shareHash: string): Promise<PublicPearl> {
    // This goes to the unauthenticated /shellproxy membrane
    const response = await fetch(`${getApiBaseUrl()}/shellproxy/share/${shareHash}`);
    if (!response.ok) {
      throw new Error('Share not found or expired');
    }
    const json = await response.json();
    return json.data;
  }
};
