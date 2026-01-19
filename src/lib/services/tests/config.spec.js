import { describe, it, expect } from 'vitest';
import config from '../config.js';

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
});
