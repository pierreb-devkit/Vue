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

// ─── Decouple from tenant-specific plan IDs ──────────────────────────────────
// livePacks is a hoisted live-array (empty by default — existing suites below never
// exercise the packsConfig fallback, they always seed store.usageMeter.packsAvailable).
// Suite 3 splices the REAL billing.static-content.js `packs` export in to verify the
// extras-checkout-modal adapter against real data, not a hand-written mock.

const livePacks = vi.hoisted(() => []);

vi.mock('../lib/billing.resolveStaticContent.js', () => ({
  resolveStaticContent: () => ({
    plans: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
    packs: livePacks,
  }),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import { useBillingStore } from '../stores/billing.store';
import BillingSubscriptionsComponent from '../components/billing.subscriptions.component.vue';
import { packs as realPacks } from '../config/billing.static-content.js';

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
  meterBreakdown: { compute: 80, automation: 40 },
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
      plugins: [vuetify],
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

  it('renders meter usage values against combinedPool denominator', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // combinedPool = meterQuota(500) + meterExtras(50) + meterUsed(120) = 670
    // used(120) / combinedPool(670) = ~18%
    expect(wrapper.text()).toContain('18%');
  });

  it('renders "Buy compute extras" CTA in meter mode (T6 redesign: /pricing#units redirect)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtns = wrapper.findAllComponents({ name: 'v-btn' }).filter((b) => b.text().includes('Buy compute extras'));
    expect(buyBtns.length).toBeGreaterThan(0);
  });

  it('"Buy compute extras" CTA navigates to /pricing#units (not opens modal) — T6 redesign', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtn = wrapper.findAllComponents({ name: 'v-btn' }).find((b) => b.text().includes('Buy compute extras'));
    expect(buyBtn).toBeDefined();
    // Must have `to="/pricing#units"` prop — never opens the inline checkout modal
    const toProp = buyBtn?.props('to') ?? buyBtn?.attributes('to');
    expect(String(toProp)).toContain('/pricing');
    expect(String(toProp)).toContain('#units');
    // Dialog must remain closed — this is not a modal trigger
    expect(wrapper.vm.extrasCheckoutDialog).toBe(false);
  });

  it('does NOT render BillingUsageBarComponent in meter mode (T6: single bar only)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // T6 drops BillingUsageBarComponent — only BillingMeterProgressComponent remains
    const usageBars = wrapper.findAllComponents({ name: 'BillingUsageBarComponent' });
    expect(usageBars.length).toBe(0);
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
    vi.spyOn(store, 'openPortal').mockResolvedValue('https://billing.stripe.com/session/test');
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

  it('manageSubscription calls window.open with the URL from openPortal', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    await wrapper.vm.manageSubscription();
    await flushPromises();

    expect(openSpy).toHaveBeenCalledWith(
      'https://billing.stripe.com/session/test',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('does NOT render inline portal error alert when openPortal rejects (centralized snackbar handles it)', async () => {
    store.openPortal.mockRejectedValueOnce(new Error('Portal failed'));
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    await wrapper.vm.manageSubscription();
    await flushPromises();

    // Error is surfaced via centralized snackbar — no inline alert in this component
    expect(wrapper.text()).not.toContain('Unable to open the billing portal');
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
    ['paused', 'warning'],
    ['unpaid', 'error'],
  ])('renders %s subscription status with %s chip color', async (status, color) => {
    store.subscription = { status, plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    // i18n-translated statuses use their key label; others fall back to raw replacement
    const i18nLabels = { paused: 'Paused', unpaid: 'Unpaid' };
    const expectedLabel = i18nLabels[status] ?? status.replace(/_/g, ' ');

    const chip = wrapper.findComponent({ name: 'v-chip' });
    expect(chip.exists()).toBe(true);
    expect(chip.props('color')).toBe(color);
    expect(chip.text()).toContain(expectedLabel);
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

  it('shows Reactivate action for paused status with warning color', async () => {
    store.subscription = { status: 'paused', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Reactivate');
  });

  it('shows Update payment method action for unpaid status with error color', async () => {
    store.subscription = { status: 'unpaid', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Update payment method');
  });

  it('labels the paid plan upgrade CTA as Change Plan when a higher plan exists', async () => {
    store.subscription = { status: 'active', plan: 'p2', currentPeriodEnd: new Date().toISOString() };
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

  it('status chip for paused shows inlined English label "Paused"', async () => {
    store.subscription = { status: 'paused', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    const wrapperPaused = mount(BillingSubscriptionsComponent, {
      global: {
        plugins: [vuetify],
        mocks: {
          config: mockConfig,
          $route: { path: '/users', query: {} },
          $router: { replace: vi.fn(), push: vi.fn() },
        },
        stubs: componentStubs,
      },
    });
    await flushPromises();
    const chip = wrapperPaused.findComponent({ name: 'v-chip' });
    expect(chip.exists()).toBe(true);
    expect(chip.text()).toContain('Paused');
    wrapperPaused.unmount();
  });

  it('paid plan card has billing-subscriptions__plan-card--paid CSS class (primary accent border)', async () => {
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    // The paid plan card carries the BEM modifier class used by the primary left-border accent rule
    expect(wrapper.find('.billing-subscriptions__plan-card--paid').exists()).toBe(true);
    expect(wrapper.find('.billing-subscriptions__plan-card--free').exists()).toBe(false);
  });

  it('free plan card has billing-subscriptions__plan-card--free CSS class (no accent border)', async () => {
    store.subscription = null;
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-subscriptions__plan-card--free').exists()).toBe(true);
    expect(wrapper.find('.billing-subscriptions__plan-card--paid').exists()).toBe(false);
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

// ─── Suite 9: meterError — centralized snackbar (no inline v-alert) ──────────
// meterError is now surfaced via lib/services/axios.js interceptor → centralized snackbar.
// The subscriptions component no longer renders an inline v-alert for meter errors.

describe('BillingSubscriptionsComponent — meterError (centralized snackbar, no inline alert)', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: new Date().toISOString() };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('does NOT render inline meter error alert (meterError surfaced via centralized snackbar)', async () => {
    // Even when meter fetch fails, no inline v-alert appears in this component.
    vi.spyOn(store, 'fetchUsageMeter').mockRejectedValueOnce(new Error('meter fetch failed'));
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // Only status-banner alerts are acceptable (checkoutProcessing/timeout/paymentSuccess)
    // No "Could not refresh usage" inline alert
    expect(wrapper.text()).not.toContain('Could not refresh usage');
  });

  it('does NOT render inline v-alert on meter error in meterMode=false', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    // No meter-related alert should render in legacy mode
    expect(wrapper.text()).not.toContain('Could not refresh usage');
  });

  it('combinedPool computed equals meterQuota + meterExtras + meterUsed', async () => {
    // useMeter returns values seeded from billingStore.usageMeter
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // mockUsageMeterNormal: meterUsed=120, meterQuota=500, extrasRemaining=50
    // combinedPool = 500 + 50 + 120 = 670
    expect(wrapper.vm.combinedPool).toBe(670);
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

  it('persists polling session to sessionStorage with snapshot fields when ?success=true starts polling', async () => {
    store.subscription = { status: 'active', plan: 'starter', stripeSubscriptionId: 'sub_before' };
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
    // Snapshot fields should be persisted for reliable F5 recovery
    expect(parsed).toHaveProperty('snapshotId', 'sub_before');
    expect(parsed).toHaveProperty('snapshotStatus', 'active');
    expect(parsed).toHaveProperty('snapshotPlan', 'starter');
  });

  it('resumes polling and restores snapshots from sessionStorage (F5 mid-polling)', async () => {
    // Simulate 4 seconds elapsed — still within the 16s window
    // Include snapshot fields so baseline is correctly restored
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      startedAt: Date.now() - 4000,
      snapshotId: 'sub_before_f5',
      snapshotStatus: 'active',
      snapshotPlan: 'starter',
    }));
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
    // Snapshots restored from storage — not from null store state
    expect(wrapper.vm.checkoutPollSnapshotId).toBe('sub_before_f5');
    expect(wrapper.vm.checkoutPollSnapshotStatus).toBe('active');
    expect(wrapper.vm.checkoutPollSnapshotPlan).toBe('starter');
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

  it('does NOT resume polling when sessionStorage contains malformed startedAt', async () => {
    // Store malformed data with invalid startedAt
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ startedAt: 'not-a-number' }));

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    expect(wrapper.vm.checkoutProcessing).toBe(false);
    // Session key should be cleared after invalid data detected
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
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
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      startedAt: Date.now(),
      snapshotId: null,
      snapshotStatus: null,
      snapshotPlan: null,
    }));
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

    // Advance time past the 500ms debounce window to ensure the visibility refetch is not blocked
    await vi.advanceTimersByTimeAsync(600);

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

// ─── Suite 12: V5 edge cases — i18n date formatting + extras/session collision ─

describe('BillingSubscriptionsComponent — V5 edge cases', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    store = useBillingStore();
    seedMeterStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('nextBillingDate formats date in en-US locale', async () => {
    store.subscription = { status: 'active', plan: 'starter', currentPeriodEnd: '2026-06-15T00:00:00.000Z' };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();

    // nextBillingDate is fixed to en-US locale formatting
    const dateText = wrapper.vm.nextBillingDate;
    expect(dateText).not.toBeNull();
    expect(typeof dateText).toBe('string');
    expect(dateText.length).toBeGreaterThan(0);
    // en-US formatting includes 2026 and recognizable month/day representation
    expect(dateText).toContain('2026');
  });

  it('extras purchase clears any stale sessionStorage polling session', async () => {
    // Simulate a leftover subscription polling session from a previous navigation
    sessionStorage.setItem('billing.checkout.polling', JSON.stringify({
      startedAt: Date.now() - 2000,
      snapshotId: null,
      snapshotStatus: null,
      snapshotPlan: null,
    }));

    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: true } },
      routeQuery: { success: 'true', type: 'extras' },
    });
    await flushPromises();

    // Session should be cleared — extras purchase must NOT resume subscription polling
    expect(sessionStorage.getItem('billing.checkout.polling')).toBeNull();
    // Extras success message displayed (not processing banner)
    expect(wrapper.vm.checkoutProcessing).toBe(false);
    expect(wrapper.text()).toContain('Pack credited to your balance');
  });
});

// ─── Suite 11: V6 P2 — extras.balance plural rendering ───────────────────────

describe('BillingSubscriptionsComponent — extras.balance pluralization (V6 P2)', () => {
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

  it('renders plural form for extras balance > 1 unit', async () => {
    store.usageMeter = { ...store.usageMeter, extrasRemaining: 50 };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // 50 units — plural form: "50 units remaining"
    expect(wrapper.text()).toContain('50 units remaining');
  });

  it('renders singular form for extras balance = 1 unit', async () => {
    store.usageMeter = { ...store.usageMeter, extrasRemaining: 1 };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // 1 unit — singular form: "1 unit remaining"
    expect(wrapper.text()).toContain('1 unit remaining');
  });

  it('renders zero form for extras balance = 0 units', async () => {
    store.usageMeter = { ...store.usageMeter, extrasRemaining: 0 };
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // 0 units — zero form: "no units remaining"
    expect(wrapper.text()).toContain('no units remaining');
  });
});

// ─── Suite 12: V6 P1 — sessionStorage SecurityError in privacy mode ──────────

describe('BillingSubscriptionsComponent — sessionStorage SecurityError guard (V6 P1)', () => {
  let wrapper;
  let store;
  let realSessionStorage;

  beforeEach(() => {
    realSessionStorage = window.sessionStorage;
    setActivePinia(createPinia());
    vi.useFakeTimers();
    vi.clearAllMocks();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = null;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    vi.useRealTimers();
    // Restore the real sessionStorage captured before the test
    Object.defineProperty(window, 'sessionStorage', {
      value: realSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  it('mount async completes and fetchSubscription is called when sessionStorage.getItem throws SecurityError', async () => {
    // Simulate privacy mode where ALL sessionStorage access throws SecurityError
    const fakeStorage = {
      getItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
      setItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
      removeItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
      clear: () => {},
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    // mount async must complete — fetchSubscription should be called
    expect(fetchSpy).toHaveBeenCalled();
    // No checkout processing initiated (no ?success query)
    expect(wrapper.vm.checkoutProcessing).toBe(false);
  });

  it('resumeCheckoutPollingFromSession returns false gracefully when removeItem inside catch throws', async () => {
    // getItem returns valid-looking data, but JSON.parse succeeds, then removeItem for cleanup throws
    const callLog = [];
    const fakeStorage = {
      getItem: (key) => {
        callLog.push(`getItem:${key}`);
        throw new DOMException('SecurityError', 'SecurityError');
      },
      setItem: () => {},
      removeItem: (key) => {
        callLog.push(`removeItem:${key}`);
        throw new DOMException('SecurityError', 'SecurityError');
      },
      clear: () => {},
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    // getItem was attempted (F5 recovery path), removeItem was attempted inside catch (safe)
    expect(callLog.some((c) => c.startsWith('getItem:'))).toBe(true);
    // checkoutProcessing must remain false — no session data was recoverable
    expect(wrapper.vm.checkoutProcessing).toBe(false);
  });

  it('visibilitychange listener is registered even when sessionStorage throws SecurityError on mount', async () => {
    const fakeStorage = {
      getItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
      setItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
      removeItem: () => { throw new DOMException('SecurityError', 'SecurityError'); },
      clear: () => {},
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    // Spy once — reuse for both mount and visibility assertions
    const fetchSpy = vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    const callCountAfterMount = fetchSpy.mock.calls.length;

    // Advance past the 500ms debounce window so the visibility refetch is not blocked
    await vi.advanceTimersByTimeAsync(600);

    // Simulate tab becoming visible — listener must be registered
    Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flushPromises();

    // fetchSubscription must have been called at least once more after visibility event
    expect(fetchSpy.mock.calls.length).toBeGreaterThan(callCountAfterMount);
  });
});

// ─── Suite N: pollAborted flag ─────────────────────────────────────────────

describe('BillingSubscriptionsComponent — pollAborted abort flag', () => {
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

  it('sets pollAborted to true on beforeUnmount', async () => {
    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: {},
    });
    await flushPromises();

    expect(wrapper.vm.pollAborted).toBe(false);
    wrapper.unmount();
    expect(wrapper.vm.pollAborted).toBe(true);
    wrapper = null;
  });

  it('stops pollSubscription recursion when pollAborted is set during an in-flight fetch', async () => {
    // fetchSubscription never resolves quickly — we control timing
    let resolveFetch;
    vi.spyOn(store, 'fetchSubscription').mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; }),
    );

    wrapper = mountSubscriptions({
      serverConfig: { billing: { meterMode: false } },
      routeQuery: { tab: 'subscriptions', success: 'true' },
    });
    await flushPromises();

    // Polling has started — advance past the interval so the setTimeout fires
    vi.advanceTimersByTime(2000);

    // Unmount while fetchSubscription is still in-flight
    const vm = wrapper.vm;
    wrapper.unmount();
    wrapper = null;

    expect(vm.pollAborted).toBe(true);

    // Resolve the pending fetch — the post-await code should bail via pollAborted
    const fetchCallCount = store.fetchSubscription.mock.calls.length;
    resolveFetch({ data: { data: null } });
    await flushPromises();

    // No additional recursive setTimeout should have been scheduled
    vi.advanceTimersByTime(10000);
    // fetchSubscription call count must not grow beyond what was already in-flight
    expect(store.fetchSubscription.mock.calls.length).toBe(fetchCallCount);
  });
});

// ─── Suite T6: 2-column layout + drop dup bar + CTA redirect ─────────────────

describe('BillingSubscriptionsComponent — T6: 2-col layout, single meter bar, CTA to /pricing#units', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
    seedMeterStore(store);
    store.subscription = { status: 'active', plan: 'growth', currentPeriodEnd: new Date().toISOString() };
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('renders two v-col children inside the meter mode section (2-col layout)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const cols = wrapper.findAllComponents({ name: 'v-col' });
    expect(cols.length).toBeGreaterThanOrEqual(2);
  });

  it('renders only one meter component — no duplicate bar (BillingUsageBarComponent dropped)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // After 2-col redesign: only BillingMeterProgressComponent remains; BillingUsageBarComponent is removed
    const usageBars = wrapper.findAllComponents({ name: 'BillingUsageBarComponent' });
    const meterProgress = wrapper.findAllComponents({ name: 'BillingMeterProgressComponent' });
    // Either usageBar OR meterProgress, not both — total must be ≤ 1
    expect(usageBars.length + meterProgress.length).toBeLessThanOrEqual(1);
  });

  it('CTA "Buy compute extras" button navigates to /pricing#units (not a modal trigger)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // Find btn that contains "extra" or "compute" keyword in its text
    const buyCtaBtn = wrapper.findAllComponents({ name: 'v-btn' })
      .find((b) => b.text().toLowerCase().includes('extra') || b.text().toLowerCase().includes('buy compute'));
    expect(buyCtaBtn).toBeDefined();
    // Must use router `to` prop (not @click modal), pointing to /pricing#units
    const toProp = buyCtaBtn?.props('to') ?? buyCtaBtn?.attributes('to');
    expect(toProp).toContain('/pricing');
    expect(String(toProp)).toContain('#units');
  });

  it('does NOT open extrasCheckoutDialog when clicking the buy-compute CTA', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.vm.extrasCheckoutDialog).toBe(false);
    // CTA is a router link, not a click handler — dialog stays false
    const buyCtaBtn = wrapper.findAllComponents({ name: 'v-btn' })
      .find((b) => b.text().toLowerCase().includes('extra') || b.text().toLowerCase().includes('buy compute'));
    if (buyCtaBtn) await buyCtaBtn.trigger('click');
    await flushPromises();
    expect(wrapper.vm.extrasCheckoutDialog).toBe(false);
  });

  it('billing-subscriptions__meter-card count is exactly 1 (single bar card, no dup card)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const meterCards = wrapper.findAll('.billing-subscriptions__meter-card');
    // Left col has 1 meter card; extras is in right col with its own class
    expect(meterCards.length).toBe(1);
  });
});

