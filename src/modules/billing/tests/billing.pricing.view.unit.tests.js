import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { computed } from 'vue';

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

// ─── Mutable usePricing state (controls mode-layout tests) ──────────────────

const pricingState = vi.hoisted(() => ({
  mode: 'subscription',
  // V4 schema — title/subtitle/highlight (matches static-content & BillingCardComponent contract).
  plans: [
    { id: 'free', title: 'Free', subtitle: 'For starters', highlight: false, badge: null, cta: 'Get started', features: [] },
    { id: 'pro', title: 'Pro', subtitle: 'For pros', highlight: false, badge: null, cta: 'Upgrade', features: [] },
  ],
  packs: [],
  faqs: { title: '', subtitle: null, content: [] },
  tabs: {},
  header: {},
  halo: null,
  maxAnnualSavingsPct: 0,
  hasPlans: true,
  hasPacks: false,
  hasFaqs: false,
}));

vi.mock('../composables/billing.usePricing.js', () => {
  /** Shared factory — builds the mocked usePricing return shape from pricingState. */
  function buildPricingMock() {
    // Note: `computed` is imported at module scope; `pricingState` is from vi.hoisted().
    // Both are safely accessible inside the factory because vi.mock runs lazily.
    return {
      mode: computed(() => pricingState.mode),
      plans: computed(() => pricingState.plans),
      packs: computed(() => pricingState.packs),
      faqs: computed(() => pricingState.faqs),
      tabs: computed(() => pricingState.tabs),
      header: computed(() => pricingState.header),
      halo: computed(() => pricingState.halo),
      maxAnnualSavingsPct: computed(() => pricingState.maxAnnualSavingsPct),
      hasPlans: computed(() => pricingState.hasPlans),
      hasPacks: computed(() => pricingState.hasPacks),
      hasFaqs: computed(() => pricingState.hasFaqs),
    };
  }
  return {
    usePricing: () => buildPricingMock(),
    default: () => buildPricingMock(),
  };
});

// ─── useCurrencyFormat mock (new view uses formatPrice) ─────────────────────

vi.mock('../composables/billing.useCurrencyFormat.js', () => ({
  useCurrencyFormat: () => ({
    formatPrice: (amount) => `$${amount}`,
  }),
}));

// ─── Imports (after mocks) ──────────────────────────────────────────────────

import { useBillingStore } from '../stores/billing.store';
import BillingPricingView from '../views/billing.pricing.view.vue';

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
  BillingCardComponent: true,
  BillingPacksComponent: true,
  HomeTabsComponent: true,
  // homeBlurBackgroundComponent is intentionally NOT stubbed so .blur-background renders
  // VSnackbar uses VOverlay → locationStrategies → visualViewport which is undefined in jsdom
  VSnackbar: { name: 'VSnackbar', template: '<div />', props: ['modelValue', 'color', 'timeout', 'location'] },
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
      plugins: [vuetify],
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

// ─── Suite: Mode-aware layout ────────────────────────────────────────────────

