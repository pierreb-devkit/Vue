import { describe, it, expect } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import adminRoutes from '../router/admin.router';
import { injectAdminChildren } from '../../../lib/helpers/router';
import { isValidTab } from '../../../lib/helpers/surface-tabs';

describe('admin.router (structure)', () => {
  it('should export a single parent route at /admin with a children array', () => {
    expect(adminRoutes).toHaveLength(1);
    const parent = adminRoutes[0];
    expect(parent.path).toBe('/admin');
    expect(Array.isArray(parent.children)).toBe(true);
  });

  it('should expose the parent and the four built-in + detail children', () => {
    expect(adminRoutes[0].name).toBe('Admin');
    const names = adminRoutes[0].children.map((r) => r.name).filter(Boolean);
    expect(names).toContain('Admin Users');
    expect(names).toContain('Admin Organizations');
    expect(names).toContain('Admin Readiness');
    expect(names).toContain('Admin Activity');
    expect(names).toContain('Admin User');
    expect(names).toContain('Admin Organization');
  });

  it('should redirect the empty child path to Admin Users', () => {
    const empty = adminRoutes[0].children.find((r) => r.path === '');
    expect(empty).toBeDefined();
    expect(empty.redirect).toEqual({ name: 'Admin Users' });
  });

  it('should use relative paths for all children', () => {
    for (const child of adminRoutes[0].children) {
      expect(child.path.startsWith('/')).toBe(false);
    }
  });

  it('should propagate CASL meta (action+subject) to all named child routes', () => {
    const parent = adminRoutes[0];
    expect(parent.meta.action).toBe('manage');
    expect(parent.meta.subject).toBe('UserAdmin');
    for (const child of parent.children) {
      if (!child.name) continue; // skip the redirect-only child
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

  it('should redirect /admin to /admin/users', async () => {
    const router = buildRouter();
    await router.push('/admin');
    expect(router.currentRoute.value.path).toBe('/admin/users');
    expect(router.currentRoute.value.name).toBe('Admin Users');
  });

  it('should resolve /admin/users to the Admin Users child route via the layout parent', async () => {
    const router = buildRouter();
    await router.push('/admin/users');
    const matched = router.currentRoute.value.matched;
    expect(matched.length).toBe(2);
    expect(matched[0].path).toBe('/admin');
    expect(matched[0].name).toBe('Admin');
    expect(matched[1].name).toBe('Admin Users');
  });

  it('should resolve /admin/organizations, /admin/readiness, /admin/activity', async () => {
    const router = buildRouter();
    await router.push('/admin/organizations');
    expect(router.currentRoute.value.name).toBe('Admin Organizations');
    await router.push('/admin/readiness');
    expect(router.currentRoute.value.name).toBe('Admin Readiness');
    await router.push('/admin/activity');
    expect(router.currentRoute.value.name).toBe('Admin Activity');
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
    await router.push('/admin/users');
    const beforeLayout = router.currentRoute.value.matched[0];
    await router.push('/admin/knowledge');
    const afterLayout = router.currentRoute.value.matched[0];
    // Same parent layout component instance => tabs don't unmount
    expect(afterLayout.path).toBe(beforeLayout.path);
    expect(afterLayout.components.default).toBe(beforeLayout.components.default);
    // Go back — should return to /admin/users with the same parent layout.
    await new Promise((resolve) => {
      router.back();
      router.afterEach(() => resolve());
    });
    expect(router.currentRoute.value.path).toBe('/admin/users');
    expect(router.currentRoute.value.name).toBe('Admin Users');
    expect(router.currentRoute.value.matched[0].components.default).toBe(beforeLayout.components.default);
    // Go forward — should return to /admin/knowledge, parent still the same.
    await new Promise((resolve) => {
      router.forward();
      router.afterEach(() => resolve());
    });
    expect(router.currentRoute.value.path).toBe('/admin/knowledge');
    expect(router.currentRoute.value.name).toBe('Admin Knowledge');
    expect(router.currentRoute.value.matched[0].components.default).toBe(beforeLayout.components.default);
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
    await router.push('/admin/users');
    expect(router.currentRoute.value.name).toBe('Admin Users');
    expect(router.currentRoute.value.matched.length).toBe(2);
    expect(router.currentRoute.value.matched[0].name).toBe('Admin');
  });
});

/**
 * Trawl-shape regression guard.
 *
 * Trawl's app.router calls injectAdminChildren with adminChildModules of shape
 *   [{ name, routes }]
 * where each route looks like:
 *   { path: 'costs', name: 'Admin Costs', component: () => import(...),
 *     meta: { display: false, action: 'manage', subject: 'UserAdmin' } }
 * and config.admin.tabs entries look like:
 *   { value: 'costs', label: 'Costs', icon: 'fa-solid fa-coins', route: 'costs' }
 *
 * This test suite is characterization-only: the behaviour is already correct after
 * the B1–B4 refactor; these assertions guard against future regressions.
 */
describe('admin.router (Trawl-shape regression)', () => {
  /**
   * Canonical Trawl-shaped child module: exactly the shape Trawl ships.
   */
  const trawlAdminChildModules = [
    {
      name: 'costs',
      routes: [
        {
          path: 'costs',
          name: 'Admin Costs',
          component: () => Promise.resolve({}),
          meta: { display: false, action: 'manage', subject: 'UserAdmin' },
        },
      ],
    },
  ];

  /**
   * Canonical Trawl-shaped tab descriptor for the same surface.
   */
  const trawlCostsTab = { value: 'costs', label: 'Costs', icon: 'fa-solid fa-coins', route: 'costs' };

  it('injects the costs route under /admin with meta intact (action, subject, display)', () => {
    const routes = cloneRoutes();
    injectAdminChildren(routes, trawlAdminChildModules, () => true);
    const parent = routes[0];
    const injected = parent.children.find((r) => r.name === 'Admin Costs');

    // Assertion 1: route appears under the /admin parent
    expect(injected).toBeDefined();
    expect(parent.path).toBe('/admin');

    // Assertion 2: path and name pass through isValidChildRoute unmodified
    expect(injected.path).toBe('costs');
    expect(injected.name).toBe('Admin Costs');

    // Assertion 3: full meta preserved (display:false + CASL pair)
    expect(injected.meta.action).toBe('manage');
    expect(injected.meta.subject).toBe('UserAdmin');
    expect(injected.meta.display).toBe(false);
  });

  it('Trawl costs tab descriptor passes isValidTab', () => {
    // Assertion 4: Trawl-shaped config.admin.tabs entry is valid per hoisted isValidTab
    expect(isValidTab(trawlCostsTab)).toBe(true);
  });

  it('does NOT inject the costs module when it is inactive', () => {
    const routes = cloneRoutes();
    injectAdminChildren(routes, trawlAdminChildModules, (name) => name !== 'costs');
    const parent = routes[0];
    const injected = parent.children.find((r) => r.name === 'Admin Costs');

    // Inactive module must not appear in the parent children array
    expect(injected).toBeUndefined();
  });

  it('resolves /admin/costs in vue-router when the costs module is active', async () => {
    const routes = cloneRoutes();
    injectAdminChildren(routes, trawlAdminChildModules, () => true);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'Home', component: { template: '<div />' } }, ...routes],
    });
    await router.push('/admin/costs');
    const matched = router.currentRoute.value.matched;
    expect(matched.length).toBe(2);
    expect(matched[0].path).toBe('/admin');
    expect(matched[1].name).toBe('Admin Costs');
  });
});
