import { describe, it, expect } from 'vitest';
import lodashPlugin from '../lodash';

describe('lodash plugin', () => {
  it('has an install method', () => {
    expect(typeof lodashPlugin.install).toBe('function');
  });

  it('exposes lodash as _ on globalProperties', () => {
    const app = { config: { globalProperties: {} } };
    lodashPlugin.install(app);
    expect(app.config.globalProperties._).toBeDefined();
  });

  it('exposed _ is a functional lodash instance', () => {
    const app = { config: { globalProperties: {} } };
    lodashPlugin.install(app);
    const _ = app.config.globalProperties._;
    expect(typeof _.isArray).toBe('function');
    expect(_.isArray([1, 2, 3])).toBe(true);
    expect(_.pick({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 });
  });
});
