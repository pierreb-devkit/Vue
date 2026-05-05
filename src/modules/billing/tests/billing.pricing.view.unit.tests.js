import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// ─── Prevent real HTTP calls ────────────────────────────────────────────────

vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
}));

// ─── Mutable auth store state ───────────────────────────────────────────────

const authState = vi.hoisted(() => ({
  isLoggedIn: true,
  user: null,
  serverConfig: null,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { createI18n } from 'vue-i18n';
import { useBillingStore } from '../stores/billing.store';
import BillingPricingView from '../views/billing.pricing.view.vue';
import { billingEn } from '../lang/en.js';

const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

// ─── Constants ──────────────────────────────────────────────────────────────

const mockConfig = {
  api: {
    protocol: 'http',
    host: 'localhost',
    port: '3000',
    base: 'api',
    endPoints: { billing: 'billing' },
  },
  vuetify: { theme: { rounded: '', flat: true, maxWidth: '1200px' } },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const vuetify = createVuetify();

const componentStubs = {
  RouterLink: true,
  BillingPricingToggleComponent: true,
  BillingPricingCardComponent: true,
  BillingPacksComponent: true,
  HomeTabsComponent: true,
};

/**
 * @desc Mount BillingPricingView with Vuetify + Pinia + custom $route.
 * @param {Object} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountPricing({
  serverConfig = { billing: { meterMode: true } },
  isLoggedIn = true,
  routeQuery = {},
  routeHash = '',
  router = { replace: vi.fn(), push: vi.fn() },
} = {}) {
  authState.serverConfig = serverConfig;
  authState.isLoggedIn = isLoggedIn;
  return mount(BillingPricingView, {
    global: {
      plugins: [vuetify, i18n],
      mocks: {
        config: mockConfig,
        $route: { path: '/pricing', hash: routeHash, query: routeQuery },
        $router: router,
      },
      stubs: componentStubs,
    },
  });
}

/**
 * @desc Seed the billing store with no-op mocks so mounted views don't issue real fetches.
 * @param {ReturnType<typeof useBillingStore>} store - Billing store instance from useBillingStore()
 * @returns {void}
 */
function seedStore(store) {
  vi.spyOn(store, 'fetchPlans').mockResolvedValue([]);
  vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
}

// ─── Suite: Stripe cancel-redirect — intentId cleanup ───────────────────────

describe('BillingPricingView — Stripe cancel-redirect intentId cleanup', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    sessionStorage.clear();
  });

  it('clears the per-pack intentId when ?canceled=true&type=extras&pack=pack_500', async () => {
    sessionStorage.setItem('billing.extras.intentId.pack_500', 'uuid-stale');
    sessionStorage.setItem('billing.extras.intentId.pack_2000', 'uuid-other');
    const router = { replace: vi.fn(), push: vi.fn() };

    wrapper = mountPricing({
      routeQuery: { canceled: 'true', type: 'extras', pack: 'pack_500' },
      routeHash: '#units',
      router,
    });
    await flushPromises();

    // Targeted pack key cleared, sibling preserved
    expect(sessionStorage.getItem('billing.extras.intentId.pack_500')).toBeNull();
    expect(sessionStorage.getItem('billing.extras.intentId.pack_2000')).toBe('uuid-other');
    // Cancel alert still shown
    expect(wrapper.vm.checkoutCanceled).toBe(true);
    // URL stripped of type/pack, canceled + hash preserved
    expect(router.replace).toHaveBeenCalledWith({
      path: '/pricing',
      hash: '#units',
      query: { canceled: 'true' },
    });
  });

  it('falls back to clearing all extras intentIds when pack is missing', async () => {
    sessionStorage.setItem('billing.extras.intentId.pack_500', 'uuid-a');
    sessionStorage.setItem('billing.extras.intentId.pack_2000', 'uuid-b');
    sessionStorage.setItem('unrelated', 'keep-me');
    const router = { replace: vi.fn(), push: vi.fn() };

    wrapper = mountPricing({
      routeQuery: { canceled: 'true', type: 'extras' },
      routeHash: '#units',
      router,
    });
    await flushPromises();

    expect(sessionStorage.getItem('billing.extras.intentId.pack_500')).toBeNull();
    expect(sessionStorage.getItem('billing.extras.intentId.pack_2000')).toBeNull();
    expect(sessionStorage.getItem('unrelated')).toBe('keep-me');
    // URL stripped of type, canceled + hash preserved
    expect(router.replace).toHaveBeenCalledWith({
      path: '/pricing',
      hash: '#units',
      query: { canceled: 'true' },
    });
    expect(wrapper.vm.checkoutCanceled).toBe(true);
  });

  it('does NOT clear intentIds when type is not extras (subscription cancel)', async () => {
    sessionStorage.setItem('billing.extras.intentId.pack_500', 'uuid-a');
    const router = { replace: vi.fn(), push: vi.fn() };

    wrapper = mountPricing({
      routeQuery: { canceled: 'true' },
      router,
    });
    await flushPromises();

    expect(sessionStorage.getItem('billing.extras.intentId.pack_500')).toBe('uuid-a');
    expect(wrapper.vm.checkoutCanceled).toBe(true);
    // No URL rewrite for the subscription-cancel path (legacy behaviour preserved)
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('does NOT clear intentIds and does NOT show cancel banner when canceled is absent', async () => {
    sessionStorage.setItem('billing.extras.intentId.pack_500', 'uuid-a');
    const router = { replace: vi.fn(), push: vi.fn() };

    wrapper = mountPricing({ routeQuery: {}, router });
    await flushPromises();

    expect(sessionStorage.getItem('billing.extras.intentId.pack_500')).toBe('uuid-a');
    expect(wrapper.vm.checkoutCanceled).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('selects the units tab when hash is #units (regression check)', async () => {
    wrapper = mountPricing({ routeQuery: {}, routeHash: '#units' });
    await flushPromises();
    expect(wrapper.vm.activeTab).toBe(1);
  });
});
