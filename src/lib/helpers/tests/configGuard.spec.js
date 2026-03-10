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
});
