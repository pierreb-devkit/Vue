import { describe, it, expect } from 'vitest';

import { assertConfigLoaded, CONFIG_PLACEHOLDER } from '../configGuard.js';

describe('configGuard – assertConfigLoaded', () => {
  it('should throw when mode is production and config is the placeholder', () => {
    expect(() => assertConfigLoaded(CONFIG_PLACEHOLDER, 'production')).toThrow(
      'Production build requires a valid config',
    );
  });

  it('should throw when mode is production and config looks like the placeholder', () => {
    expect(() => assertConfigLoaded({ port: 8080 }, 'production')).toThrow(
      'Production build requires a valid config',
    );
  });

  it('should not throw when mode is production and config is fully loaded', () => {
    const realConfig = { port: 8080, host: 'https://example.com', api: { url: '/api' } };
    expect(() => assertConfigLoaded(realConfig, 'production')).not.toThrow();
  });

  it('should not throw when mode is development and config is the placeholder', () => {
    expect(() => assertConfigLoaded(CONFIG_PLACEHOLDER, 'development')).not.toThrow();
  });

  it('should not throw when mode is development and config is fully loaded', () => {
    const realConfig = { port: 3000, host: 'http://localhost' };
    expect(() => assertConfigLoaded(realConfig, 'development')).not.toThrow();
  });

  it('should throw when mode is production and config is null', () => {
    expect(() => assertConfigLoaded(null, 'production')).toThrow(
      'Production build requires a valid config',
    );
  });

  it('should throw when mode is production and config is undefined', () => {
    expect(() => assertConfigLoaded(undefined, 'production')).toThrow(
      'Production build requires a valid config',
    );
  });

  // DEV_HOSTS / DEV_PORTS leak-detection tests (incident ref: trawl_vue #949 — signin-broken :3010 outage)

  it('throws in production when api.host is localhost', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'localhost', port: '' } }, 'production'),
    ).toThrow('dev-default API host');
  });

  it('throws in production when api.host is 127.0.0.1', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: '127.0.0.1', port: '' } }, 'production'),
    ).toThrow('dev-default API host');
  });

  it('throws in production when api.port is a dev port', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'api.example.com', port: '3010' } }, 'production'),
    ).toThrow('dev-default API port');
  });

  it('throws in production when api.port is 3000', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'api.example.com', port: '3000' } }, 'production'),
    ).toThrow('dev-default API port');
  });

  it('does not throw in production with valid config (real host + empty port)', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'api.example.com', port: '' } }, 'production'),
    ).not.toThrow();
  });

  it('does not throw in production with valid config (real host + no port key)', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'api.example.com' } }, 'production'),
    ).not.toThrow();
  });

  // Normalization regression tests: case and whitespace must not bypass guards.

  it('throws in production when api.host is "LOCALHOST" (uppercase bypass attempt)', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'LOCALHOST', port: '' } }, 'production'),
    ).toThrow('dev-default API host');
  });

  it('throws in production when api.port is " 3000 " (padded bypass attempt)', () => {
    expect(() =>
      assertConfigLoaded({ api: { host: 'api.example.com', port: ' 3000 ' } }, 'production'),
    ).toThrow('dev-default API port');
  });
});
