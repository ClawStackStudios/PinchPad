/// <reference types="vitest" />
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { generateRandomString, hashToken } from '../../src/shared/lib/crypto';

describe('generateRandomString', () => {
  it('generates string of correct length', () => {
    const key32 = generateRandomString(32);
    expect(key32).toHaveLength(32);

    const key64 = generateRandomString(64);
    expect(key64).toHaveLength(64);
  });

  it('only uses base62 characters', () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const key = generateRandomString(64);
    for (const char of key) {
      expect(charset).toContain(char);
    }
  });

  it('generates different strings on repeated calls (randomness)', () => {
    const key1 = generateRandomString(32);
    const key2 = generateRandomString(32);
    expect(key1).not.toBe(key2);
  });
});

describe('hashToken', () => {
  it('generates consistent hash for same token', async () => {
    const token = 'hu-test-token-12345';
    const hash1 = await hashToken(token);
    const hash2 = await hashToken(token);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different tokens', async () => {
    const hash1 = await hashToken('hu-token-1');
    const hash2 = await hashToken('hu-token-2');
    expect(hash1).not.toBe(hash2);
  });

  it('returns a valid hex string', async () => {
    const token = 'test-token';
    const hash = await hashToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
  });
});
