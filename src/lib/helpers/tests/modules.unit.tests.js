import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('warnUnknownModuleKeys', () => {
  let warnUnknownModuleKeys;
  let consoleWarnSpy;

  beforeEach(async () => {
    vi.resetModules();
    mockConfig = {};

    vi.doMock('../../services/config', () => ({
      default: new Proxy({}, { get: (_, prop) => mockConfig[prop] }),
    }));

    const mod = await import('../modules.js');
    warnUnknownModuleKeys = mod.warnUnknownModuleKeys;
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('warns once for a wrong-case key that matches no registered module', () => {
    mockConfig.modules = { Tasks: { activated: false } };
    warnUnknownModuleKeys(['tasks', 'billing']);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Tasks');
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('no registered module');
  });

  it('warns for a typo\'d module name that matches no registered module', () => {
    mockConfig.modules = { taskss: { activated: false } };
    warnUnknownModuleKeys(['tasks', 'billing']);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('taskss');
  });

  it('warns when a registered key has no "activated" property (e.g. wrong prop like display)', () => {
    mockConfig.modules = { tasks: { display: false } };
    warnUnknownModuleKeys(['tasks', 'billing']);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('tasks');
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('activated');
  });

  it('does not warn for a correctly-configured key (activated: false) and the module resolves inactive', async () => {
    mockConfig.modules = { tasks: { activated: false } };
    warnUnknownModuleKeys(['tasks', 'billing']);
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    const { isModuleActive } = await import('../modules.js');
    expect(isModuleActive('tasks')).toBe(false);
  });

  it('does not warn in production mode, even with a wrong-case key', () => {
    vi.stubEnv('MODE', 'production');
    mockConfig.modules = { Tasks: { activated: false } };
    warnUnknownModuleKeys(['tasks']);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('warns at most once per module load, even if called multiple times', () => {
    mockConfig.modules = { Tasks: { activated: false } };
    warnUnknownModuleKeys(['tasks']);
    warnUnknownModuleKeys(['tasks']);
    warnUnknownModuleKeys(['tasks']);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('treats core modules as always registered (no warning for core keys)', () => {
    mockConfig.modules = { home: { activated: false } };
    warnUnknownModuleKeys([]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('does not warn for a core module using "display" only (no "activated") — activated is inert on core modules, so there is nothing to flag', () => {
    mockConfig.modules = { home: { display: false } };
    warnUnknownModuleKeys([]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when config.modules is undefined', () => {
    mockConfig.modules = undefined;
    warnUnknownModuleKeys(['tasks']);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