describe('BillingPricingView — mode-aware layout', () => {
  let wrapper;
  let store;

  const componentStubsWithFAQ = {
    RouterLink: true,
    BillingPricingToggleComponent: true,
    BillingCardComponent: true,
    BillingPacksComponent: true,
    HomeTabsComponent: true,
    homeFaqComponent: true,
    // homeBlurBackgroundComponent is intentionally NOT stubbed so .blur-background renders
    // VSnackbar uses VOverlay → locationStrategies → visualViewport which is undefined in jsdom
    VSnackbar: { name: 'VSnackbar', template: '<div />', props: ['modelValue', 'color', 'timeout', 'location'] },
  };

  /**
   * @desc Mount the view with a given pricingState override.
   * @param {Object} opts
   * @param {string} opts.pricingMode - 'subscription' | 'packs' | 'both-tabs'
   * @param {Array} [opts.faqs] - FAQ entries (controls hasFaqs)
   * @param {Array} [opts.plans] - Plans array override
   * @returns {Promise<import('@vue/test-utils').VueWrapper>}
   */
  async function mountPricingView({ pricingMode, faqs = [], plans } = {}) {
    pricingState.mode = pricingMode;
    pricingState.faqs = { title: '', subtitle: null, content: faqs };
    pricingState.hasFaqs = faqs.length > 0;
    if (plans !== undefined) {
      pricingState.plans = plans;
      pricingState.hasPlans = plans.length > 0;
    } else {
      // V4 schema — title/subtitle/highlight (matches static-content & BillingCardComponent contract).
      pricingState.plans = [
        { id: 'free', title: 'Free', subtitle: 'For starters', highlight: false, badge: null, cta: 'Get started', features: [] },
        { id: 'pro', title: 'Pro', subtitle: 'For pros', highlight: false, badge: null, cta: 'Upgrade', features: [] },
      ];
      pricingState.hasPlans = true;
    }
    pricingState.packs = pricingMode === 'packs' ? [{ id: 'p1', name: 'Pack 500' }] : [];
    pricingState.hasPacks = pricingState.packs.length > 0;

    authState.serverConfig = { billing: { meterMode: false } };
    authState.isLoggedIn = true;

    const w = mount(BillingPricingView, {
      global: {
        plugins: [vuetify],
        mocks: {
          config: mockConfig,
          $route: { path: '/pricing', hash: '', query: {} },
          $router: { replace: vi.fn(), push: vi.fn() },
        },
        stubs: componentStubsWithFAQ,
      },
    });
    await flushPromises();
    return w;
  }

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

  it('subscription mode: renders plans grid + toggle, NO packs grid, NO tabs', async () => {
    wrapper = await mountPricingView({ pricingMode: 'subscription' });
    expect(wrapper.find('[data-test="pricing-plans-grid"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="pricing-toggle"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="pricing-packs-grid"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="pricing-tabs"]').exists()).toBe(false);
  });

  it('packs mode: renders packs grid only, NO plans, NO toggle, NO tabs', async () => {
    wrapper = await mountPricingView({ pricingMode: 'packs' });
    expect(wrapper.find('[data-test="pricing-packs-grid"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="pricing-plans-grid"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="pricing-toggle"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="pricing-tabs"]').exists()).toBe(false);
  });

  it('both-tabs mode: renders glass tabs + plans tab default', async () => {
    wrapper = await mountPricingView({ pricingMode: 'both-tabs' });
    expect(wrapper.find('[data-test="pricing-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="pricing-plans-grid"]').exists()).toBe(true);
  });

  it('renders FAQ component when faqs are present', async () => {
    wrapper = await mountPricingView({
      pricingMode: 'subscription',
      faqs: [{ id: 'q1', question: 'Q?', answer: 'A.' }],
    });
    expect(wrapper.find('[data-test="pricing-faq"]').exists()).toBe(true);
  });

  it('does not render FAQ when faqs is empty', async () => {
    wrapper = await mountPricingView({ pricingMode: 'subscription', faqs: [] });
    expect(wrapper.find('[data-test="pricing-faq"]').exists()).toBe(false);
  });

  it('renders the halo background wrapper around the pricing section', async () => {
    wrapper = await mountPricingView({ pricingMode: 'subscription' });
    expect(wrapper.find('.blur-background').exists()).toBe(true);
  });
});

// ─── Suite: currentPlanId guest guard ────────────────────────────────────────

describe('BillingPricingView — currentPlanId guest guard', () => {
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

  it('returns null when not logged in', async () => {
    wrapper = mountPricing({ isLoggedIn: false });
    await flushPromises();
    expect(wrapper.vm.currentPlanId).toBeNull();
    expect(wrapper.vm.isCurrentPlan('free')).toBe(false);
  });

  it('returns subscription.plan when logged in with a subscription', async () => {
    wrapper = mountPricing({ isLoggedIn: true });
    await flushPromises();
    store.subscription = { plan: 'growth' };
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.currentPlanId).toBe('growth');
    expect(wrapper.vm.isCurrentPlan('growth')).toBe(true);
  });

  it('returns "free" when logged in but subscription has no plan', async () => {
    wrapper = mountPricing({ isLoggedIn: true });
    await flushPromises();
    store.subscription = undefined;
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.currentPlanId).toBe('free');
    expect(wrapper.vm.isCurrentPlan('free')).toBe(true);
  });
});

// ─── Suite: resolvedPlanItems — BillingCardComponent unified schema ───────────

