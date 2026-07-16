import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// ─── Static-content mock ─────────────────────────────────────────────────────
// livePacks is a hoisted live-array so per-suite tests can splice() test data in.
// resolveStaticContent() returns { packs: livePacks } — same reference, mutations are seen.

const livePacks = vi.hoisted(() => []);

vi.mock('../lib/billing.resolveStaticContent.js', () => ({
  resolveStaticContent: () => ({
    packs: livePacks,
    plans: [],
    faqs: [],
    pricingMode: null,
    tabs: null,
    header: null,
    halo: null,
  }),
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

import { useBillingStore } from '../stores/billing.store';
import BillingPacksComponent from '../components/billing.packs.component.vue';
import BillingCardComponent from '../components/billing.card.component.vue';
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
  vuetify: { theme: { rounded: '', flat: true } },
};

/**
 * @desc V4 unified pack shape — mirrors a downstream static-content contract.
 * Fields: id, title, subtitle, price, cta (string), info, features, badge, highlight.
 * meta carries Stripe-specific raw values (not used by the component renderer).
 * @type {Array<Object>}
 */
const mockPacksV4 = [
  {
    id: 'pack_starter',
    title: 'Starter',
    subtitle: 'Quick top-up',
    highlight: false,
    badge: null,
    price: { amount: '$9.00', period: null },
    cta: 'Buy Starter',
    info: '5,000 compute',
    features: [
      { icon: 'fa-solid fa-check', color: 'primary', text: '~40 easy scraps' },
    ],
    meta: { packId: 'pack_starter', priceUsd: 9, meterUnits: 5000 },
  },
  {
    id: 'pack_power',
    title: 'Power',
    subtitle: 'For sustained work',
    highlight: true,
    badge: 'Best Value',
    price: { amount: '$25.00', period: null },
    cta: 'Buy Power',
    info: '20,000 compute',
    features: [
      { icon: 'fa-solid fa-check', color: 'primary', text: '~160 easy scraps' },
    ],
    meta: { packId: 'pack_power', priceUsd: 25, meterUnits: 20000 },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const vuetify = createVuetify();

/**
 * @desc Mount BillingPacksComponent with Vuetify + Pinia.
 * Resets authState to logged-in-with-org baseline, then applies overrides.
 * @param {Object} [overrides] — optional auth state overrides
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountPacks(overrides = {}) {
  Object.assign(authState, {
    isLoggedIn: true,
    user: { currentOrganization: 'org_test_123' },
    serverConfig: { organizations: { enabled: true } },
    ...overrides,
  });
  return mount(BillingPacksComponent, {
    global: {
      plugins: [vuetify],
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
    // packsConfig mocked to [] — empty state
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it('renders empty state message when packsConfig is empty', async () => {
    wrapper = mountPacks();
    await flushPromises();
    expect(wrapper.text()).toContain('No unit packs available at this time.');
  });

  it('does not render any BillingCardComponent when packsConfig is empty', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    expect(cards.length).toBe(0);
  });
});

// ─── Suite 2: BillingCardComponent rendering ─────────────────────────────────

describe('BillingPacksComponent — BillingCardComponent rendering', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Inject V4 packs into the live mock array (seen by component's packsConfig)
    livePacks.splice(0, livePacks.length, ...mockPacksV4);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    livePacks.splice(0);
  });

  it('renders one BillingCardComponent per pack in packsConfig', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    expect(cards.length).toBe(mockPacksV4.length);
  });

  it('passes a fully-resolved item prop to each BillingCardComponent', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    for (const card of cards) {
      const item = card.props('item');
      expect(item).toBeDefined();
      // Required V4 fields
      expect(typeof item.id).toBe('string');
      expect(typeof item.title).toBe('string');
      expect(typeof item.subtitle).toBe('string');
      expect(item.price).toMatchObject({ amount: expect.any(String) });
      // cta is resolved from string → object by resolvedItems
      expect(item.cta).toMatchObject({
        label: expect.any(String),
        variant: expect.any(String),
        disabled: expect.any(Boolean),
        loading: expect.any(Boolean),
      });
    }
  });

  it('item.cta.label derives from the static-content pack cta string', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    expect(cards[0].props('item').cta.label).toBe('Buy Starter');
    expect(cards[1].props('item').cta.label).toBe('Buy Power');
  });

  it('highlighted pack gets flat+primary cta; non-highlighted gets outlined+null', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    // pack_starter: highlight false → outlined, null color
    expect(cards[0].props('item').cta.variant).toBe('outlined');
    expect(cards[0].props('item').cta.color).toBeNull();
    // pack_power: highlight true → flat, primary color
    expect(cards[1].props('item').cta.variant).toBe('flat');
    expect(cards[1].props('item').cta.color).toBe('primary');
  });

  it('resolvedItems always comes from static-content, never from store', async () => {
    // Populate store with different items to confirm they are not rendered
    const store = useBillingStore();
    store.usageMeter = {
      packsAvailable: [
        { id: 'store_only', title: 'Store Only', price: { amount: '$99.00', period: null }, cta: 'Store CTA', highlight: false, badge: null, info: null, features: [] },
      ],
    };
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    expect(cards.length).toBe(mockPacksV4.length);
    const renderedIds = cards.map((c) => c.props('item').id);
    expect(renderedIds).toContain('pack_starter');
    expect(renderedIds).toContain('pack_power');
    expect(renderedIds).not.toContain('store_only');
  });
});

// ─── Suite 3: Purchase flow ───────────────────────────────────────────────────

describe('BillingPacksComponent — purchase flow', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
    livePacks.splice(0, livePacks.length, ...mockPacksV4);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    livePacks.splice(0);
  });

  it('calls createExtrasCheckout with pack.id on cta-click (happy path)', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    wrapper = mountPacks();
    await flushPromises();
    // Emit cta-click directly on the BillingCardComponent child
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    firstCard.vm.$emit('cta-click', { id: 'pack_starter' });
    await flushPromises();
    expect(store.createExtrasCheckout).toHaveBeenCalledWith('pack_starter');
  });

  it('does NOT render inline purchaseError alert (errors handled by centralized snackbar)', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockRejectedValue(new Error('Network error'));
    wrapper = mountPacks();
    await flushPromises();
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    firstCard.vm.$emit('cta-click', { id: 'pack_starter' });
    await flushPromises();
    expect(wrapper.find('.v-alert').exists()).toBe(false);
  });

  it('sets cta.loading=true on the purchasing card and cta.disabled=true on all others', async () => {
    let resolveCheckout;
    vi.spyOn(store, 'createExtrasCheckout').mockReturnValue(
      new Promise((resolve) => {
        resolveCheckout = resolve;
      }),
    );
    wrapper = mountPacks();
    await flushPromises();
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    firstCard.vm.$emit('cta-click', { id: 'pack_starter' });
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    // Purchasing card: loading=true, disabled=false (it has the spinner, not greyed out)
    expect(cards[0].props('item').cta.loading).toBe(true);
    expect(cards[0].props('item').cta.disabled).toBe(false);
    // Other cards: loading=false, disabled=true (greyed out while another is in progress)
    expect(cards[1].props('item').cta.loading).toBe(false);
    expect(cards[1].props('item').cta.disabled).toBe(true);
    resolveCheckout();
    await flushPromises();
  });

  it('clears purchasingId after checkout resolves (all cards re-enabled)', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    wrapper = mountPacks();
    await flushPromises();
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    firstCard.vm.$emit('cta-click', { id: 'pack_starter' });
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    for (const card of cards) {
      expect(card.props('item').cta.disabled).toBe(false);
      expect(card.props('item').cta.loading).toBe(false);
    }
  });

  it('redirects guest to /signin instead of initiating checkout', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    const pushFn = vi.fn();
    wrapper = mountPacks({ isLoggedIn: false, user: null, serverConfig: null });
    wrapper.vm.$router = { push: pushFn };
    await flushPromises();
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    firstCard.vm.$emit('cta-click', { id: 'pack_starter' });
    await flushPromises();
    expect(store.createExtrasCheckout).not.toHaveBeenCalled();
    expect(pushFn).toHaveBeenCalledWith({ path: '/signin', query: { redirect: '/pricing' } });
  });

  it('redirects logged-in user without org to /organization-required', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    const pushFn = vi.fn();
    wrapper = mountPacks({
      isLoggedIn: true,
      user: { currentOrganization: null },
      serverConfig: { organizations: { enabled: true } },
    });
    wrapper.vm.$router = { push: pushFn };
    await flushPromises();
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    firstCard.vm.$emit('cta-click', { id: 'pack_starter' });
    await flushPromises();
    expect(store.createExtrasCheckout).not.toHaveBeenCalled();
    expect(pushFn).toHaveBeenCalledWith({ path: '/organization-required' });
  });
});

// ─── Suite 4: Real static-content export (regression guard for #4458) ────────
// Renders against the ACTUAL `packs` export from billing.static-content.js — not
// a hand-written V4 mock. This is the shape that crashed in #4458: the card render
// (item.price.amount unguarded) and the CTA id (item.id undefined on legacy packs).

describe('BillingPacksComponent — real static-content export (not a hand-written mock)', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    store = useBillingStore();
    livePacks.splice(0, livePacks.length, ...realPacks);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    livePacks.splice(0);
  });

  it('renders one card per real devkit pack without throwing', async () => {
    expect(() => {
      wrapper = mountPacks();
    }).not.toThrow();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    expect(cards.length).toBe(realPacks.length);
  });

  it('every real pack resolves a string price.amount (guards the unguarded item.price.amount crash)', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    for (const card of cards) {
      expect(typeof card.props('item').price?.amount).toBe('string');
    }
  });

  it('every real pack resolves a defined item.id (guards the undefined-id no-op CTA)', async () => {
    wrapper = mountPacks();
    await flushPromises();
    const cards = wrapper.findAllComponents(BillingCardComponent);
    const ids = cards.map((card) => card.props('item').id);
    expect(ids).toEqual(realPacks.map((p) => p.id));
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('cta-click on a real pack triggers checkout with its real id', async () => {
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
    wrapper = mountPacks();
    await flushPromises();
    const firstCard = wrapper.findAllComponents(BillingCardComponent)[0];
    const expectedId = realPacks[0].id;
    firstCard.vm.$emit('cta-click', { id: expectedId });
    await flushPromises();
    expect(store.createExtrasCheckout).toHaveBeenCalledWith(expectedId);
  });
});
