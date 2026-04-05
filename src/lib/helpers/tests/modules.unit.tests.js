import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockConfig = {};
vi.mock('../../services/config', () => ({
  default: new Proxy({}, { get: (_, prop) => mockConfig[prop] }),
}));

describe('isModuleActive', () => {
  let isModuleActive;

  beforeEach(async () => {
    vi.resetModules();
    mockConfig = {};

    vi.doMock('../../services/config', () => ({
      default: new Proxy({}, { get: (_, prop) => mockConfig[prop] }),
    }));

    const mod = await import('../modules.js');
    isModuleActive = mod.isModuleActive;
  });

  it('returns true for core modules regardless of config', () => {
    mockConfig.modules = { home: { activated: false }, auth: { activated: false }, users: { activated: false } };
    expect(isModuleActive('home')).toBe(true);
    expect(isModuleActive('auth')).toBe(true);
    expect(isModuleActive('users')).toBe(true);
    expect(isModuleActive('app')).toBe(true);
    expect(isModuleActive('core')).toBe(true);
  });

  it('returns true for optional modules when activated is true', () => {
    mockConfig.modules = { tasks: { activated: true }, billing: { activated: true } };
    expect(isModuleActive('tasks')).toBe(true);
    expect(isModuleActive('billing')).toBe(true);
  });

  it('returns false for optional modules when activated is false', () => {
    mockConfig.modules = { tasks: { activated: false }, billing: { activated: false } };
    expect(isModuleActive('tasks')).toBe(false);
    expect(isModuleActive('billing')).toBe(false);
  });

  it('returns true when modules config is undefined (default behavior)', () => {
    mockConfig.modules = undefined;
    expect(isModuleActive('tasks')).toBe(true);
    expect(isModuleActive('billing')).toBe(true);
  });

  it('returns true when a specific module is not listed in config', () => {
    mockConfig.modules = { tasks: { activated: true } };
    expect(isModuleActive('billing')).toBe(true);
  });

  it('returns true when module entry exists but has no activated property', () => {
    mockConfig.modules = { tasks: {} };
    expect(isModuleActive('tasks')).toBe(true);
  });
});
