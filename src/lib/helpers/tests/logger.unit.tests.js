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
});
