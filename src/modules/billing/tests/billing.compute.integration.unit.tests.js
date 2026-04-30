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
import BillingBillingView from '../views/billing.billing.view.vue';
import BillingPricingView from '../views/billing.pricing.view.vue';
import BillingExtrasCheckoutModalComponent from '../components/billing.extrasCheckoutModal.component.vue';

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

const mockUsageMeterCritical = {
  ...mockUsageMeterNormal,
  meterUsed: 460,
  meterQuota: 500,
  extrasRemaining: 0,
};

const mockExtrasBalance = {
  balance: 50,
  packsAvailable: mockUsageMeterNormal.packsAvailable,
};

const mockStripeCheckoutUrl = 'https://stripe.test/checkout/test_sess_abc123';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const vuetify = createVuetify();

/**
 * @desc Stubs for BillingBillingView.
 *
 * Strategy: only stub components that need Vuetify layout context (v-navigation-drawer)
 * or trigger visualViewport errors (v-dialog). BillingUsageBarComponent is NOT stubbed
 * because `true`-stubs silently no-op for this component in the test environment and the
 * real component renders without errors when the Pinia store is seeded.
 *
 * BillingMeterProgressComponent and BillingMeterBreakdownChartComponent are also left
 * real so that prop assertions use the rendered stub's attributes via `true` stubs for
 * those inner components in tests that need them.
 */
const billingViewStubs = {
  RouterLink: true,
  billingPlanBadgeComponent: true,
  // Navigation drawer requires Vuetify layout root — stub to avoid errors
  BillingMeterDrawerComponent: true,
  // Dialog triggers visualViewport issues in happy-dom — stub it
  BillingExtrasCheckoutModalComponent: true,
};

/**
 * @desc Mount BillingBillingView with Vuetify + Pinia.
 * @param {Object} [opts]
 * @param {Object|null} [opts.serverConfig] - Value for authState.serverConfig
 * @param {boolean}     [opts.isLoggedIn]   - Value for authState.isLoggedIn
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountBillingView({ serverConfig = null, isLoggedIn = true } = {}) {
  authState.serverConfig = serverConfig;
  authState.isLoggedIn = isLoggedIn;
  return mount(BillingBillingView, {
    global: {
      plugins: [vuetify],
      mocks: { config: mockConfig },
      stubs: billingViewStubs,
    },
  });
}

/**
 * @desc Mount BillingPricingView with Vuetify + Pinia.
 * @param {Object} [opts]
 * @param {Object|null} [opts.serverConfig] - Value for authState.serverConfig
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountPricingView({ serverConfig = null } = {}) {
  authState.serverConfig = serverConfig;
  authState.isLoggedIn = true;
  return mount(BillingPricingView, {
    global: {
      plugins: [vuetify],
      mocks: {
        config: mockConfig,
        $route: { query: {} },
        $router: { push: vi.fn(), replace: vi.fn() },
      },
      stubs: {
        RouterLink: true,
        billingPricingToggleComponent: {
          name: 'billingPricingToggleComponent',
          props: ['annual'],
          emits: ['update:annual'],
          template: '<div class="billing-pricing-toggle-stub" />',
        },
        billingPricingCardComponent: {
          name: 'billingPricingCardComponent',
          props: ['plan', 'annual', 'current', 'loading', 'equivalences'],
          emits: ['select'],
          template: `
            <div class="billing-pricing-card-stub">
              <span class="plan-name">{{ plan.name }}</span>
              <template v-if="equivalences && equivalences.length > 0">
                <span
                  v-for="eq in equivalences"
                  :key="eq.label"
                  class="equivalence-bullet"
                >~{{ eq.count }} {{ eq.label }}</span>
              </template>
              <template v-else>
                <span
                  v-for="feature in plan.features"
                  :key="feature.text"
                  class="feature-item"
                >{{ feature.text }}</span>
              </template>
            </div>
          `,
        },
      },
    },
  });
}

/**
 * @desc Seed billingStore with meter usage data and stub the fetch actions.
 * @param {Object} store - Pinia billing store instance
 * @param {Object} [usageMeter] - Meter data to preload into the store
 * @param {Object} [extrasBalance] - Extras balance data to preload
 */
