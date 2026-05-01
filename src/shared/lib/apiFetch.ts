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

  // If token expired (401), dispatch event for AuthContext to listen
  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
  }

  return response;
}
