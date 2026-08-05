import { describe, it, expect, vi, afterEach } from 'vitest';
import { errorMessage, isApiAvailable, CONNECTIVITY_ERROR_RE } from '../api.js';

describe('errorMessage', () => {
  it('returns the message of an Error instance', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies a non-Error value', () => {
    expect(errorMessage('plain string')).toBe('plain string');
    expect(errorMessage({ foo: 'bar' })).toBe('[object Object]');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});

describe('CONNECTIVITY_ERROR_RE', () => {
  it('matches known transport-level failure signatures', () => {
    expect(CONNECTIVITY_ERROR_RE.test('connect ECONNREFUSED 127.0.0.1:3000')).toBe(true);
    expect(CONNECTIVITY_ERROR_RE.test('read ECONNRESET')).toBe(true);
    expect(CONNECTIVITY_ERROR_RE.test('write EPIPE')).toBe(true);
    expect(CONNECTIVITY_ERROR_RE.test('getaddrinfo ENOTFOUND api.example.com')).toBe(true);
  });

  it('does not match an application-level error message', () => {
    expect(CONNECTIVITY_ERROR_RE.test('Validation failed: email is required')).toBe(false);
  });
});

describe('isApiAvailable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when the request resolves (any HTTP status is reachability)', async () => {
    const request = { get: vi.fn().mockResolvedValue({ status: () => 500 }) };
    await expect(isApiAvailable(request)).resolves.toBe(true);
  });

  it('returns false and logs when the request throws a transport error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const request = { get: vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')) };

    await expect(isApiAvailable(request)).resolves.toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('ECONNREFUSED');
  });
});
