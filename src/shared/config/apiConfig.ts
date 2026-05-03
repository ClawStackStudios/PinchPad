/**
 * API Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized logic for determining the API base URL.
 *
 * This function resolves the API base URL using a priority system:
 * 1. Explicit override via VITE_API_URL environment variable
 * 2. Production builds use relative paths (same-origin)
 * 3. Local development defaults to localhost:8383
 *
 * Deployment Scenarios:
 * - Local Dev:        http://localhost:8383 (separate API port)
 * - Docker:           "" (relative paths, single container)
 * - LAN:              "" (relative, works on any LAN IP)
 * - Reverse Proxy:    "" (relative, behind nginx/Caddy)
 * - Custom Domain:    Set VITE_API_URL explicitly
 * ─────────────────────────────────────────────────────────────────────────────
 */

// @ts-ignore: Vite replaces these at build-time
const BAKED_PROD = import.meta.env.PROD;
// @ts-ignore: Vite replaces these at build-time
const BAKED_API_URL = import.meta.env.VITE_API_URL;

export function getApiBaseUrl(): string {
  // Priority 1: Explicit override via environment variable
  // Useful for custom domains, reverse proxies, etc.
  if (BAKED_API_URL) {
    return BAKED_API_URL.replace(/\/$/, "");
  }

  // Priority 2: Production builds use relative paths (same-origin)
  // This works for:
  // - Docker single-container deployments (UI + API on same port)
  // - Any LAN IP (192.168.x.x:8282) since relative paths work cross-IP
  // - Reverse proxy setups (domain.com serves both UI and API)
  if (BAKED_PROD) {
    return "";
  }

  // Priority 3: Local development default (separate ports)
  // Dev server connects to API server (port 8383)
  return "http://localhost:8383";
}
