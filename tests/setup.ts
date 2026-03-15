import { webcrypto } from 'node:crypto';

// Polyfill globalThis.crypto for Node environment
// Only set if it doesn't already exist (jsdom environments already have it)
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// @vitest-environment jsdom is set per-file in files that need localStorage
