/**
 * API Fetch Wrapper
 *
 * Wraps the standard fetch() and intercepts 401 responses.
 * When a 401 occurs, dispatches 'auth:expired' event so useAuth can auto-logout.
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);

  // If token expired (401), dispatch event for AuthContext to listen
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
  }

  return response;
}