describe('BillingPricingView — resolvedPlanItems (V4 unified schema)', () => {
  let wrapper;
  let store;

  const plansWithPrices = [
    {
      id: 'free',
      title: 'Free',
      subtitle: 'For starters',
      price: { amount: 'FREE', period: null },
      highlight: false,
      badge: null,
      cta: 'Get started',
      features: [],
      info: null,
    },
    {
      id: 'growth',
      title: 'Growth',
      subtitle: 'For growing teams',
      price: { amount: '$39', period: '/month' },
      highlight: true,
      badge: 'MOST POPULAR',
      cta: 'Upgrade',
      features: [{ icon: 'fa-solid fa-check', color: 'primary', text: 'Unlimited scraps' }],
      info: null,
      meta: { monthlyPrice: 39, annualPrice: 390 },
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    pricingState.mode = 'subscription';
    pricingState.plans = plansWithPrices;
    pricingState.hasPlans = true;
    authState.isLoggedIn = true;
    authState.serverConfig = { billing: { meterMode: false } };
    store = useBillingStore();
    seedStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    sessionStorage.clear();
  });

  it('resolvedPlanItems uses BillingCardComponent schema (id, title, subtitle, price, cta, features, badge)', async () => {
    wrapper = mountPricing();
    await flushPromises();
    const items = wrapper.vm.resolvedPlanItems;
    expect(items).toHaveLength(2);
    const growth = items.find((i) => i.id === 'growth');
    expect(growth).toBeDefined();
    expect(growth.title).toBe('Growth');
    expect(growth.subtitle).toBe('For growing teams');
    expect(growth.badge).toBe('MOST POPULAR');
    expect(growth.cta).toBeDefined();
    expect(growth.price).toBeDefined();
    expect(Array.isArray(growth.features)).toBe(true);
  });

  it('price.chip is set when annual=true and annualSavingsPct > 0', async () => {
    wrapper = mountPricing();
    await flushPromises();
    // Activate annual toggle
    wrapper.vm.annual = true;
    await wrapper.vm.$nextTick();
    const items = wrapper.vm.resolvedPlanItems;
    const growth = items.find((i) => i.id === 'growth');
    // meta.monthlyPrice=39, meta.annualPrice=390 → savings pct = round((39-390/12)/39*100) = round((39-32.5)/39*100) ≈ 17
    expect(growth.price.chip).not.toBeNull();
    expect(growth.price.chip.color).toBe('success');
    expect(growth.price.chip.text).toMatch(/Save \d+%/);
  });

  it('price.chip is null when annual=false', async () => {
    wrapper = mountPricing();
    await flushPromises();
    wrapper.vm.annual = false;
    await wrapper.vm.$nextTick();
    const items = wrapper.vm.resolvedPlanItems;
    const growth = items.find((i) => i.id === 'growth');
    expect(growth.price.chip).toBeNull();
  });

  it('free plan always has price.chip null (no annual savings)', async () => {
    wrapper = mountPricing();
    await flushPromises();
    wrapper.vm.annual = true;
    await wrapper.vm.$nextTick();
    const items = wrapper.vm.resolvedPlanItems;
    const free = items.find((i) => i.id === 'free');
    expect(free.price.chip).toBeNull();
  });
});

// ─── Suite: both-tabs toggle disabled when Extras tab active ─────────────────

