import { describe, it, expect, vi, beforeEach } from 'vitest';

import testConfig from '../../../config/defaults/test.config.js';

// Mirror the constant from organizations.router so tests don't hardcode the string
// while avoiding a top-level SFC import (which would conflict with vi.mock hoisting).
// If ORG_PARENT_PATH ever changes, the injection test (which imports the real constant
// inside the test body) will catch the drift before these assertions silently pass.
const ORG_PARENT_PATH = '/users/organizations/:organizationId';

let mockIsModuleActive = () => true;
const mockWarnUnknownModuleKeys = vi.fn();
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (...args) => mockIsModuleActive(...args),
  warnUnknownModuleKeys: (...args) => mockWarnUnknownModuleKeys(...args),
}));

// Mock dependencies used by the router
const mockAuthStore = {
  isLoggedIn: false,
  serverConfig: null,
  user: null,
  refreshAbilities: vi.fn().mockResolvedValue(),
  fetchServerConfig: vi.fn().mockResolvedValue(null),
};
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => mockAuthStore,
}));

vi.mock('../../../lib/services/config', () => ({
  default: testConfig,
}));

const mockAbility = { rules: [], can: vi.fn(() => false) };
vi.mock('../../../lib/helpers/ability.js', () => ({
  ability: mockAbility,
}));

const mockCapturePageview = vi.fn();
vi.mock('../../../lib/helpers/analytics', () => ({
  capturePageview: (...args) => mockCapturePageview(...args),
}));


const mockBillingStore = {
  subscription: null,
  fetchSubscription: vi.fn().mockResolvedValue(),
};
vi.mock('../../billing/stores/billing.store', () => ({
  useBillingStore: () => mockBillingStore,
}));

/**
 * Re-registers all doMock calls and re-imports the router module.
 * Call after vi.resetModules() to get a fresh router with custom mock overrides.
 */
async function setupRouterModule() {
  vi.doMock('../../auth/stores/auth.store', () => ({
    useAuthStore: () => mockAuthStore,
  }));
  vi.doMock('../../../lib/services/config', () => ({
    default: testConfig,
  }));
  vi.doMock('../../../lib/helpers/ability.js', () => ({
    ability: mockAbility,
  }));
  vi.doMock('../../billing/stores/billing.store', () => ({
    useBillingStore: () => mockBillingStore,
  }));
  vi.doMock('../../../lib/helpers/analytics', () => ({
    capturePageview: (...args) => mockCapturePageview(...args),
  }));
  vi.doMock('../../../lib/helpers/modules', () => ({
    isModuleActive: (...args) => mockIsModuleActive(...args),
    warnUnknownModuleKeys: (...args) => mockWarnUnknownModuleKeys(...args),
  }));
  return import('../app.router.js');
}

