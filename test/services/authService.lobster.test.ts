/// <reference types="vitest" />
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readSession } from '../../src/services/authService';

describe('authService.readSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when localStorage is empty', () => {
    const session = readSession();
    expect(session).toBeNull();
  });

  it('returns null when only some required fields are present', () => {
    localStorage.setItem('cc_api_token', 'test-token');
    localStorage.setItem('cc_user_uuid', 'test-uuid');
    // missing cc_username

    const session = readSession();
    expect(session).toBeNull();
  });

  it('returns session when all required fields are present', () => {
    localStorage.setItem('cc_api_token', 'test-token');
    localStorage.setItem('cc_user_uuid', 'test-uuid');
    localStorage.setItem('cc_username', 'testuser');
    localStorage.setItem('cc_display_name', 'Test User');
    localStorage.setItem('cc_session_expiry', String(Date.now() + 3600000));

    const session = readSession();
    expect(session).not.toBeNull();
    expect(session?.token).toBe('test-token');
    expect(session?.username).toBe('testuser');
    expect(session?.uuid).toBe('test-uuid');
    expect(session?.displayName).toBe('Test User');
  });

  it('returns session with empty displayName when not set', () => {
    localStorage.setItem('cc_api_token', 'test-token');
    localStorage.setItem('cc_user_uuid', 'test-uuid');
    localStorage.setItem('cc_username', 'testuser');
    localStorage.setItem('cc_session_expiry', String(Date.now() + 3600000));
    // no cc_display_name

    const session = readSession();
    expect(session).not.toBeNull();
    expect(session?.displayName).toBe('');
  });

  it('returns null and clears storage when session is expired', () => {
    localStorage.setItem('cc_api_token', 'test-token');
    localStorage.setItem('cc_user_uuid', 'test-uuid');
    localStorage.setItem('cc_username', 'testuser');
    localStorage.setItem('cc_display_name', 'Test User');
    localStorage.setItem('cc_session_expiry', String(Date.now() - 1000)); // Expired 1s ago

    const session = readSession();
    expect(session).toBeNull();
    expect(localStorage.getItem('cc_api_token')).toBeNull();
    expect(localStorage.getItem('cc_user_uuid')).toBeNull();
    expect(localStorage.getItem('cc_username')).toBeNull();
    expect(localStorage.getItem('cc_display_name')).toBeNull();
    expect(localStorage.getItem('cc_session_expiry')).toBeNull();
  });

  it('returns null when expiry is missing but other fields exist', () => {
    localStorage.setItem('cc_api_token', 'test-token');
    localStorage.setItem('cc_user_uuid', 'test-uuid');
    localStorage.setItem('cc_username', 'testuser');
    // no cc_session_expiry

    const session = readSession();
    expect(session).not.toBeNull();
    expect(session?.token).toBe('test-token');
  });
});