// ─── Suite 3: extras-checkout-modal adapter against the REAL static-content export ──
// #4458: static-content packs moved to the V4 unified card schema. The extras-checkout
// modal still requires the legacy { packId, label, priceUsd, meterUnits } shape — this
// verifies the extrasPacks() adapter maps the ACTUAL billing.static-content.js packs
// export to that shape (not a hand-written legacy mock) when the backend hasn't
// returned packsAvailable yet (packsConfig fallback path).

describe('BillingSubscriptionsComponent — extras modal packs (real static-content fallback)', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    livePacks.splice(0, livePacks.length, ...realPacks);
    const store = useBillingStore();
    // No backend packsAvailable — forces the extrasPacks() packsConfig fallback.
    seedMeterStore(
      store,
      { ...mockUsageMeterNormal, packsAvailable: [] },
      { ...mockExtrasBalance, packsAvailable: [] },
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    livePacks.splice(0);
  });

  it('adapts every real V4 pack to the legacy modal shape { packId, label, priceUsd, meterUnits }', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const modal = wrapper.findComponent({ name: 'BillingExtrasCheckoutModalComponent' });
    const packsProp = modal.props('packs');
    expect(packsProp.length).toBe(realPacks.length);
    for (const pack of packsProp) {
      expect(typeof pack.packId).toBe('string');
      expect(typeof pack.label).toBe('string');
      expect(typeof pack.priceUsd).toBe('number');
      expect(typeof pack.meterUnits).toBe('number');
    }
  });

  it('modal packId matches the real static-content pack id (Stripe-facing contract preserved)', async () => {
    wrapper = mountSubscriptions({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const modal = wrapper.findComponent({ name: 'BillingExtrasCheckoutModalComponent' });
    const packsProp = modal.props('packs');
    expect(packsProp.map((p) => p.packId)).toEqual(realPacks.map((p) => p.id));
    expect(packsProp.map((p) => p.priceUsd)).toEqual(realPacks.map((p) => p.meta.priceUsd));
    expect(packsProp.map((p) => p.meterUnits)).toEqual(realPacks.map((p) => p.meta.meterUnits));
  });
});
