import { describe, it, expect, vi, beforeEach } from 'vitest';

import testConfig from '../../../config/defaults/test.config.js';

let mockIsModuleActive = () => true;
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (...args) => mockIsModuleActive(...args),
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

  it('redirects /billing to /signin when not logged in', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/billing');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/signin');
  });

  it('allows /billing when logged in with matching ability', async () => {
    mockAuthStore.isLoggedIn = true;
    mockAuthStore.user = { currentOrganization: 'org1' };
    mockAbility.rules = [{ action: 'read', subject: 'Billing' }];
    mockAbility.can.mockReturnValue(true);
    const router = getRouter();
    await router.push('/billing');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/billing');
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

  describe('module activation gating', () => {
    it('includes all module routes when all modules are active', () => {
      mockIsModuleActive = () => true;
      const router = getRouter();
      const paths = router.options.routes.map((r) => r.path);
      expect(paths).toContain('/tasks');
      expect(paths).toContain('/billing');
      expect(paths).toContain('/admin');
      expect(paths).toContain('/developers');
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
      expect(paths).not.toContain('/developers');
    });

    it('renders NotFound for deactivated module paths', async () => {
      vi.resetModules();
      mockIsModuleActive = (name) => name !== 'tasks';

      const mod = await setupRouterModule();
      const router = mod.default();
      await router.push('/tasks');
      await router.isReady();
      expect(router.currentRoute.value.name).toBe('NotFound');
    });
  });
});
