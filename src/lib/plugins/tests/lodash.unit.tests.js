import { describe, it, expect } from 'vitest';
import lodashPlugin from '../lodash';

describe('lodash plugin', () => {
  it('has an install method', () => {
    expect(typeof lodashPlugin.install).toBe('function');
  });

  it('exposes lodash as lodash on globalProperties', () => {
    const app = { config: { globalProperties: {} } };
    lodashPlugin.install(app);
    expect(app.config.globalProperties.lodash).toBeDefined();
  });

  it('exposed lodash is a functional lodash instance', () => {
    const app = { config: { globalProperties: {} } };
    lodashPlugin.install(app);
    const lodash = app.config.globalProperties.lodash;
    expect(typeof lodash.isArray).toBe('function');
    expect(lodash.isArray([1, 2, 3])).toBe(true);
    expect(lodash.pick({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 });
  });
});