describe('app.router', () => {
  let getRouter;

  beforeEach(async () => {
    // Re-import fresh for each test
    vi.resetModules();

    // Reset mocks
    mockAuthStore.isLoggedIn = false;
    mockAuthStore.serverConfig = null;
    mockAuthStore.user = null;
    mockAuthStore.refreshAbilities.mockReset().mockResolvedValue();
    mockAuthStore.fetchServerConfig.mockReset().mockResolvedValue(null);
    mockAbility.rules = [];
    mockAbility.can.mockReset();
    mockAbility.can.mockReturnValue(false);
    mockBillingStore.subscription = null;
    mockBillingStore.fetchSubscription.mockReset().mockResolvedValue();
    mockCapturePageview.mockReset();
    mockWarnUnknownModuleKeys.mockReset();
    mockIsModuleActive = () => true;

    const module = await setupRouterModule();
    getRouter = module.default;
  });

  it('creates a router instance', () => {
    const router = getRouter();
    expect(router).toBeDefined();
    expect(typeof router.push).toBe('function');
  });

  it('uses web history (not hash history)', async () => {
    const router = getRouter();
    await router.push('/');
    await router.isReady();
    // With createWebHistory, window.location.hash is empty
    expect(window.location.hash).toBe('');
  });

  it('registers routes from all modules', () => {
    const router = getRouter();
    const routePaths = router.options.routes.map((r) => r.path);
    // home, auth, admin, users, tasks modules all contribute routes
    expect(routePaths.length).toBeGreaterThan(0);
  });

  it('updates document title on route navigation', async () => {
    const router = getRouter();
    router.push('/');
    await router.isReady();
    expect(document.title).toBeTruthy();
  });

  it('prefers meta.title over route name for document title', async () => {
    const router = getRouter();
    await router.push('/does-not-exist');
    await router.isReady();
    expect(document.title).toContain('Page Not Found');
    expect(document.title).not.toContain('NotFound');
  });

  it('renders the NotFound route for unknown paths', async () => {
    const router = getRouter();
    await router.push('/some/unknown/path');
    await router.isReady();
    expect(router.currentRoute.value.name).toBe('NotFound');
  });

  it('redirects to /signin for guarded routes when not logged in', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/tasks');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/signin');
  });

  it('allows guarded routes when logged in with matching ability', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.user = { currentOrganization: null };
    mockAbility.rules = [{ action: 'read', subject: 'Task' }];
    mockAbility.can.mockReturnValue(true);
    const router = getRouter();
    await router.push('/tasks');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/tasks');
  });

  it('redirects to / when logged in but ability denies access', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.user = { currentOrganization: null };
    mockAbility.rules = [{ action: 'read', subject: 'Other' }];
    mockAbility.can.mockReturnValue(false);
    const router = getRouter();
    await router.push('/tasks');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('denies guarded routes via fallback when logged in but no abilities loaded', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.user = { currentOrganization: null };
    mockAbility.rules = [];
    // refreshAbilities doesn't populate rules in the mock, so fallback denies access
    const router = getRouter();
    await router.push('/tasks');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('redirects /organization-required to /signin when not logged in', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/organization-required');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/signin');
  });

  it('allows public routes without auth', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('redirects authenticated users away from auth pages to config.sign.route', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.serverConfig = null;
    mockAuthStore.user = { currentOrganization: 'org1' };
    const router = getRouter();
    await router.push('/signin');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe(testConfig.sign.route);
  });

  it('allows /pricing without organization (org-exempt)', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.serverConfig = { organizations: { enabled: true } };
    mockAuthStore.user = { currentOrganization: null };
    const router = getRouter();
    await router.push('/pricing');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('allows /pricing for unauthenticated users', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/pricing');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/pricing');
  });

  it('/pricing has meta.marketing true (renders outside app shell — no drawer)', async () => {
    const router = getRouter();
    await router.push('/pricing');
    await router.isReady();
    expect(router.currentRoute.value.meta.marketing).toBe(true);
  });

  it('app routes (/, /dashboard-equivalent) do NOT have meta.marketing', async () => {
    const router = getRouter();
    await router.push('/');
    await router.isReady();
    expect(router.currentRoute.value.meta.marketing).toBeFalsy();
  });

  it('/billing redirects to /signin when not logged in (via /users requiresAuth)', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/billing');
    await router.isReady();
    // /billing is now a redirect → /users?tab=subscriptions; /users requiresAuth.
    expect(router.currentRoute.value.path).toBe('/signin');
  });

  it('/billing redirects to /users/billing (account billing view) when logged in', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.user = { currentOrganization: 'org1' };
    mockAbility.rules = [{ action: 'read', subject: 'User' }];
    mockAbility.can.mockReturnValue(true);
    const router = getRouter();
    await router.push('/billing');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/users/billing');
  });

  it('/billing preserves Stripe query params when redirecting to /users/billing', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.user = { currentOrganization: 'org1' };
    mockAbility.rules = [{ action: 'read', subject: 'User' }];
    mockAbility.can.mockReturnValue(true);
    const router = getRouter();
    await router.push('/billing?success=true&type=extras');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/users/billing');
    expect(router.currentRoute.value.query).toEqual({
      success: 'true',
      type: 'extras',
    });
  });

  describe('pageview tracking', () => {
    it('should call capturePageview after navigation', async () => {
      const router = getRouter();
      await router.push('/');
      await router.isReady();
      expect(mockCapturePageview).toHaveBeenCalled();
      const call = mockCapturePageview.mock.calls[0][0];
      expect(call.fullPath).toBe('/');
    });

    it('should call capturePageview with route meta', async () => {
      const router = getRouter();
      await router.push('/does-not-exist');
      await router.isReady();
      const calls = mockCapturePageview.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.meta.title).toBe('Page Not Found');
    });
  });

  describe('requiredPlan guard', () => {
    it('redirects to /pricing when plan is insufficient', async () => {
      mockAuthStore.isLoggedIn = true;
      mockAuthStore.user = { currentOrganization: null };
      mockBillingStore.subscription = { plan: 'free', status: 'active' };
      const router = getRouter();
      // Add a test route with requiredPlan
      router.addRoute({
        path: '/pro-feature',
        name: 'ProFeature',
        component: { template: '<div>Pro</div>' },
        meta: { requiredPlan: 'pro' },
      });
      await router.push('/pro-feature');
      await router.isReady();
      expect(router.currentRoute.value.path).toBe('/pricing');
    });

    it('allows navigation when plan meets requirement', async () => {
      mockAuthStore.isLoggedIn = true;
      mockAuthStore.user = { currentOrganization: null };
      mockBillingStore.subscription = { plan: 'pro', status: 'active' };
      const router = getRouter();
      router.addRoute({
        path: '/pro-feature',
        name: 'ProFeature',
        component: { template: '<div>Pro</div>' },
        meta: { requiredPlan: 'pro' },
      });
      await router.push('/pro-feature');
      await router.isReady();
      expect(router.currentRoute.value.path).toBe('/pro-feature');
    });

    it('allows higher-tier plan to access lower-tier route', async () => {
      mockAuthStore.isLoggedIn = true;
      mockAuthStore.user = { currentOrganization: null };
      mockBillingStore.subscription = { plan: 'pro', status: 'active' };
      const router = getRouter();
      router.addRoute({
        path: '/starter-feature',
        name: 'StarterFeature',
        component: { template: '<div>Starter</div>' },
        meta: { requiredPlan: 'starter' },
      });
      await router.push('/starter-feature');
      await router.isReady();
      expect(router.currentRoute.value.path).toBe('/starter-feature');
    });

    it('skips gate when subscription is unknown (API failure)', async () => {
      mockAuthStore.isLoggedIn = true;
      mockAuthStore.user = { currentOrganization: null };
      mockBillingStore.subscription = null;
      mockBillingStore.fetchSubscription.mockRejectedValueOnce(new Error('API down'));
      const router = getRouter();
      router.addRoute({
        path: '/gated-feature',
        name: 'GatedFeature',
        component: { template: '<div>Gated</div>' },
        meta: { requiredPlan: 'pro' },
      });
      await router.push('/gated-feature');
      await router.isReady();
      // Should allow navigation when subscription is unknown to avoid blocking paid users
      expect(router.currentRoute.value.path).toBe('/gated-feature');
    });
  });

  describe('organizationChildModules injection point', () => {
    it('org parent route ORG_PARENT_PATH has a children array (injection seam)', () => {
      const router = getRouter();
      const orgParent = router.options.routes.find(
        (r) => r.path === ORG_PARENT_PATH,
      );
      expect(orgParent).toBeDefined();
      expect(Array.isArray(orgParent.children)).toBe(true);
    });

    it('org parent children array contains the billing route when billing module is active', async () => {
      // C2: billing is now wired into organizationChildModules. When billing is active,
      // the org parent's children array must contain the injected billing child route.
      vi.resetModules();
      mockIsModuleActive = () => true;
      const mod = await setupRouterModule();
      const router = mod.default();
      const orgParent = router.options.routes.find(
        (r) => r.path === '/users/organizations/:organizationId',
      );
      expect(Array.isArray(orgParent.children)).toBe(true);
      // C2 injects billing — expect at least the billing child
      const billingChild = orgParent.children.find((c) => c.path === 'billing');
      expect(billingChild).toBeDefined();
      expect(billingChild.name).toBe('Account Organization Billing');
    });

    it('billing route is NOT injected under org parent when billing module is inactive', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'billing';
      const mod = await setupRouterModule();
      const router = mod.default();
      const orgParent = router.options.routes.find(
        (r) => r.path === '/users/organizations/:organizationId',
      );
      // Org module is active, so parent exists
      expect(orgParent).toBeDefined();
      expect(Array.isArray(orgParent.children)).toBe(true);
      // Billing inactive → not injected under org parent
      const billingChild = orgParent.children.find((c) => c.path === 'billing');
      expect(billingChild).toBeUndefined();
    });

    it('a child module in organizationChildModules is injected under the org parent (ORG_PARENT_PATH)', async () => {
      vi.resetModules();
      mockIsModuleActive = () => true;

      // Import ORG_PARENT_PATH from the real module (after resetModules) so that
      // the assertion uses the constant itself — guards FIX 1 from regressing.
      const { ORG_PARENT_PATH: orgParentPath } = await import('../../organizations/router/organizations.router');

      // Fake child route with a relative path + component (required by isValidChildRoute).
      const fakeChildRoute = { path: 'billing', name: 'FakeBilling', component: { template: '<div />' } };

      // Reset modules again so app.router.js picks up the mocks below.
      vi.resetModules();

      // Mock the organizations router so its default export includes only the org
      // parent route with the injection seam (empty children array).
      vi.doMock('../../organizations/router/organizations.router', () => ({
        ORG_PARENT_PATH: orgParentPath,
        default: [
          {
            path: orgParentPath,
            name: 'Account Organization',
            component: { template: '<div />' },
            meta: { display: false, action: 'read', subject: 'Organization' },
            children: [],
          },
        ],
      }));

      // Intercept injectModuleChildren for the org surface and substitute our fake
      // child module — exercises the injection path end-to-end with real helper logic.
      vi.doMock('../../../lib/helpers/router', async (importOriginal) => {
        const original = await importOriginal();
        return {
          ...original,
          injectModuleChildren: (routes, childModules, isActive, parentPath) => {
            if (parentPath === orgParentPath) {
              return original.injectModuleChildren(
                routes,
                [{ name: 'fake-billing', routes: [fakeChildRoute] }],
                () => true,
                parentPath,
              );
            }
            return original.injectModuleChildren(routes, childModules, isActive, parentPath);
          },
        };
      });

      try {
        const mod = await setupRouterModule();
        const router = mod.default();

        // The org parent must be found via ORG_PARENT_PATH — not a hardcoded string.
        const orgParent = router.options.routes.find((r) => r.path === orgParentPath);
        expect(orgParent).toBeDefined();
        expect(Array.isArray(orgParent.children)).toBe(true);
        // The fake child module's route must appear under the org parent.
        const injected = orgParent.children.find((c) => c.path === fakeChildRoute.path);
        expect(injected).toBeDefined();
        expect(injected.name).toBe(fakeChildRoute.name);
      } finally {
        // Always remove test-local mocks so they don't bleed into subsequent tests.
        vi.doUnmock('../../organizations/router/organizations.router');
        vi.doUnmock('../../../lib/helpers/router');
      }
    });

    it('inactive organizations module does not expose the org parent route', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'organizations';
      const mod = await setupRouterModule();
      const router = mod.default();
      const orgParent = router.options.routes.find(
        (r) => r.path === ORG_PARENT_PATH,
      );
      // When the module is inactive, the route is excluded entirely
      expect(orgParent).toBeUndefined();
    });
  });

  describe('invitations module injection (P6 — optional-module guarantee)', () => {
    it('injects the invitations child route under BOTH /admin and /users when the module is active', async () => {
      vi.resetModules();
      mockIsModuleActive = () => true;
      const mod = await setupRouterModule();
      const router = mod.default();
      const adminParent = router.options.routes.find((r) => r.path === '/admin');
      const accountParent = router.options.routes.find((r) => r.path === '/users');
      expect(adminParent).toBeDefined();
      expect(accountParent).toBeDefined();
      expect(adminParent.children.find((c) => c.path === 'invitations')).toBeDefined();
      expect(accountParent.children.find((c) => c.path === 'invitations')).toBeDefined();
    });

    it('does NOT inject the invitations child route under /admin or /users when the module is inactive (admin + account surfaces still work)', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'invitations';
      const mod = await setupRouterModule();
      const router = mod.default();
      const adminParent = router.options.routes.find((r) => r.path === '/admin');
      const accountParent = router.options.routes.find((r) => r.path === '/users');
      // The host surfaces remain — the optional module's absence must not break them.
      expect(adminParent).toBeDefined();
      expect(accountParent).toBeDefined();
      // ...but the invitations tab/route is absent from both.
      expect((adminParent.children || []).find((c) => c.path === 'invitations')).toBeUndefined();
      expect((accountParent.children || []).find((c) => c.path === 'invitations')).toBeUndefined();
    });
  });

  describe('module activation gating', () => {
    it('includes all module routes when all modules are active', () => {
      mockIsModuleActive = () => true;
      const router = getRouter();
      const paths = router.options.routes.map((r) => r.path);
      expect(paths).toContain('/tasks');
      expect(paths).toContain('/billing');
      expect(paths).toContain('/admin');
      expect(paths).toContain('/organization-required');
    });

    it('excludes tasks routes when tasks module is deactivated', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'tasks';

      const mod = await setupRouterModule();
      const router = mod.default();
      const paths = router.options.routes.map((r) => r.path);
      expect(paths).not.toContain('/tasks');
      expect(paths).not.toContain('/task');
      expect(paths).not.toContain('/tasks/:id');
      // Core routes still present
      expect(paths).toContain('/');
      expect(paths).toContain('/signin');
    });

    it('always includes core routes (home, auth, users) regardless of config', async () => {
      vi.resetModules();
      // Deactivate everything
      mockIsModuleActive = (name) => ['home', 'auth', 'users', 'app', 'core'].includes(name);

      const mod = await setupRouterModule();
      const router = mod.default();
      const paths = router.options.routes.map((r) => r.path);
      // Core routes always present
      expect(paths).toContain('/');
      expect(paths).toContain('/signin');
      expect(paths).toContain('/signup');
      // Optional routes excluded
      expect(paths).not.toContain('/tasks');
      expect(paths).not.toContain('/admin');
      expect(paths).not.toContain('/billing');
    });

    it('redirects to / for deactivated module paths (guard intercepts before NotFound)', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'tasks';

      const mod = await setupRouterModule();
      const router = mod.default();
      await router.push('/tasks');
      await router.isReady();
      // The disabled-module beforeEach guard intercepts the navigation and redirects to /
      expect(router.currentRoute.value.path).toBe('/');
    });

    it('redirects to / when navigating to a disabled module path via URL', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'billing';

      const mod = await setupRouterModule();
      const router = mod.default();
      // Add a fake billing-like route so it is not caught as NotFound
      router.addRoute({ path: '/billing', name: 'BillingFake', component: { template: '<div />' } });
      await router.push('/billing');
      await router.isReady();
      // The disabled-module guard should redirect to /
      expect(router.currentRoute.value.path).toBe('/');
    });
  });

  describe('warnUnknownModuleKeys wiring', () => {
    it('is called with names from every isModuleActive-gated registry (optionalModules + admin/account/organization child modules), not just optionalModules', () => {
      const router = getRouter();
      expect(router).toBeDefined();
      expect(mockWarnUnknownModuleKeys).toHaveBeenCalledTimes(1);

      const [moduleArg] = mockWarnUnknownModuleKeys.mock.calls[0];
      const names = typeof moduleArg === 'function' ? moduleArg() : moduleArg;

      // optionalModules
      expect(names).toContain('tasks');
      expect(names).toContain('billing');
      expect(names).toContain('admin');
      expect(names).toContain('organizations');
      // adminChildModules / accountChildModules — NOT in optionalModules,
      // only reachable via the child-module registries (regression guard).
      expect(names).toContain('invitations');
    });

    it('is also called with the mounted route names (same list useCoreStore.refreshNav consults), so a display-only nav override is not mistaken for an unregistered module', () => {
      const router = getRouter();
      const routePaths = router.options.routes.map((r) => r.path);
      expect(routePaths).toContain('/tasks'); // sanity: tasks module is mounted in this test

      const [, routeArg] = mockWarnUnknownModuleKeys.mock.calls[0];
      const routeNames = typeof routeArg === 'function' ? routeArg() : routeArg;

      expect(routeNames).toContain('Tasks');
      expect(routeNames.length).toBeGreaterThan(0);
    });
  });
});

