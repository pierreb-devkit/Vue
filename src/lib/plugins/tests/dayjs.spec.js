import { describe, it, expect } from 'vitest';
import dayjsPlugin from '../dayjs';

describe('dayjs plugin', () => {
  it('has an install method', () => {
    expect(typeof dayjsPlugin.install).toBe('function');
  });

  it('exposes dayjs on globalProperties', () => {
    const app = { config: { globalProperties: {} } };
    dayjsPlugin.install(app);
    expect(app.config.globalProperties.dayjs).toBeDefined();
  });

  it('dayjs has relativeTime plugin (fromNow available)', () => {
    const app = { config: { globalProperties: {} } };
    dayjsPlugin.install(app);
    const dayjs = app.config.globalProperties.dayjs;
    expect(typeof dayjs().fromNow).toBe('function');
  });

  it('dayjs has utc plugin (utc method available)', () => {
    const app = { config: { globalProperties: {} } };
    dayjsPlugin.install(app);
    const dayjs = app.config.globalProperties.dayjs;
    expect(typeof dayjs().utc).toBe('function');
  });

  it('dayjs has timezone plugin (tz method available)', () => {
    const app = { config: { globalProperties: {} } };
    dayjsPlugin.install(app);
    const dayjs = app.config.globalProperties.dayjs;
    expect(typeof dayjs.tz).toBe('function');
  });
});
