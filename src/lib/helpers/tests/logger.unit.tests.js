import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger } from '../logger.js';

describe('Logger Helper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a logger with error, warn, info methods', () => {
    const log = createLogger('test');
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.info).toBe('function');
  });

  it('should prefix error messages with [app][module]', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('home');

    log.error('something failed');

    expect(spy).toHaveBeenCalledWith('[app][home]', 'something failed');
  });

  it('should prefix warn messages with [app][module]', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const log = createLogger('auth');

    log.warn('token expiring');

    expect(spy).toHaveBeenCalledWith('[app][auth]', 'token expiring');
  });

  it('should prefix info messages with [app][module]', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const log = createLogger('billing');

    log.info('subscription loaded');

    expect(spy).toHaveBeenCalledWith('[app][billing]', 'subscription loaded');
  });

  it('should forward multiple arguments', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('home');
    const err = new Error('test');

    log.error('fetch failed', err);

    expect(spy).toHaveBeenCalledWith('[app][home]', 'fetch failed', err);
  });
  it('should never log the request payload of an axios error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = createLogger('auth');
    const err = Object.assign(new Error('Request failed with status code 422'), {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      config: { method: 'post', url: '/api/auth/signin', data: '{"password":"secret"}', headers: { Authorization: 'x' } },
      response: { status: 422, data: { description: 'raw' } },
    });

    log.error('signin failed', err);

    const logged = spy.mock.calls[0][2];
    expect(logged).toEqual({
      name: 'Error',
      message: 'Request failed with status code 422',
      code: 'ERR_BAD_REQUEST',
      status: 422,
      method: 'post',
      url: '/api/auth/signin',
    });
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secret');
  });
});