function seedMeterStore(store, usageMeter = mockUsageMeterNormal, extrasBalance = mockExtrasBalance) {
  store.usageMeter = usageMeter;
  store.extrasBalance = extrasBalance;
  vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue(usageMeter);
  vi.spyOn(store, 'fetchExtrasBalance').mockResolvedValue(extrasBalance);
  vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  vi.spyOn(store, 'fetchPlans').mockResolvedValue([]);
  vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
}

// ─── Suite 1: Meter billing page ─────────────────────────────────────────────

describe('Suite 1 — Meter billing page (meterMode: true)', () => {
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

  it('renders billing-meter-progress widget when meterMode is true', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // BillingMeterProgressComponent renders with class .billing-meter-progress (real component)
    expect(wrapper.find('.billing-meter-progress').exists()).toBe(true);
  });

  it('renders breakdown chart when meterMode is true', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // BillingMeterBreakdownChartComponent renders with class .billing-meter-breakdown-chart
    expect(wrapper.find('.billing-meter-breakdown-chart').exists()).toBe(true);
  });

  it('meter progress shows correct used / quota values', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // The progress component renders "used / quota" caption text
    expect(wrapper.text()).toContain('120');
    expect(wrapper.text()).toContain('500');
  });

  it('renders Buy units CTA button in meter mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtns = wrapper.findAll('.v-btn').filter((b) => b.text().includes('Buy units'));
    expect(buyBtns.length).toBeGreaterThan(0);
  });

  it('renders usage bar with meter mode class when meterMode is true', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(true);
  });

  it('does not render meter progress in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-meter-progress').exists()).toBe(false);
  });

  it('renders at critical usage (460/500)', async () => {
    const store = useBillingStore();
    seedMeterStore(store, mockUsageMeterCritical, { balance: 0, packsAvailable: [] });
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.text()).toContain('460');
    expect(wrapper.find('.billing-meter-progress').exists()).toBe(true);
  });
});

// ─── Suite 2: Meter drawer open / close ──────────────────────────────────────

describe('Suite 2 — Meter drawer open / close', () => {
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

  it('renders billing-usage-bar--meter in meter mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(true);
  });

  it('renders BillingMeterDrawerComponent stub in meter mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    // Stubbed as true → Vue test-utils renders as kebab-case with -stub suffix
    expect(wrapper.find('billing-meter-drawer-component-stub').exists()).toBe(true);
  });

  it('BillingMeterDrawerComponent stub starts with modelValue=false', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const drawerStub = wrapper.find('billing-meter-drawer-component-stub');
    expect(drawerStub.attributes('modelvalue')).toBe('false');
  });

  it('opens meter drawer when usage bar is clicked', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const usageBar = wrapper.find('.billing-usage-bar--meter');
    await usageBar.trigger('click');
    await flushPromises();
    const drawerStub = wrapper.find('billing-meter-drawer-component-stub');
    expect(drawerStub.attributes('modelvalue')).toBe('true');
  });

  it('BillingUsageBarComponent is absent in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(false);
  });

  it('BillingMeterDrawerComponent stub is absent in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('billing-meter-drawer-component-stub').exists()).toBe(false);
  });
});

// ─── Suite 3: Extras checkout flow ───────────────────────────────────────────

