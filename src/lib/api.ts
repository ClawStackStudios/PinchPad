import { apiFetch } from './apiFetch';

export function getApiBaseUrl(): string {
  // @ts-ignore
  return import.meta.env.VITE_API_URL || '';
}

export const restAdapter = {
  async GET(endpoint: string): Promise<any> {
    const token = sessionStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    return response.json();
  },

  async POST(endpoint: string, body: any): Promise<any> {
    const token = sessionStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `POST ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  },

  async PUT(endpoint: string, body: any): Promise<any> {
    const token = sessionStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`PUT ${endpoint} failed: ${response.statusText}`);
    return response.json();
  },

  async DELETE(endpoint: string): Promise<any> {
    const token = sessionStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
    return response.json();
  }
};
