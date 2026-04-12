import { describe, it, expect } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import adminRoutes from '../router/admin.router';
import { injectAdminChildren } from '../../../lib/helpers/router';

describe('admin.router (structure)', () => {
  it('should export a single parent route at /admin with a children array', () => {
    expect(adminRoutes).toHaveLength(1);
    const parent = adminRoutes[0];
    expect(parent.path).toBe('/admin');
    expect(Array.isArray(parent.children)).toBe(true);
  });

  it('should expose Admin / Admin User / Admin Organization as child routes', () => {
    const names = adminRoutes[0].children.map((r) => r.name);
    expect(names).toContain('Admin');
    expect(names).toContain('Admin User');
    expect(names).toContain('Admin Organization');
  });

  it('should use relative paths for all children', () => {
    for (const child of adminRoutes[0].children) {
      expect(child.path.startsWith('/')).toBe(false);
    }
  });

  it('should propagate CASL meta (action+subject) to all child routes', () => {
    const parent = adminRoutes[0];
    expect(parent.meta.action).toBe('manage');
    expect(parent.meta.subject).toBe('UserAdmin');
    for (const child of parent.children) {
      expect(child.meta.action).toBe('manage');
      expect(child.meta.subject).toBe('UserAdmin');
    }
  });

  it('should hide detail views from nav via meta.display = false', () => {
    const user = adminRoutes[0].children.find((r) => r.name === 'Admin User');
    const org = adminRoutes[0].children.find((r) => r.name === 'Admin Organization');
    expect(user.meta.display).toBe(false);
    expect(org.meta.display).toBe(false);
  });
});

/**
 * Clone the admin routes so integration tests don't mutate the module-level
 * export (vitest re-uses imports across describe blocks).
 * @returns {Array<object>}
 */
const cloneRoutes = () =>
  adminRoutes.map((r) => ({
    ...r,
    children: [...r.children],
  }));

describe('admin.router (integration with vue-router)', () => {
  /**
   * Build a router loaded with the admin routes plus a dummy home route.
   * @param {Array<object>} [childInjections=[]] - Downstream modules to inject.
   * @returns {import('vue-router').Router}
   */
  const buildRouter = (childInjections = []) => {
    const routes = cloneRoutes();
    if (childInjections.length) {
      injectAdminChildren(routes, childInjections, () => true);
    }
    return createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'Home', component: { template: '<div />' } }, ...routes],
    });
  };

  it('should resolve /admin to the nested Admin child route', async () => {
    const router = buildRouter();
    await router.push('/admin');
    const matched = router.currentRoute.value.matched;
    // matched[0] = layout parent, matched[1] = the empty child "Admin"
    expect(matched.length).toBe(2);
    expect(matched[0].path).toBe('/admin');
    expect(matched[1].name).toBe('Admin');
  });

  it('should resolve /admin/users/:id to Admin User via the layout parent', async () => {
    const router = buildRouter();
    await router.push('/admin/users/abc123');
    const matched = router.currentRoute.value.matched;
    expect(matched.length).toBe(2);
    expect(matched[0].path).toBe('/admin');
    expect(matched[1].name).toBe('Admin User');
    expect(router.currentRoute.value.params.id).toBe('abc123');
  });

  it('should resolve /admin/organizations/:organizationId', async () => {
    const router = buildRouter();
    await router.push('/admin/organizations/org42');
    expect(router.currentRoute.value.name).toBe('Admin Organization');
    expect(router.currentRoute.value.params.organizationId).toBe('org42');
  });

  it('should deep-link to an injected child route (e.g. /admin/knowledge)', async () => {
    const knowledge = [
      {
        path: 'knowledge',
        name: 'Admin Knowledge',
        component: { template: '<div />' },
        meta: { action: 'manage', subject: 'UserAdmin' },
      },
    ];
    const router = buildRouter([{ name: 'knowledge', routes: knowledge }]);
    await router.push('/admin/knowledge');
    const matched = router.currentRoute.value.matched;
    expect(matched.length).toBe(2);
    expect(matched[0].path).toBe('/admin');
    expect(matched[1].name).toBe('Admin Knowledge');
    // CASL meta propagated via matched[1]
    expect(matched[1].meta.action).toBe('manage');
    expect(matched[1].meta.subject).toBe('UserAdmin');
  });

  it('should preserve layout parent across tab navigation (back/forward)', async () => {
    const knowledge = [
      { path: 'knowledge', name: 'Admin Knowledge', component: { template: '<div />' } },
    ];
    const router = buildRouter([{ name: 'knowledge', routes: knowledge }]);
    await router.push('/admin');
    const beforeLayout = router.currentRoute.value.matched[0];
    await router.push('/admin/knowledge');
    const afterLayout = router.currentRoute.value.matched[0];
    // Same parent layout component instance => tabs don't unmount
    expect(afterLayout.path).toBe(beforeLayout.path);
    expect(afterLayout.components.default).toBe(beforeLayout.components.default);
    // Go back
    await router.go(-1);
    await router.isReady();
  });

  it('should not inject disabled modules', async () => {
    const routes = cloneRoutes();
    injectAdminChildren(
      routes,
      [{ name: 'knowledge', routes: [{ path: 'knowledge', name: 'Admin Knowledge', component: { template: '<div />' } }] }],
      (name) => name !== 'knowledge',
    );
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }, ...routes],
    });
    await router.push('/admin/knowledge');
    // Unmatched → falls back to current route, which stays '/'.
    expect(router.currentRoute.value.matched.some((r) => r.name === 'Admin Knowledge')).toBe(false);
  });

  it('should still work when no extra tabs are configured (no regression)', async () => {
    const router = buildRouter();
    await router.push('/admin');
    expect(router.currentRoute.value.name).toBe('Admin');
    expect(router.currentRoute.value.matched.length).toBe(2);
  });
});
