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

  it('dayjs has localizedFormat plugin (L tokens format)', () => {
    const app = { config: { globalProperties: {} } };
    dayjsPlugin.install(app);
    const dayjs = app.config.globalProperties.dayjs;
    expect(dayjs('2026-01-02').format('L')).not.toBe('L');
  });

  it('dayjs no longer extends utc or timezone', () => {
    const app = { config: { globalProperties: {} } };
    dayjsPlugin.install(app);
    const dayjs = app.config.globalProperties.dayjs;
    expect(dayjs().utc).toBeUndefined();
    expect(dayjs.tz).toBeUndefined();
  });
});
