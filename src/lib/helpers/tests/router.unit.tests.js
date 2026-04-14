import { describe, it, expect, vi } from 'vitest';
import { injectAdminChildren } from '../router';

/**
 * Build a fresh admin route array for each test so mutations don't leak.
 * @returns {Array<object>}
 */
const makeAdminRoutes = () => [
  {
    path: '/admin',
    component: { name: 'AdminLayout' },
    children: [
      { path: 'users', name: 'Admin Users', component: { name: 'AdminUsers' } },
      { path: 'users/:id', name: 'Admin User', component: { name: 'AdminUser' } },
    ],
  },
];

const knowledgeRoutes = [
  { path: 'knowledge', name: 'Admin Knowledge', component: { name: 'Knowledge' } },
];

const costsRoutes = [
  { path: 'costs', name: 'Admin Costs', component: { name: 'Costs' } },
];

describe('injectAdminChildren', () => {
  it('should be a no-op when childModules is empty (0 modules)', () => {
    const admin = makeAdminRoutes();
    const before = admin[0].children.length;
    injectAdminChildren(admin, [], () => true);
    expect(admin[0].children.length).toBe(before);
  });

  it('should inject 1 active module', () => {
    const admin = makeAdminRoutes();
    injectAdminChildren(
      admin,
      [{ name: 'knowledge', routes: knowledgeRoutes }],
      () => true,
    );
    expect(admin[0].children.length).toBe(3);
    expect(admin[0].children.some((r) => r.name === 'Admin Knowledge')).toBe(true);
  });

  it('should inject N active modules in order', () => {
    const admin = makeAdminRoutes();
    injectAdminChildren(
      admin,
      [
        { name: 'knowledge', routes: knowledgeRoutes },
        { name: 'costs', routes: costsRoutes },
      ],
      () => true,
    );
    expect(admin[0].children.length).toBe(4);
    const names = admin[0].children.map((r) => r.name);
    expect(names).toContain('Admin Knowledge');
    expect(names).toContain('Admin Costs');
    expect(names.indexOf('Admin Knowledge')).toBeLessThan(names.indexOf('Admin Costs'));
  });

  it('should skip disabled modules', () => {
    const admin = makeAdminRoutes();
    const isModuleActive = vi.fn((name) => name !== 'costs');
    injectAdminChildren(
      admin,
      [
        { name: 'knowledge', routes: knowledgeRoutes },
        { name: 'costs', routes: costsRoutes },
      ],
      isModuleActive,
    );
    expect(admin[0].children.length).toBe(3);
    expect(admin[0].children.some((r) => r.name === 'Admin Knowledge')).toBe(true);
    expect(admin[0].children.some((r) => r.name === 'Admin Costs')).toBe(false);
    expect(isModuleActive).toHaveBeenCalledWith('knowledge');
    expect(isModuleActive).toHaveBeenCalledWith('costs');
  });

  it('should be a no-op when no admin parent route is present', () => {
    const admin = [{ path: '/other', component: { name: 'Other' } }];
    const result = injectAdminChildren(
      admin,
      [{ name: 'knowledge', routes: knowledgeRoutes }],
      () => true,
    );
    expect(result).toBe(admin);
    expect(admin[0].path).toBe('/other');
  });

  it('should return the same admin reference (chaining)', () => {
    const admin = makeAdminRoutes();
    const result = injectAdminChildren(admin, [], () => true);
    expect(result).toBe(admin);
  });

  it('should skip malformed module entries (missing routes)', () => {
    const admin = makeAdminRoutes();
    injectAdminChildren(
      admin,
      [
        null,
        { name: 'broken' },
        { routes: knowledgeRoutes },
        { name: 'ok', routes: costsRoutes },
      ],
      () => true,
    );
    expect(admin[0].children.length).toBe(3);
    expect(admin[0].children.some((r) => r.name === 'Admin Costs')).toBe(true);
  });

  it('should accept a missing isModuleActive callback as always-active', () => {
    const admin = makeAdminRoutes();
    injectAdminChildren(admin, [{ name: 'knowledge', routes: knowledgeRoutes }]);
    expect(admin[0].children.length).toBe(3);
  });

  it('should return adminRoutes unchanged when it is not an array', () => {
    expect(injectAdminChildren(null, [{ name: 'x', routes: [] }], () => true)).toBeNull();
    expect(injectAdminChildren(undefined, [], () => true)).toBeUndefined();
  });

  it('should filter out routes with absolute paths and warn', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = makeAdminRoutes();
    const bad = [
      { path: '/admin/bad', name: 'Bad', component: { name: 'Bad' } },
      { path: 'good', name: 'Good', component: { name: 'Good' } },
    ];
    injectAdminChildren(admin, [{ name: 'mixed', routes: bad }], () => true);
    const names = admin[0].children.map((r) => r.name);
    expect(names).toContain('Good');
    expect(names).not.toContain('Bad');
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('absolute path'));
    consoleWarnSpy.mockRestore();
  });

  it('should filter out routes missing a path', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = makeAdminRoutes();
    const bad = [
      { name: 'NoPath', component: { name: 'X' } },
      { path: '', name: 'EmptyPath', component: { name: 'X' } },
      { path: 'ok', name: 'Ok', component: { name: 'Ok' } },
    ];
    injectAdminChildren(admin, [{ name: 'test', routes: bad }], () => true);
    const names = admin[0].children.map((r) => r.name);
    expect(names).toContain('Ok');
    expect(names).not.toContain('NoPath');
    expect(names).not.toContain('EmptyPath');
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should filter out routes without a component', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const admin = makeAdminRoutes();
    const bad = [
      { path: 'no-component', name: 'NoComp' },
      { path: 'ok', name: 'Ok', component: { name: 'Ok' } },
    ];
    injectAdminChildren(admin, [{ name: 'test', routes: bad }], () => true);
    const names = admin[0].children.map((r) => r.name);
    expect(names).toContain('Ok');
    expect(names).not.toContain('NoComp');
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('missing component'));
    consoleWarnSpy.mockRestore();
  });

  it('should propagate CASL meta fields on injected children', () => {
    const admin = makeAdminRoutes();
    const guarded = [
      {
        path: 'secret',
        name: 'Admin Secret',
        component: { name: 'Secret' },
        meta: { action: 'manage', subject: 'UserAdmin' },
      },
    ];
    injectAdminChildren(admin, [{ name: 'secret', routes: guarded }], () => true);
    const injected = admin[0].children.find((r) => r.name === 'Admin Secret');
    expect(injected.meta.action).toBe('manage');
    expect(injected.meta.subject).toBe('UserAdmin');
  });
});