describe('BillingPricingView — both-tabs: toggle :disabled when activeTab === 1', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    pricingState.mode = 'both-tabs';
    pricingState.plans = [{ id: 'free', title: 'Free', subtitle: '', cta: 'Start', features: [], badge: null, highlight: false }, { id: 'pro', title: 'Pro', subtitle: '', cta: 'Upgrade', features: [], badge: null, highlight: false }];
    pricingState.hasPlans = true;
    pricingState.hasPacks = true;
    pricingState.packs = [{ id: 'p1' }];
    authState.isLoggedIn = true;
    authState.serverConfig = { billing: { meterMode: false } };
    store = useBillingStore();
    seedStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    sessionStorage.clear();
  });

  it('toggle is rendered with :disabled=false when activeTab === 0 (plans)', async () => {
    wrapper = mount(BillingPricingView, {
      global: {
        plugins: [vuetify],
        mocks: { config: mockConfig, $route: { path: '/pricing', hash: '', query: {} }, $router: { replace: vi.fn(), push: vi.fn() } },
        stubs: componentStubs,
      },
    });
    await flushPromises();
    wrapper.vm.activeTab = 0;
    await wrapper.vm.$nextTick();
    const toggle = wrapper.findComponent({ name: 'BillingPricingToggleComponent' });
    // :disabled="activeTab === 1" → false when activeTab is 0
    expect(toggle.exists()).toBe(true);
    expect(toggle.props('disabled')).toBe(false);
  });

  it('toggle is rendered with :disabled=true when activeTab === 1 (extras)', async () => {
    wrapper = mount(BillingPricingView, {
      global: {
        plugins: [vuetify],
        mocks: { config: mockConfig, $route: { path: '/pricing', hash: '', query: {} }, $router: { replace: vi.fn(), push: vi.fn() } },
        stubs: componentStubs,
      },
    });
    await flushPromises();
    wrapper.vm.activeTab = 1;
    await wrapper.vm.$nextTick();
    const toggle = wrapper.findComponent({ name: 'BillingPricingToggleComponent' });
    expect(toggle.exists()).toBe(true);
    expect(toggle.props('disabled')).toBe(true);
  });
});

// ─── Suite: resolvedPlanItems — sections passthrough + inheritsFrom → parentPlanName ──

describe('BillingPricingView — resolvedPlanItems sections + inheritsFrom resolution', () => {
  let wrapper;
  let store;

  const plansWithSections = [
    { id: 'starter', title: 'Starter', subtitle: 'For growing teams', highlight: false, badge: null, cta: 'Get started', features: [] },
    {
      id: 'pro',
      title: 'Pro',
      subtitle: 'For professionals',
      highlight: true,
      badge: null,
      cta: 'Upgrade',
      inheritsFrom: 'starter',
      sections: [
        { items: [{ text: 'Unlimited projects' }] },
        { title: 'Pro only', items: [{ text: 'Advanced analytics' }] },
      ],
    },
    { id: 'ghost', title: 'Ghost', subtitle: 'Dangling parent ref', highlight: false, badge: null, cta: 'Upgrade', inheritsFrom: 'does-not-exist', features: [] },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    pricingState.mode = 'subscription';
    pricingState.plans = plansWithSections;
    pricingState.hasPlans = true;
    authState.isLoggedIn = true;
    authState.serverConfig = { billing: { meterMode: false } };
    store = useBillingStore();
    seedStore(store);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    sessionStorage.clear();
  });

  it('resolves parentPlanName from an existing inheritsFrom id to the parent plan title', async () => {
    wrapper = mountPricing();
    await flushPromises();
    const pro = wrapper.vm.resolvedPlanItems.find((i) => i.id === 'pro');
    expect(pro.parentPlanName).toBe('Starter');
    expect(pro.inheritsFrom).toBe('starter');
  });

  it('yields parentPlanName null when inheritsFrom points to a non-existent plan id', async () => {
    wrapper = mountPricing();
    await flushPromises();
    const ghost = wrapper.vm.resolvedPlanItems.find((i) => i.id === 'ghost');
    expect(ghost.parentPlanName).toBeNull();
    // inheritsFrom is still forwarded verbatim (informational) even when unresolved.
    expect(ghost.inheritsFrom).toBe('does-not-exist');
  });

  it('yields parentPlanName null and inheritsFrom null when the plan has no inheritsFrom', async () => {
    wrapper = mountPricing();
    await flushPromises();
    const starter = wrapper.vm.resolvedPlanItems.find((i) => i.id === 'starter');
    expect(starter.parentPlanName).toBeNull();
    expect(starter.inheritsFrom).toBeNull();
  });

  it('forwards the sections array verbatim from static-content through resolvedPlanItems', async () => {
    wrapper = mountPricing();
    await flushPromises();
    const pro = wrapper.vm.resolvedPlanItems.find((i) => i.id === 'pro');
    expect(pro.sections).toEqual([
      { items: [{ text: 'Unlimited projects' }] },
      { title: 'Pro only', items: [{ text: 'Advanced analytics' }] },
    ]);
    // A plan without sections resolves to null (not undefined), matching the card contract.
    const starter = wrapper.vm.resolvedPlanItems.find((i) => i.id === 'starter');
    expect(starter.sections).toBeNull();
  });
});