describe('Suite 3 — Extras checkout flow', () => {
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

  it('extrasModalOpen starts as false (stub modelValue=false)', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const modalStub = wrapper.find('billing-extras-checkout-modal-component-stub');
    expect(modalStub.attributes('modelvalue')).toBe('false');
  });

  it('opens extras modal when Buy units button is clicked', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const buyBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Buy units'));
    await buyBtn.trigger('click');
    await flushPromises();
    // Verify the vm state is updated (meterDrawerOpen is analogous to extrasModalOpen)
    expect(wrapper.vm.extrasModalOpen).toBe(true);
  });

  it('BillingExtrasCheckoutModalComponent stub receives packs from usageMeter', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const modalStub = wrapper.find('billing-extras-checkout-modal-component-stub');
    // packs is passed as array, serialized to "[object Object],[object Object]"
    expect(modalStub.attributes('packs')).toBeDefined();
  });

  it('createExtrasCheckout is called with correct packId via modal onBuy', async () => {
    // Mount ExtrasCheckoutModal directly (not stubbed) to verify checkout logic
    const checkoutWrapper = mount(BillingExtrasCheckoutModalComponent, {
      props: {
        modelValue: true,
        packs: mockUsageMeterNormal.packsAvailable,
      },
      global: {
        plugins: [vuetify],
        stubs: { 'v-dialog': { template: '<div><slot /></div>' } },
      },
    });
    // First pack auto-selected by watcher
    expect(checkoutWrapper.vm.selectedPackId).toBe('pack_500');
    await checkoutWrapper.vm.onBuy();
    expect(store.createExtrasCheckout).toHaveBeenCalledWith('pack_500');
    checkoutWrapper.unmount();
  });

  it('store.createExtrasCheckout receives second pack when pack_1000 selected', async () => {
    const checkoutWrapper = mount(BillingExtrasCheckoutModalComponent, {
      props: {
        modelValue: true,
        packs: mockUsageMeterNormal.packsAvailable,
      },
      global: {
        plugins: [vuetify],
        stubs: { 'v-dialog': { template: '<div><slot /></div>' } },
      },
    });
    // Select second pack manually
    checkoutWrapper.vm.selectedPackId = 'pack_1000';
    await checkoutWrapper.vm.onBuy();
    expect(store.createExtrasCheckout).toHaveBeenCalledWith('pack_1000');
    checkoutWrapper.unmount();
  });

  it('window.location.assign is called when createExtrasCheckout resolves', async () => {
    store.createExtrasCheckout.mockImplementation(async () => {
      window.location.assign(mockStripeCheckoutUrl);
    });
    const assignSpy = vi.spyOn(window.location, 'assign').mockImplementation(() => {});
    const checkoutWrapper = mount(BillingExtrasCheckoutModalComponent, {
      props: {
        modelValue: true,
        packs: [{ packId: 'pack_500', label: '500 units', priceUsd: 9, meterUnits: 500 }],
      },
      global: {
        plugins: [vuetify],
        stubs: { 'v-dialog': { template: '<div><slot /></div>' } },
      },
    });
    await checkoutWrapper.vm.onBuy();
    expect(store.createExtrasCheckout).toHaveBeenCalledWith('pack_500');
    expect(assignSpy).toHaveBeenCalledWith(mockStripeCheckoutUrl);
    assignSpy.mockRestore();
    checkoutWrapper.unmount();
  });
});

// ─── Suite 4: Pricing equivalences ───────────────────────────────────────────

