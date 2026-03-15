/// <reference types="vitest" />
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { encryptField, decryptField, deriveShellKey } from '../../src/lib/shellCryption';

describe('ShellCryption', () => {
  let testKey: CryptoKey;
  const testUuid = '550e8400-e29b-41d4-a716-446655440000';
  const testAad = 'notes:test-note-id';

  beforeAll(async () => {
    const huKey = 'hu-testkeytestkeytestkeytestkeytestkeytestkeytestkeytestkey';
    testKey = await deriveShellKey(huKey, testUuid);
  });

  it('encrypts and decrypts plaintext correctly', async () => {
    const plaintext = 'Hello, PinchPad!';
    const encrypted = await encryptField(plaintext, testKey, testAad);
    const decrypted = await decryptField(encrypted, testKey, testAad);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for same plaintext (IV randomness)', async () => {
    const plaintext = 'Same content';
    const encrypted1 = await encryptField(plaintext, testKey, testAad);
    const encrypted2 = await encryptField(plaintext, testKey, testAad);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('decrypts correctly after multiple rounds', async () => {
    const plaintext = 'Multi-round test';
    const encrypted1 = await encryptField(plaintext, testKey, testAad);
    const decrypted1 = await decryptField(encrypted1, testKey, testAad);
    const encrypted2 = await encryptField(decrypted1, testKey, testAad);
    const decrypted2 = await decryptField(encrypted2, testKey, testAad);
    expect(decrypted2).toBe(plaintext);
  });

  it('throws when AAD does not match on decryption', async () => {
    const plaintext = 'Secret note';
    const encrypted = await encryptField(plaintext, testKey, testAad);

    const wrongAad = 'notes:different-note-id';
    await expect(decryptField(encrypted, testKey, wrongAad)).rejects.toThrow();
  });

  it('throws when ciphertext is tampered with', async () => {
    const plaintext = 'Secure data';
    const encrypted = await encryptField(plaintext, testKey, testAad);
    const parsed = JSON.parse(encrypted);

    // Tamper with the ciphertext
    parsed.ct = 'TAMPERED_CIPHERTEXT';
    const tamperedEncrypted = JSON.stringify(parsed);

    await expect(decryptField(tamperedEncrypted, testKey, testAad)).rejects.toThrow();
  });

  it('handles empty plaintext correctly', async () => {
    const plaintext = '';
    const encrypted = await encryptField(plaintext, testKey, testAad);
    const decrypted = await decryptField(encrypted, testKey, testAad);
    expect(decrypted).toBe('');
  });

  it('handles long plaintext correctly', async () => {
    const plaintext = 'A'.repeat(10000);
    const encrypted = await encryptField(plaintext, testKey, testAad);
    const decrypted = await decryptField(encrypted, testKey, testAad);
    expect(decrypted).toBe(plaintext);
  });

  it('produces valid encryption format with v1', async () => {
    const plaintext = 'Format test';
    const encrypted = await encryptField(plaintext, testKey, testAad);
    const parsed = JSON.parse(encrypted);

    expect(parsed.v).toBe(1);
    expect(parsed.alg).toBe('AES-GCM-256');
    expect(parsed.iv).toBeDefined();
    expect(parsed.ct).toBeDefined();
    expect(parsed.aad).toBe(testAad);
  });
});
