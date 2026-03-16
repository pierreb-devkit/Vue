import { describe, it, expect, vi, beforeEach } from 'vitest';

import testConfig from '../../../config/defaults/test.config.js';

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


const mockBillingStore = {
  subscription: null,
  fetchSubscription: vi.fn().mockResolvedValue(),
};
vi.mock('../../billing/stores/billing.store', () => ({
  useBillingStore: () => mockBillingStore,
}));

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

    // Re-apply mocks after resetModules
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

    const module = await import('../app.router.js');
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

  it('allows public routes without auth', async () => {
    mockAuthStore.isLoggedIn = false;
    const router = getRouter();
    await router.push('/');
    await router.isReady();
    expect(router.currentRoute.value.path).toBe('/');
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
});