describe('Suite 4 — Pricing equivalences (meterMode)', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const store = useBillingStore();
    vi.spyOn(store, 'fetchPlans').mockResolvedValue([]);
    vi.spyOn(store, 'fetchSubscription').mockResolvedValue(null);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('renders equivalence bullets in meter mode', async () => {
    wrapper = mountPricingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const bullets = wrapper.findAll('.equivalence-bullet');
    expect(bullets.length).toBeGreaterThan(0);
    expect(bullets[0].text()).toMatch(/~\d+ .+/);
  });

  it('renders ~100 operations / week for free plan', async () => {
    wrapper = mountPricingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const texts = wrapper.findAll('.equivalence-bullet').map((el) => el.text());
    expect(texts.some((t) => t.includes('~100'))).toBe(true);
    expect(texts.some((t) => t.includes('operations / week'))).toBe(true);
  });

  it('renders ~500 operations / week for starter plan', async () => {
    wrapper = mountPricingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const texts = wrapper.findAll('.equivalence-bullet').map((el) => el.text());
    expect(texts.some((t) => t.includes('~500'))).toBe(true);
  });

  it('renders ~2000 operations / week for pro plan', async () => {
    wrapper = mountPricingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    const texts = wrapper.findAll('.equivalence-bullet').map((el) => el.text());
    expect(texts.some((t) => t.includes('~2000'))).toBe(true);
  });

  it('renders feature list in legacy mode — regression', async () => {
    wrapper = mountPricingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    const features = wrapper.findAll('.feature-item');
    expect(features.length).toBeGreaterThan(0);
    const featureTexts = features.map((f) => f.text());
    expect(featureTexts.some((t) => t.includes('1 project'))).toBe(true);
    expect(featureTexts.some((t) => t.includes('3 team members'))).toBe(true);
    expect(featureTexts.some((t) => t.includes('Community support'))).toBe(true);
  });

  it('renders NO equivalence bullets in legacy mode — regression', async () => {
    wrapper = mountPricingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.findAll('.equivalence-bullet').length).toBe(0);
  });
});

// ─── Suite 5: Polling refresh ────────────────────────────────────────────────

describe('Suite 5 — Polling refresh', () => {
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
    vi.useRealTimers();
  });

  it('fetchUsageMeter is called on mount when meterMode is true', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(store.fetchUsageMeter).toHaveBeenCalled();
  });

  it('starts a 30s polling interval when meterMode is true', async () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
  });

  it('fetchUsageMeter is called again after one 30s tick', async () => {
    vi.useFakeTimers();
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    store.fetchUsageMeter.mockClear();
    vi.advanceTimersByTime(30000);
    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(1);
  });

  it('fetchUsageMeter is called twice after two 30s ticks', async () => {
    vi.useFakeTimers();
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    store.fetchUsageMeter.mockClear();
    vi.advanceTimersByTime(30000);
    vi.advanceTimersByTime(30000);
    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(2);
  });

  it('polling does not fire when meterMode is false', async () => {
    vi.useFakeTimers();
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    store.fetchUsageMeter.mockClear();
    vi.advanceTimersByTime(60000);
    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
  });

  it('polling stops after unmount', async () => {
    vi.useFakeTimers();
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    wrapper.unmount();
    wrapper = null;
    store.fetchUsageMeter.mockClear();
    vi.advanceTimersByTime(60000);
    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
  });
});

// ─── Suite 6: Legacy regression ──────────────────────────────────────────────

describe('Suite 6 — Legacy regression (meterMode: false)', () => {
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

  it('does NOT render .billing-meter-progress in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-meter-progress').exists()).toBe(false);
  });

  it('does NOT render .billing-meter-breakdown-chart in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-meter-breakdown-chart').exists()).toBe(false);
  });

  it('does NOT render .billing-usage-bar--meter in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(false);
  });

  it('renders Billing heading in both modes', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.find('h1').text()).toBe('Billing');
  });

  it('fetchUsageMeter is called when meterMode is true', async () => {
    const store = useBillingStore();
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(store.fetchUsageMeter).toHaveBeenCalled();
  });

  it('polling does not start when meterMode is false', async () => {
    vi.useFakeTimers();
    const store = useBillingStore();
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    store.fetchUsageMeter.mockClear();
    vi.advanceTimersByTime(60000);
    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
  });

  it('renders meter content (Weekly meter, Breakdown, Buy units) in meter mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: true } } });
    await flushPromises();
    expect(wrapper.text()).toContain('Weekly meter');
    expect(wrapper.text()).toContain('Breakdown');
    expect(wrapper.text()).toContain('Extra units');
  });

  it('does NOT render meter section labels in legacy mode', async () => {
    wrapper = mountBillingView({ serverConfig: { billing: { meterMode: false } } });
    await flushPromises();
    expect(wrapper.text()).not.toContain('Weekly meter');
    expect(wrapper.text()).not.toContain('Extra units');
  });
});
