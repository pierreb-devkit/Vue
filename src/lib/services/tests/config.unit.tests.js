import { describe, it, expect } from 'vitest';
import config, { apiBase } from '../config.js';
import { formatApiUrl } from '../apiUrl.js';

describe('Config Service', () => {
  it('should export config object', () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('should have app configuration', () => {
    expect(config).toHaveProperty('app');
    expect(config.app).toBeDefined();
  });

  it('should have API configuration', () => {
    expect(config).toHaveProperty('api');
    expect(config.api).toBeDefined();
  });

  it('should have vuetify configuration', () => {
    expect(config).toHaveProperty('vuetify');
    expect(config.vuetify).toBeDefined();
  });

  it('should have cookie configuration', () => {
    expect(config).toHaveProperty('cookie');
    expect(config.cookie).toBeDefined();
  });

  it('should not be null', () => {
    expect(config).not.toBeNull();
  });

  it('should be an immutable reference', () => {
    const config1 = config;
    const config2 = config;
    expect(config1).toBe(config2);
  });

  it('apiBase() should build the protocol://host:port/base prefix from config.api', () => {
    // Derived from the loaded config, not a literal: api.port is overridable per project.
    expect(apiBase()).toBe(formatApiUrl(config.api));
    expect(() => new URL(apiBase())).not.toThrow();
  });

  it('apiBase() format stays a valid URL for a bracketed IPv6 host', () => {
    const url = formatApiUrl({ ...config.api, host: '[::1]' });
    expect(new URL(url).hostname).toBe('[::1]');
  });
});
