/**
 * apiFetch — PinchPad©™
 *
 * A specialized fetch wrapper that automatically handles
 * authentication errors and common API patterns.
 *
 * Maintained by CrustAgent©™
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, options);

  // Only dispatch auth:expired when the server explicitly signals token expiration,
  // not for every 401 (which could be invalid credentials, malformed headers, etc.)
  if (response.status === 401) {
    try {
      const body = await response.clone().json();
      if (body.error === 'Token expired. Please authenticate again.') {
        window.dispatchEvent(new Event('auth:expired'));
      }
    } catch {
      // Non-JSON 401 response — treat as auth expiry to be safe
      window.dispatchEvent(new Event('auth:expired'));
    }
  }

  return response;
}
