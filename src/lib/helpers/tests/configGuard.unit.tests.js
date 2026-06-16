import { describe, it, expect, vi, beforeEach } from 'vitest';

import { assertConfigLoaded, CONFIG_PLACEHOLDER } from '../configGuard.js';

// ── Fixture configs ────────────────────────────────────────────────────────

const VALID_CONFIG = { api: { host: 'api.example.com', port: '' } };
const VALID_CONFIG_WITH_URL = { port: 8080, host: 'https://example.com', api: { url: '/api' } };
const DEV_HOST_CONFIG = { api: { host: 'localhost', port: '' } };
const DEV_PORT_CONFIG = { api: { host: 'api.example.com', port: '3010' } };

// Shorthand helpers to keep assertions concise.
const defaultCall = (config) => () => assertConfigLoaded(config, 'production');
const strictCall = (config) => () => assertConfigLoaded(config, 'production', { strict: true });

describe('configGuard – assertConfigLoaded', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  // ── No-op in non-production modes ─────────────────────────────────────────

  it('should not throw and should not warn when mode is development and config is the placeholder', () => {
    expect(() => assertConfigLoaded(CONFIG_PLACEHOLDER, 'development')).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should not throw and should not warn when mode is development and config is fully loaded', () => {
    const realConfig = { port: 3000, host: 'http://localhost' };
    expect(() => assertConfigLoaded(realConfig, 'development')).not.toThrow();
    expect(console.warn).not.toHaveBeenCalled();
  });

  // ── Default mode (warn-only, strict not set) ───────────────────────────────

  describe('default mode — warns, does NOT throw', () => {
    it('does NOT throw for placeholder config — warns instead', () => {
      expect(defaultCall(CONFIG_PLACEHOLDER)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Production build requires a valid config'));
    });

    it('does NOT throw for config shaped like placeholder ({ port: 8080 }) — warns instead', () => {
      expect(defaultCall({ port: 8080 })).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Production build requires a valid config'));
    });

    it('does NOT throw for null config — warns instead', () => {
      expect(defaultCall(null)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Production build requires a valid config'));
    });

    it('does NOT throw for undefined config — warns instead', () => {
      expect(defaultCall(undefined)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Production build requires a valid config'));
    });

    it('does NOT throw for dev-host config — warns instead', () => {
      expect(defaultCall(DEV_HOST_CONFIG)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('dev-default API host'));
    });

    it('does NOT throw for dev-port config — warns instead', () => {
      expect(defaultCall(DEV_PORT_CONFIG)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('dev-default API port'));
    });

    it('does NOT throw and does NOT warn for a clean production config', () => {
      expect(defaultCall(VALID_CONFIG)).not.toThrow();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('does NOT throw and does NOT warn for a multi-field config with a real host', () => {
      expect(defaultCall(VALID_CONFIG_WITH_URL)).not.toThrow();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('does NOT throw and still warns when strict is explicitly false', () => {
      expect(() => assertConfigLoaded(DEV_HOST_CONFIG, 'production', { strict: false })).not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  // ── Strict mode (opt-in via { strict: true }) ──────────────────────────────
  // In vite.config.js (Node context) callers activate this with:
  //   assertConfigLoaded(appConfig, mode, { strict: process.env.DEVKIT_VUE_assert_strict === 'true' })

  describe('strict mode — { strict: true } — throws', () => {
    it('should throw when config is the CONFIG_PLACEHOLDER sentinel', () => {
      expect(strictCall(CONFIG_PLACEHOLDER)).toThrow('Production build requires a valid config');
    });

    it('should throw when config looks like the placeholder ({ port: 8080 })', () => {
      expect(strictCall({ port: 8080 })).toThrow('Production build requires a valid config');
    });

    it('should throw when config is null', () => {
      expect(strictCall(null)).toThrow('Production build requires a valid config');
    });

    it('should throw when config is undefined', () => {
      expect(strictCall(undefined)).toThrow('Production build requires a valid config');
    });

    // DEV_HOSTS / DEV_PORTS leak-detection (incident ref: a downstream signin-broken prod outage from a dev-default port leak)

    it('throws in production when api.host is localhost', () => {
      expect(strictCall({ api: { host: 'localhost', port: '' } })).toThrow('dev-default API host');
    });

    it('throws in production when api.host is 127.0.0.1', () => {
      expect(strictCall({ api: { host: '127.0.0.1', port: '' } })).toThrow('dev-default API host');
    });

    it('throws in production when api.port is a dev port (3010)', () => {
      expect(strictCall({ api: { host: 'api.example.com', port: '3010' } })).toThrow('dev-default API port');
    });

    it('throws in production when api.port is 3000', () => {
      expect(strictCall({ api: { host: 'api.example.com', port: '3000' } })).toThrow('dev-default API port');
    });

    it('does not throw in production with valid config (real host + empty port)', () => {
      expect(strictCall({ api: { host: 'api.example.com', port: '' } })).not.toThrow();
    });

    it('does not throw in production with valid config (real host + no port key)', () => {
      expect(strictCall({ api: { host: 'api.example.com' } })).not.toThrow();
    });

    // Normalization regression: case and whitespace must not bypass guards.

    it('throws in production when api.host is "LOCALHOST" (uppercase bypass attempt)', () => {
      expect(strictCall({ api: { host: 'LOCALHOST', port: '' } })).toThrow('dev-default API host');
    });

    it('throws in production when api.port is " 3000 " (padded bypass attempt)', () => {
      expect(strictCall({ api: { host: 'api.example.com', port: ' 3000 ' } })).toThrow('dev-default API port');
    });

    it('should not throw when mode is production and config is fully loaded', () => {
      expect(strictCall(VALID_CONFIG_WITH_URL)).not.toThrow();
    });
  });
});
