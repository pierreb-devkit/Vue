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

// ─── Mutable auth store state (hoisted so vi.mock factory can close over it) ─

const authState = vi.hoisted(() => ({
  isLoggedIn: true,
  user: null,
  serverConfig: null,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { useBillingStore } from '../stores/billing.store';
import BillingSubscriptionsComponent from '../components/billing.subscriptions.component.vue';

// ─── Constants ───────────────────────────────────────────────────────────────

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

const mockUsageMeterNormal = {
  plan: 'starter',
  planVersion: 1,
  weekKey: '2025-W17',
  // biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
  weekResetAt: new Date(Date.now() + 86400000).toISOString(),
  meterUsed: 120,
  meterQuota: 500,
  meterBreakdown: { scrap: 80, autofix: 40 },
  extrasRemaining: 50,
  packsAvailable: [
    { packId: 'pack_500', label: '500 units', priceUsd: 9, meterUnits: 500 },
    { packId: 'pack_1000', label: '1000 units', priceUsd: 16, meterUnits: 1000 },
  ],
};

const mockExtrasBalance = {
  balance: 50,
  packsAvailable: mockUsageMeterNormal.packsAvailable,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const vuetify = createVuetify();

const componentStubs = {
  RouterLink: true,
  billingPlanBadgeComponent: true,
};

/**
 * @desc Mount BillingSubscriptionsComponent with Vuetify + Pinia.
 * @param {Object} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountSubscriptions({ serverConfig = null, isLoggedIn = true } = {}) {
  authState.serverConfig = serverConfig;
  authState.isLoggedIn = isLoggedIn;
  return mount(BillingSubscriptionsComponent, {
    global: {
      plugins: [vuetify],
      mocks: { config: mockConfig },
      stubs: componentStubs,
    },
  });
}

/**
 * @desc Seed billingStore with meter usage data and stub the fetch actions.
 * @param {Object} store
 * @param {Object} [usageMeter]
 * @param {Object} [extrasBalance]
 */
function seedMeterStore(store, usageMeter = mockUsageMeterNormal, extrasBalance = mockExtrasBalance) {
  store.usageMeter = usageMeter;
  store.extrasBalance = extrasBalance;
  vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue(usageMeter);
  vi.spyOn(store, 'fetchExtrasBalance').mockResolvedValue(extrasBalance);
  vi.spyOn(store, 'fetchExtrasLedger').mockResolvedValue({ entries: [], total: 0, page: 1, limit: 20 });
  vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  vi.spyOn(store, 'fetchPlans').mockResolvedValue([]);
}

// ─── Suite 1: Meter mode rendering ───────────────────────────────────────────

describe('BillingSubscriptionsComponent — meter mode (meterMode: true)', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const store = useBillingStore();
    seedMeterStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
  });

  it('renders meter progress widget when meterMode is true', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.find('.billing-meter-progress').exists()).toBe(true);
  });

  it('renders breakdown chart when meterMode is true', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.find('.billing-meter-breakdown-chart').exists()).toBe(true);
  });

  it('renders meter usage values', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.text()).toContain('120');
    expect(wrapper.text()).toContain('500');
  });

  it('renders Buy units CTA in meter mode', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtns = wrapper.findAll('.v-btn').filter((b) => b.text().includes('Buy units'));
    expect(buyBtns.length).toBeGreaterThan(0);
  });

  it('Buy units CTA links to /pricing (no modal)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('Buy units'));
    expect(buyBtn).toBeDefined();
    expect(buyBtn.props('to')).toBe('/pricing');
  });

  it('renders informational usage bar in meter mode (no click handler)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const meterBar = wrapper.find('.billing-usage-bar--meter');
    expect(meterBar.exists()).toBe(true);
    // Bar is informational — no role=button, no cursor pointer
    expect(meterBar.attributes('role')).toBeUndefined();
  });

  it('fetches extras ledger when meterMode is true', async () => {
    const store = useBillingStore();
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(store.fetchExtrasLedger).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('does not fetch extras ledger when meterMode is false', async () => {
    const store = useBillingStore();
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(store.fetchExtrasLedger).not.toHaveBeenCalled();
  });
});

// ─── Suite 2: Legacy regression ──────────────────────────────────────────────

describe('BillingSubscriptionsComponent — legacy mode (meterMode: false)', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const store = useBillingStore();
    seedMeterStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('does NOT render .billing-meter-progress in legacy mode', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-meter-progress').exists()).toBe(false);
  });

  it('does NOT render .billing-usage-bar--meter in legacy mode', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(false);
  });

  it('does NOT render meter section labels in legacy mode', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).not.toContain('Weekly meter');
    expect(wrapper.text()).not.toContain('Extra units');
  });

  it('renders Current Plan card in legacy mode', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Current Plan');
  });
});

// ─── Suite 3: Manage subscription / portal ──────────────────────────────────

describe('BillingSubscriptionsComponent — Manage Subscription', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    vi.spyOn(store, 'openPortal').mockResolvedValue(undefined);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('renders Manage Subscription button when subscription is active', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Manage Subscription');
  });

  it('manageSubscription delegates to billingStore.openPortal', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    await wrapper.vm.manageSubscription();
    expect(store.openPortal).toHaveBeenCalled();
  });
});

// ─── Suite 4: Ledger pagination ──────────────────────────────────────────────

describe('BillingSubscriptionsComponent — ledger pagination', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
    seedMeterStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('onLedgerPageChange forwards the page number', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const fetchSpy = vi.spyOn(store, 'fetchExtrasLedger').mockResolvedValue({ entries: [], total: 0, page: 2, limit: 20 });
    await wrapper.vm.onLedgerPageChange(2);
    expect(fetchSpy).toHaveBeenCalledWith({ page: 2, limit: 20 });
  });

  it('extrasLedger computed falls back to empty state when store value is null', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.vm.extrasLedger.entries).toEqual([]);
    expect(wrapper.vm.extrasLedger.total).toBe(0);
  });
});
