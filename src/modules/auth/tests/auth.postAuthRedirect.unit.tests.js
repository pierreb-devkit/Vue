import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isSafeRedirect,
  savePostAuthRedirect,
  consumePostAuthRedirect,
  clearPostAuthRedirect,
  POST_AUTH_REDIRECT_TTL_MS,
} from '../lib/postAuthRedirect.js';

const mockConfig = { cookie: { prefix: 'devkit' } };
const STORAGE_KEY = 'devkitPostAuthRedirect';

describe('isSafeRedirect', () => {
  it('accepts a single-slash same-origin path', () => {
    expect(isSafeRedirect('/pricing')).toBe(true);
    expect(isSafeRedirect('/')).toBe(true);
  });

  it('rejects a protocol-relative //host target', () => {
    expect(isSafeRedirect('//evil.example.com')).toBe(false);
  });

  it('rejects a backslash-prefixed target (browser-normalized like //)', () => {
    expect(isSafeRedirect('/\\evil.example.com')).toBe(false);
  });

  it('rejects an absolute URL', () => {
    expect(isSafeRedirect('https://evil.example.com/phish')).toBe(false);
  });

  it('rejects non-string and empty values', () => {
    expect(isSafeRedirect(undefined)).toBe(false);
    expect(isSafeRedirect(null)).toBe(false);
    expect(isSafeRedirect('')).toBe(false);
    expect(isSafeRedirect(['/pricing'])).toBe(false);
  });
});

describe('savePostAuthRedirect / consumePostAuthRedirect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('round-trips a safe path', () => {
    savePostAuthRedirect(mockConfig, '/pricing');
    expect(consumePostAuthRedirect(mockConfig)).toBe('/pricing');
  });

  it('is single-use — a second consume returns null', () => {
    savePostAuthRedirect(mockConfig, '/pricing');
    consumePostAuthRedirect(mockConfig);
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
  });

  it('never persists an unsafe path', () => {
    savePostAuthRedirect(mockConfig, '//evil.example.com');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
  });

  it('returns null when nothing was ever saved', () => {
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
  });

  it('ignores an expired record and clears it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    savePostAuthRedirect(mockConfig, '/pricing');
    vi.setSystemTime(POST_AUTH_REDIRECT_TTL_MS + 1);

    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
    // Cleared on read — a later restore of "now" must not resurrect it.
    vi.setSystemTime(POST_AUTH_REDIRECT_TTL_MS + 2);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('accepts a record right at the TTL boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    savePostAuthRedirect(mockConfig, '/pricing');
    vi.setSystemTime(POST_AUTH_REDIRECT_TTL_MS);

    expect(consumePostAuthRedirect(mockConfig)).toBe('/pricing');
  });

  it('rejects a hand-tampered record whose path is no longer safe', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ path: '//evil.example.com', ts: Date.now() }));
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('returns null and clears the key on malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json{');
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('namespaces the storage key by config.cookie.prefix', () => {
    savePostAuthRedirect({ cookie: { prefix: 'other' } }, '/pricing');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
    expect(consumePostAuthRedirect({ cookie: { prefix: 'other' } })).toBe('/pricing');
  });
});

describe('clearPostAuthRedirect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('removes a persisted record without returning it', () => {
    savePostAuthRedirect(mockConfig, '/pricing');
    clearPostAuthRedirect(mockConfig);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(consumePostAuthRedirect(mockConfig)).toBeNull();
  });

  it('is a no-op when nothing was persisted', () => {
    expect(() => clearPostAuthRedirect(mockConfig)).not.toThrow();
  });
});