describe('registerDownstreamRoutes', () => {
  /**
   * Each test resets modules so it gets a fresh registry (arrays start empty).
   * registerDownstreamRoutes is imported from the same fresh module instance
   * as getRouter, so mutations are visible to the composition.
   */
  async function setupFreshModule(registerFn) {
    vi.resetModules();
    vi.doMock('../../auth/stores/auth.store', () => ({
      useAuthStore: () => mockAuthStore,
    }));
    vi.doMock('../../../lib/services/config', () => ({
      default: testConfig,
    }));
    vi.doMock('../../../lib/helpers/ability.js', () => ({
      ability: mockAbility,
    }));
    vi.doMock('../../billing/stores/billing.store', () => ({
      useBillingStore: () => mockBillingStore,
    }));
    vi.doMock('../../../lib/helpers/analytics', () => ({
      capturePageview: (...args) => mockCapturePageview(...args),
    }));
    vi.doMock('../../../lib/helpers/modules', () => ({
      isModuleActive: (...args) => mockIsModuleActive(...args),
      warnUnknownModuleKeys: (...args) => mockWarnUnknownModuleKeys(...args),
    }));
    const mod = await import('../app.router.js');
    if (registerFn) registerFn(mod.registerDownstreamRoutes);
    return mod;
  }

  beforeEach(() => {
    mockIsModuleActive = () => true;
    mockAuthStore.isLoggedIn = false;
    mockAuthStore.serverConfig = null;
    mockAuthStore.user = null;
  });

  it('(a) routes work unchanged when registerDownstreamRoutes is never called', async () => {
    const mod = await setupFreshModule(null);
    const router = mod.default();
    const paths = router.options.routes.map((r) => r.path);
    // Stack-defined routes must still exist
    expect(paths).toContain('/');
    expect(paths).toContain('/signin');
    expect(paths).toContain('/tasks');
    expect(paths).toContain('/admin');
  });

  it('(b) calling registerDownstreamRoutes({ optionalModules }) adds the route to the compiled list', async () => {
    const fakeRoute = { path: '/downstream-feature', name: 'DownstreamFeature', component: { template: '<div />' } };
    const mod = await setupFreshModule((register) => {
      register({ optionalModules: [{ name: 'downstream-feature', routes: [fakeRoute] }] });
    });
    const router = mod.default();
    const paths = router.options.routes.map((r) => r.path);
    expect(paths).toContain('/downstream-feature');
  });

  it('(b) calling registerDownstreamRoutes({ coreModules }) adds core route (no activation gate)', async () => {
    const fakeRoute = { path: '/ds-core', name: 'DsCore', component: { template: '<div />' } };
    const mod = await setupFreshModule((register) => {
      register({ coreModules: [fakeRoute] });
    });
    const router = mod.default();
    const paths = router.options.routes.map((r) => r.path);
    expect(paths).toContain('/ds-core');
  });

  it('(b) registerDownstreamRoutes({ adminChildModules }) populates adminChildModules before injectAdminChildren runs', async () => {
    // We verify indirectly: the downstream admin module entry must not throw and
    // the router must still create without error.
    const fakeAdminChild = { path: 'ds-admin-tab', name: 'DsAdminTab', component: { template: '<div />' } };
    let caughtError = null;
    try {
      const mod = await setupFreshModule((register) => {
        register({ adminChildModules: [{ name: 'ds-admin-tab', routes: [fakeAdminChild] }] });
      });
      mod.default(); // must not throw
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeNull();
  });

  it('(c) stack routes appear before downstream routes in the compiled list', async () => {
    const fakeRoute = { path: '/downstream-last', name: 'DownstreamLast', component: { template: '<div />' } };
    const mod = await setupFreshModule((register) => {
      register({ optionalModules: [{ name: 'downstream-last', routes: [fakeRoute] }] });
    });
    const router = mod.default();
    const paths = router.options.routes.map((r) => r.path);
    const homeIdx = paths.indexOf('/');
    const dsIdx = paths.indexOf('/downstream-last');
    // Stack home route must appear BEFORE the downstream-injected route
    expect(homeIdx).toBeGreaterThanOrEqual(0);
    expect(dsIdx).toBeGreaterThan(homeIdx);
  });

  it('(c) downstream optional module is gated by isModuleActive', async () => {
    const fakeRoute = { path: '/gated-ds', name: 'GatedDs', component: { template: '<div />' } };
    // Deactivate the downstream module
    mockIsModuleActive = (name) => name !== 'gated-ds';
    const mod = await setupFreshModule((register) => {
      register({ optionalModules: [{ name: 'gated-ds', routes: [fakeRoute] }] });
    });
    const router = mod.default();
    const paths = router.options.routes.map((r) => r.path);
    expect(paths).not.toContain('/gated-ds');
  });

  it('registerDownstreamRoutes is a named export of app.router.js', async () => {
    const mod = await setupFreshModule(null);
    expect(typeof mod.registerDownstreamRoutes).toBe('function');
  });
});
