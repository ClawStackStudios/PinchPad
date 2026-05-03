import { apiFetch } from './apiFetch';
export { getApiBaseUrl } from '../config/apiConfig';

async function parseErrorResponse(response: Response, endpoint: string, method: string): Promise<never> {
  let errorMsg = `${method} ${endpoint} failed: ${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    if (body.error) errorMsg = body.error;
  } catch { /* non-JSON response — use status text */ }
  throw new Error(errorMsg);
}

export const restAdapter = {
  async GET(endpoint: string): Promise<any> {
    const token = localStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    return response.json();
  },

  async POST(endpoint: string, body: any): Promise<any> {
    const token = localStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) return parseErrorResponse(response, endpoint, 'POST');
    return response.json();
  },

  async PUT(endpoint: string, body: any): Promise<any> {
    const token = localStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) return parseErrorResponse(response, endpoint, 'PUT');
    return response.json();
  },

  async PATCH(endpoint: string, body: any): Promise<any> {
    const token = localStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) return parseErrorResponse(response, endpoint, 'PATCH');
    return response.json();
  },

  async DELETE(endpoint: string): Promise<any> {
    const token = localStorage.getItem('cc_api_token');
    const response = await apiFetch(`${getApiBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
    return response.json();
  }
};
