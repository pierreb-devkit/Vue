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

import { createI18n } from 'vue-i18n';
import { useBillingStore } from '../stores/billing.store';
import BillingSubscriptionsComponent from '../components/billing.subscriptions.component.vue';
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
  BillingPlanBadgeComponent: true,
  BillingExtrasCheckoutModalComponent: {
    name: 'BillingExtrasCheckoutModalComponent',
    props: ['modelValue', 'packs'],
    emits: ['update:modelValue'],
    template: '<div class="extras-modal-stub" :data-open="modelValue"><slot /></div>',
  },
};

/**
 * @desc Mount BillingSubscriptionsComponent with Vuetify + Pinia.
 * @param {Object} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountSubscriptions({
  serverConfig = null,
  isLoggedIn = true,
  routeQuery = {},
  router = { replace: vi.fn(), push: vi.fn() },
} = {}) {
  authState.serverConfig = serverConfig;
  authState.isLoggedIn = isLoggedIn;
  return mount(BillingSubscriptionsComponent, {
    global: {
      plugins: [vuetify, i18n],
      mocks: {
        config: mockConfig,
        $route: { path: '/users', query: routeQuery },
        $router: router,
      },
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

  it('Buy units CTA opens the inline extras checkout modal', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('Buy units'));
    expect(buyBtn).toBeDefined();
    await buyBtn.trigger('click');
    expect(wrapper.vm.extrasCheckoutDialog).toBe(true);
    const modal = wrapper.findComponent({ name: 'BillingExtrasCheckoutModalComponent' });
    expect(modal.props('modelValue')).toBe(true);
    expect(modal.props('packs')).toEqual(mockUsageMeterNormal.packsAvailable);
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

  it('shows a portal error alert when openPortal rejects', async () => {
    store.openPortal.mockRejectedValueOnce(new Error('Portal failed'));
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    await wrapper.vm.manageSubscription();
    await flushPromises();

    expect(wrapper.text()).toContain('Unable to open the billing portal');
  });
});

// ─── Suite 4: Status chips / paid plan CTA ─────────────────────────────────

describe('BillingSubscriptionsComponent — status and paid plan CTAs', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
    seedMeterStore(store);
    vi.spyOn(store, 'openPortal').mockResolvedValue(undefined);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it.each([
    ['active', 'success'],
    ['past_due', 'warning'],
    ['canceled', 'error'],
    ['incomplete', 'error'],
    ['incomplete_expired', 'error'],
    ['trialing', 'success'],
  ])('renders %s subscription status with %s chip color', async (status, color) => {
    store.subscription = { status, plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    const chip = wrapper.findComponent({ name: 'v-chip' });
    expect(chip.exists()).toBe(true);
    expect(chip.props('color')).toBe(color);
    expect(chip.text()).toContain(status.replace(/_/g, ' '));
  });

  it('shows Update payment method action for past_due status', async () => {
    store.subscription = { status: 'past_due', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Update payment method');
  });

  it('shows Reactivate action for canceled status', async () => {
    store.subscription = { status: 'canceled', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Reactivate');
  });

  it('shows Complete payment action for incomplete_expired status with error color', async () => {
    store.subscription = { status: 'incomplete_expired', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Complete payment');
  });

  it('labels the paid plan upgrade CTA as Change Plan when a higher plan exists', async () => {
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Change Plan');
    expect(wrapper.text()).not.toContain('Upgrade');
  });

  it('hides the paid plan upgrade CTA on the highest plan', async () => {
    store.subscription = { status: 'active', plan: 'pro', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).not.toContain('Change Plan');
  });
});

// ─── Suite 5: Stripe success query handling ────────────────────────────────

describe('BillingSubscriptionsComponent — checkout success query flow', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('shows processing state and cleans the URL query on ?success=true (P1-2 polling flow)', async () => {
    const router = { replace: vi.fn(), push: vi.fn() };
    // fetchSubscription never activates subscription → stays in processing/polling
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
      router,
    });
    await flushPromises();

    // Polling is active — checkoutProcessing shown
    expect(wrapper.vm.checkoutProcessing).toBe(true);

    // URL cleanup fires after 100ms
    vi.advanceTimersByTime(100);
    expect(router.replace).toHaveBeenCalledWith({
      query: { tab: 'subscriptions', success: undefined, type: undefined, packPurchased: undefined },
    });
  });

  it('shows extras success copy when Stripe returns type=extras', async () => {
    const router = { replace: vi.fn(), push: vi.fn() };
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: true } },
      routeQuery: { tab: 'subscriptions', success: 'true', type: 'extras' },
      router,
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Pack credited to your balance');
  });

  it('shows extras success copy when packPurchased=true string is present', async () => {
    const router = { replace: vi.fn(), push: vi.fn() };
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: true } },
      routeQuery: { tab: 'subscriptions', packPurchased: 'true' },
      router,
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Pack credited to your balance');
  });

  it('does NOT show success banner when packPurchased=false string is present', async () => {
    const router = { replace: vi.fn(), push: vi.fn() };
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: true } },
      routeQuery: { tab: 'subscriptions', packPurchased: 'false' },
      router,
    });
    await flushPromises();

    expect(wrapper.text()).not.toContain('successfully');
    expect(router.replace).not.toHaveBeenCalled();
  });
});

// ─── Suite 6: Ledger pagination ──────────────────────────────────────────────

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

// ─── Suite 7: P1-1 — Subscription fetch error state ─────────────────────────

describe('BillingSubscriptionsComponent — subscription fetch error (P1-1)', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
    // Simulate a failed fetchSubscription: error set, subscription remains null
    store.subscription = null;
    store.subscriptionError = 'Network error';
    vi.spyOn(store, 'fetchSubscription').mockRejectedValue(new Error('Network error'));
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    sessionStorage.clear();
  });

  it('shows error card instead of free-plan fallback when subscriptionError is set', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    // Error card present
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    // Must NOT show the free-plan "Upgrade" CTA or free plan text
    expect(wrapper.text()).not.toContain("You're on the free plan");
  });

  it('error card has aria-live="assertive" for a11y (P1-1)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    const alert = wrapper.find('[role="alert"]');
    expect(alert.exists()).toBe(true);
    expect(alert.attributes('aria-live')).toBe('assertive');
  });

  it('error card contains retry button', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    const retryBtn = wrapper.findAll('.v-btn').find((b) => b.text().toLowerCase().includes('retry'));
    expect(retryBtn).toBeDefined();
  });

  it('retry button calls fetchSubscription again', async () => {
    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    store.subscriptionError = 'Network error';
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    await wrapper.vm.retryFetchSubscription();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('clears error card when retry succeeds and subscription loads', async () => {
    const sub = { plan: 'pro', status: 'active' };
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      store.subscription = sub;
      store.subscriptionError = null;
    });
    store.subscriptionError = 'Network error';
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    await wrapper.vm.retryFetchSubscription();
    await flushPromises();

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
  });
});

// ─── Suite 8: P1-2 — Checkout polling after Stripe success ───────────────────

describe('BillingSubscriptionsComponent — checkout success polling (P1-2)', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = null;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('shows processing spinner when ?success=true (non-extras)', async () => {
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();
    expect(wrapper.vm.checkoutProcessing).toBe(true);
  });

  it('transitions to success message when subscription activates on 3rd poll', async () => {
    let callCount = 0;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      callCount += 1;
      if (callCount >= 3) {
        store.subscription = { plan: 'starter', status: 'active', stripeSubscriptionId: 'sub_new123' };
        store.subscriptionError = null;
      }
    });

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();
    expect(wrapper.vm.checkoutProcessing).toBe(true);

    // Advance 2 polls (4s)
    await vi.advanceTimersByTimeAsync(4000);
    await flushPromises();

    // 3rd poll activates subscription
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(wrapper.vm.checkoutProcessing).toBe(false);
    expect(wrapper.vm.paymentSuccessMessage).toContain('Subscription activated successfully');
  });

  it('shows timeout message after 8 polls without state change', async () => {
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();

    // Advance 8 × 2s = 16s
    await vi.advanceTimersByTimeAsync(16000);
    await flushPromises();

    expect(wrapper.vm.checkoutProcessing).toBe(false);
    expect(wrapper.vm.checkoutTimeout).toBe(true);
  });

  it('timeout message renders in template with refresh button', async () => {
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();

    await vi.advanceTimersByTimeAsync(16000);
    await flushPromises();

    expect(wrapper.text()).toContain('Payment received');
    const refreshBtn = wrapper.findAll('.v-btn').find((b) => b.text().toLowerCase().includes('refresh'));
    expect(refreshBtn).toBeDefined();
  });

  it('retryFetchSubscription clears checkoutTimeout when refresh confirms active subscription', async () => {
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();

    // Force timeout
    await vi.advanceTimersByTimeAsync(16000);
    await flushPromises();
    expect(wrapper.vm.checkoutTimeout).toBe(true);

    // Manual refresh confirms active sub
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      store.subscription = { plan: 'starter', status: 'active', stripeSubscriptionId: 'sub_123' };
      store.subscriptionError = null;
      return store.subscription;
    });
    await wrapper.vm.retryFetchSubscription();

    expect(wrapper.vm.checkoutTimeout).toBe(false);
    expect(wrapper.vm.paymentSuccessMessage).toContain('Subscription activated successfully');
  });

  it('plan change detected as activation (upgrade with same stripeSubscriptionId)', async () => {
    store.subscription = { plan: 'starter', status: 'active', stripeSubscriptionId: 'sub_same' };
    let callCount = 0;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      callCount += 1;
      if (callCount >= 2) {
        store.subscription = { plan: 'pro', status: 'active', stripeSubscriptionId: 'sub_same' };
        store.subscriptionError = null;
      }
    });

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();

    // 2nd poll detects plan change
    await vi.advanceTimersByTimeAsync(4000);
    await flushPromises();

    expect(wrapper.vm.checkoutProcessing).toBe(false);
    expect(wrapper.vm.paymentSuccessMessage).toContain('Subscription activated successfully');
  });

  it('extras purchase shows success immediately without subscription polling', async () => {
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: true } },
      routeQuery: { tab: 'subscriptions', success: 'true', type: 'extras' },
    });
    await flushPromises();

    // No polling active for extras
    expect(wrapper.vm.checkoutProcessing).toBe(false);
    expect(wrapper.vm.checkoutPollCount).toBe(0);
    expect(wrapper.vm.paymentSuccessMessage).toContain('Pack credited to your balance');
  });
});

// ─── Suite 9: Bonus — 409 already-active dialog (showAlreadyActiveDialog) ─────

describe('BillingSubscriptionsComponent — 409 already-active dialog (Bonus)', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    // Stub v-dialog to avoid visualViewport errors in jsdom
    componentStubs['VDialog'] = { name: 'VDialog', template: '<div><slot /></div>', props: ['modelValue'] };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    delete componentStubs['VDialog'];
  });

  it('alreadyActiveDialog is false by default', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.vm.alreadyActiveDialog).toBe(false);
  });

  it('showAlreadyActiveDialog sets alreadyActiveDialog true and stores valid HTTPS portalUrl', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    const portalUrl = 'https://billing.stripe.com/portal/sess_abc';
    wrapper.vm.showAlreadyActiveDialog(portalUrl);
    expect(wrapper.vm.alreadyActiveDialog).toBe(true);
    expect(wrapper.vm.alreadyActivePortalUrl).toBe(portalUrl);
  });

  it('showAlreadyActiveDialog rejects non-HTTPS portalUrl', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    wrapper.vm.showAlreadyActiveDialog('http://evil.example.com/portal');
    expect(wrapper.vm.alreadyActiveDialog).toBe(true);
    expect(wrapper.vm.alreadyActivePortalUrl).toBeNull();
  });

  it('showAlreadyActiveDialog handles invalid URL gracefully', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    wrapper.vm.showAlreadyActiveDialog('not-a-url');
    expect(wrapper.vm.alreadyActiveDialog).toBe(true);
    expect(wrapper.vm.alreadyActivePortalUrl).toBeNull();
  });

  it('showAlreadyActiveDialog handles missing portalUrl gracefully', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    wrapper.vm.showAlreadyActiveDialog(null);
    expect(wrapper.vm.alreadyActiveDialog).toBe(true);
    expect(wrapper.vm.alreadyActivePortalUrl).toBeNull();
  });
});

// ─── Suite 10: V5 P1 — F5 mid-polling sessionStorage recovery ────────────────

describe('BillingSubscriptionsComponent — F5 polling recovery (V5 P1)', () => {
  let wrapper;
  let store;
  const SESSION_KEY = 'billing.checkout.polling';

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = null;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('persists polling session to sessionStorage when ?success=true starts polling', async () => {
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { success: 'true' },
    });
    await flushPromises();

    const raw = sessionStorage.getItem(SESSION_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveProperty('startedAt');
    expect(typeof parsed.startedAt).toBe('number');
  });

  it('resumes polling when sessionStorage has a valid recent entry (F5 mid-polling)', async () => {
    // Simulate 4 seconds elapsed — still within the 16s window
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt: Date.now() - 4000 }));
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    // Mount without ?success query — simulates F5
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    // Should resume processing state
    expect(wrapper.vm.checkoutProcessing).toBe(true);
    // Poll count should start at 2 (4000ms / 2000ms per poll)
    expect(wrapper.vm.checkoutPollCount).toBe(2);
  });

  it('shows processing banner when polling is resumed after F5', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt: Date.now() - 2000 }));
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Processing your payment');
  });

  it('does NOT resume polling when sessionStorage entry is expired (F5 after timeout)', async () => {
    // Simulate 20 seconds elapsed — beyond the 16s window
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt: Date.now() - 20000 }));

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    expect(wrapper.vm.checkoutProcessing).toBe(false);
    // Session key should be cleared
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('clears sessionStorage on successful subscription activation', async () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt: Date.now() }));
    let callCount = 0;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(async () => {
      callCount += 1;
      if (callCount >= 1) {
        store.subscription = { plan: 'starter', status: 'active', stripeSubscriptionId: 'sub_new' };
      }
    });

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();

    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('clears sessionStorage on polling timeout', async () => {
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { success: 'true' },
    });
    await flushPromises();

    // Advance 8 × 2s to exhaust polls
    await vi.advanceTimersByTimeAsync(16000);
    await flushPromises();

    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(wrapper.vm.checkoutTimeout).toBe(true);
  });
});

// ─── Suite 11: V5 P2 — subscription store visibility change refetch ───────────

describe('BillingSubscriptionsComponent — visibilitychange subscription refetch (V5 P2)', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
  });

  it('calls fetchSubscription when tab becomes visible', async () => {
    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(store.subscription);
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    const initialCallCount = fetchSpy.mock.calls.length;

    // Simulate tab becoming visible
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();

    expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('does NOT call fetchSubscription when tab becomes hidden', async () => {
    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(store.subscription);
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    const initialCallCount = fetchSpy.mock.calls.length;

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();

    expect(fetchSpy.mock.calls.length).toBe(initialCallCount);
  });

  it('does NOT refetch if already fetched within 500ms debounce', async () => {
    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(store.subscription);
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    // Set subscriptionLastFetchedAt to now (simulating fresh fetch)
    wrapper.vm.subscriptionLastFetchedAt = Date.now();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();

    // Should not have called again within debounce window
    const callsAfterDebounce = fetchSpy.mock.calls.length;
    // Advance past debounce
    await vi.advanceTimersByTimeAsync(600);
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();

    // Now it should call
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAfterDebounce);
  });

  it('does NOT refetch when checkout polling is active', async () => {
    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    // Simulate active polling
    wrapper.vm.checkoutProcessing = true;

    const callCount = fetchSpy.mock.calls.length;
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();

    expect(fetchSpy.mock.calls.length).toBe(callCount);
  });

  it('removes visibilitychange listener on beforeUnmount', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    wrapper.unmount();
    wrapper = null;

    const calls = removeSpy.mock.calls.filter(([evt]) => evt === 'visibilitychange');
    expect(calls.length).toBeGreaterThan(0);
  });
});
