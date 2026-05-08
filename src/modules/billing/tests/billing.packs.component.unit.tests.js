import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// ─── Prevent real HTTP calls ────────────────────────────────────────────────

vi.mock('../config/billing.static-content.js', () => ({
  packs: [],
  plans: [],
  faqs: [],
  pricingMode: null,
  default: { billing: { packs: [], plans: [], faqs: [], pricingMode: null } },
}));

vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
}));

// ─── Mutable auth store state (hoisted so vi.mock factory can close over it) ─

const authState = vi.hoisted(() => ({
  isLoggedIn: true,
  user: { currentOrganization: 'org_test_123' },
  serverConfig: { organizations: { enabled: true } },
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { createI18n } from 'vue-i18n';
import { useBillingStore } from '../stores/billing.store';
import BillingPacksComponent from '../components/billing.packs.component.vue';
import { billingEn } from '../lang/en.js';

const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

// ─── Constants ───────────────────────────────────────────────────────────────

const mockConfig = {
  api: {
    protocol: 'http',
    host: 'localhost',
    port: '3000',
    base: 'api',
    endPoints: { billing: 'billing' },
  },
  vuetify: { theme: { rounded: '', flat: true } },
};

const mockPacks = [
  { packId: 'pack_500', label: '500 units', priceUsd: 9, meterUnits: 500 },
  { packId: 'pack_1000', label: '1000 units', priceUsd: 16, meterUnits: 1000 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const vuetify = createVuetify();

/**
 * @desc Mount BillingPacksComponent with Vuetify + Pinia.
 * @param {Object} [overrides] — optional auth state overrides
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountPacks(overrides = {}) {
  Object.assign(authState, overrides);
  return mount(BillingPacksComponent, {
    global: {
      plugins: [vuetify, i18n],
      mocks: {
        config: mockConfig,
        $router: { push: vi.fn() },
      },
      stubs: { RouterLink: true },
    },
  });
}

// ─── Suite 1: Empty state ────────────────────────────────────────────────────

describe('BillingPacksComponent — empty state', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Store has no packs data
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('renders empty state message when no packs are available', async () => {
    wrapper = mountPacks();
    await flushPromises();
    expect(wrapper.text()).toContain('No unit packs available at this time.');
  });
});

// ─── Suite 2: Pack cards rendering ───────────────────────────────────────────

describe('BillingPacksComponent — pack cards', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('renders pack cards from billingStore.usageMeter.packsAvailable', async () => {
    store.usageMeter = { packsAvailable: mockPacks };
    wrapper = mountPacks();
    await flushPromises();
    expect(wrapper.text()).toContain('500 units');
    expect(wrapper.text()).toContain('1000 units');
  });

  it('renders pack cards from billingStore.extrasBalance.packsAvailable when usageMeter is null', async () => {
    store.usageMeter = null;
    store.extrasBalance = { balance: 0, packsAvailable: mockPacks };
    wrapper = mountPacks();
    await flushPromises();
    expect(wrapper.text()).toContain('500 units');
    expect(wrapper.text()).toContain('1000 units');
  });

  it('renders price and unit count for each pack', async () => {
    store.usageMeter = { packsAvailable: mockPacks };
    wrapper = mountPacks();
    await flushPromises();
    expect(wrapper.text()).toContain('$9');
    expect(wrapper.text()).toContain('+500 units');
    expect(wrapper.text()).toContain('$16');
    expect(wrapper.text()).toContain('+1000 units');
  });

  it('renders a Buy button for each pack', async () => {
    store.usageMeter = { packsAvailable: mockPacks };
    wrapper = mountPacks();
    await flushPromises();
    const buyBtns = wrapper.findAllComponents({ name: 'v-btn' }).filter((b) => b.text().includes('Buy'));
    expect(buyBtns.length).toBe(mockPacks.length);
  });
});

// ─── Suite 3: Purchase flow ───────────────────────────────────────────────────

describe('BillingPacksComponent — purchase flow', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Reset to logged-in state with org for purchase flow tests
    authState.isLoggedIn = true;
    authState.user = { currentOrganization: 'org_test_123' };
    authState.serverConfig = { organizations: { enabled: true } };
    store = useBillingStore();
    store.usageMeter = { packsAvailable: mockPacks };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('calls createExtrasCheckout with the correct packId on Buy click (happy path)', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    wrapper = mountPacks();
    await flushPromises();
    const buyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('500 units'));
    await buyBtn.trigger('click');
    await flushPromises();
    expect(store.createExtrasCheckout).toHaveBeenCalledWith('pack_500');
  });

  it('shows an error banner when createExtrasCheckout rejects (failure path)', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockRejectedValue(new Error('Network error'));
    wrapper = mountPacks();
    await flushPromises();
    const buyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('500 units'));
    await buyBtn.trigger('click');
    await flushPromises();
    const alert = wrapper.find('.v-alert');
    expect(alert.exists()).toBe(true);
    expect(wrapper.text()).toContain('Failed to start checkout. Please try again.');
  });

  it('disables all Buy buttons while a purchase is in progress', async () => {
    let resolveCheckout;
    vi.spyOn(store, 'createExtrasCheckout').mockReturnValue(
      new Promise((resolve) => {
        resolveCheckout = resolve;
      }),
    );
    wrapper = mountPacks();
    await flushPromises();
    const firstBuyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('500 units'));
    await firstBuyBtn.trigger('click');
    await flushPromises();
    const allBtns = wrapper.findAllComponents({ name: 'v-btn' });
    for (const btn of allBtns) {
      expect(btn.props('disabled')).toBe(true);
    }
    resolveCheckout();
    await flushPromises();
  });

  it('redirects guest to sign-in instead of initiating checkout', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    const pushFn = vi.fn();
    wrapper = mountPacks({
      isLoggedIn: false,
      user: null,
      serverConfig: null,
    });
    wrapper.vm.$router = { push: pushFn };
    await flushPromises();
    const buyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('500 units'));
    await buyBtn.trigger('click');
    await flushPromises();
    expect(store.createExtrasCheckout).not.toHaveBeenCalled();
    expect(pushFn).toHaveBeenCalledWith({ path: '/signin', query: { redirect: '/pricing' } });
  });
});
