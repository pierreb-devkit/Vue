import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useBillingStore } from '../stores/billing.store';
import BillingUpgradePrompt from '../components/billing.upgradePrompt.component.vue';

const vuetify = createVuetify();

/**
 * Dynamically re-import the resolver + component after mocking the underlying config
 * service, so the module-scope `resolveStaticContent()` call picks up the per-test
 * override — an EMPTY `staticContent` isolates the devkit's own defaults regardless of
 * the real ambient generated config. Mirrors the pattern in
 * billing.resolveStaticContent.unit.tests.js. Callers must unmock + `vi.resetModules()`
 * afterwards (see the `afterEach` in the describe block(s) below).
 * @param {Object} staticContent - Value to install at config.billing.staticContent.
 * @returns {Promise<{Component: Object, useBillingStore: Function, resolveStaticContent: Function}>}
 */
async function loadWithConfig(staticContent) {
  vi.resetModules();
  vi.doMock('../../../lib/services/config.js', () => ({
    default: { billing: { staticContent } },
  }));
  const { default: Component } = await import('../components/billing.upgradePrompt.component.vue');
  const storeModule = await import('../stores/billing.store.js');
  const resolverModule = await import('../lib/billing.resolveStaticContent.js');
  return { Component, useBillingStore: storeModule.useBillingStore, resolveStaticContent: resolverModule.resolveStaticContent };
}

/**
 * Mount the upgrade prompt component with Vuetify and Pinia installed.
 * @param {Object} props Component props.
 * @param {Object} [quotaData] Quota data to set on the store.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountComponent = (props, quotaData = null) => {
  if (quotaData) {
    const store = useBillingStore();
    store.quota = quotaData;
  }
  return mount(BillingUpgradePrompt, {
    props,
    global: {
      plugins: [vuetify],
      stubs: {
        RouterLink: true,
      },
    },
  });
};

describe('BillingUpgradePrompt', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows generic message without resource/action props', () => {
    const wrapper = mountComponent({ requiredPlan: 'pro' });
    expect(wrapper.text()).toContain('This feature requires the');
    expect(wrapper.text()).toContain('pro');
    expect(wrapper.text()).toContain('plan');
  });

  it('shows specific usage message with resource/action props', () => {
    const wrapper = mountComponent(
      { requiredPlan: 'pro', resource: 'documents', action: 'create' },
      {
        plan: 'free',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 10 },
      },
    );
    expect(wrapper.text()).toContain("You've used 5 of 10 documents create");
  });

  it('uses custom label in specific usage message', () => {
    const wrapper = mountComponent(
      { requiredPlan: 'pro', resource: 'documents', action: 'create', label: 'Documents' },
      {
        plan: 'free',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 10 },
      },
    );
    expect(wrapper.text()).toContain("You've used 5 of 10 Documents");
  });

  it('renders Upgrade button linking to /pricing', () => {
    const wrapper = mountComponent({ requiredPlan: 'pro' });
    const btn = wrapper.findComponent({ name: 'v-btn' });
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('Upgrade');
    expect(btn.props('to')).toBe('/pricing');
  });

  it('routes the Buy units CTA to /pricing#units in meter mode (single billing entry, no modal event)', () => {
    const wrapper = mountComponent({ requiredPlan: 'pro', mode: 'meter' });
    const btn = wrapper.findComponent({ name: 'v-btn' });
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('Buy units');
    expect(btn.props('to')).toBe('/pricing#units');
    expect(wrapper.emitted('buy-pack')).toBeUndefined();
  });

  it('shows out-of-compute copy in meter mode, never the plan-requirement text', () => {
    const wrapper = mountComponent({ requiredPlan: 'Growth', mode: 'meter' });
    expect(wrapper.text()).toContain('out of compute');
    expect(wrapper.text()).not.toContain('requires the');
  });

  it('shows generic message when resource/action set but no quota data', () => {
    const wrapper = mountComponent(
      { requiredPlan: 'pro', resource: 'documents', action: 'create' },
      {
        plan: 'free',
        period: '2026-03',
        usage: {},
        limits: {},
      },
    );
    expect(wrapper.text()).toContain('This feature requires the');
    expect(wrapper.text()).not.toContain("You've used");
  });

  describe('post-grant variant (exhaustedAfterGrant)', () => {
    /**
     * Mount with billing store pre-seeded with the given state fields.
     * @param {Object} storeState Fields to set on the billingStore.
     * @returns {import('@vue/test-utils').VueWrapper}
     */
    const mountWithStore = (storeState) => {
      const store = useBillingStore();
      Object.assign(store, storeState);
      return mount(BillingUpgradePrompt, {
        props: { requiredPlan: 'growth', mode: 'meter' },
        global: {
          plugins: [vuetify],
          stubs: { RouterLink: true },
        },
      });
    };

    it('renders post-grant copy when exhaustedAfterGrant is true', () => {
      const wrapper = mountWithStore({
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      expect(wrapper.text()).toMatch(/signup grant.*depleted|free compute.*used up/i);
    });

    it('renders the primary pack CTA first, config-sourced from the resolved static content', () => {
      const wrapper = mountWithStore({
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      const packBtn = wrapper.find('[data-test="cta-pack"]');
      expect(packBtn.exists()).toBe(true);
      expect(packBtn.text()).toMatch(/pack/i);
      // Post-grant pack CTA routes to the single billing entry point, not a modal event.
      expect(wrapper.findComponent('[data-test="cta-pack"]').props('to')).toBe('/pricing#units');
    });

    it('renders secondary upgrade CTA in post-grant variant', () => {
      const wrapper = mountWithStore({
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      const upgradeBtn = wrapper.find('[data-test="cta-upgrade"]');
      expect(upgradeBtn.exists()).toBe(true);
      expect(upgradeBtn.text()).toMatch(/upgrade/i);
    });

    it('does not render post-grant variant when plan is not free', () => {
      const wrapper = mountWithStore({
        subscription: { plan: 'growth' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      expect(wrapper.text()).not.toMatch(/signup grant.*depleted/i);
    });

    it('does not render post-grant variant when balance is positive', () => {
      const wrapper = mountWithStore({
        subscription: { plan: 'free' },
        extrasBalance: { balance: 100 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      expect(wrapper.text()).not.toMatch(/signup grant.*depleted/i);
    });

    it('does not render post-grant variant when no signup_grant entry in ledger', () => {
      const wrapper = mountWithStore({
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'pack', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      expect(wrapper.text()).not.toMatch(/signup grant.*depleted/i);
    });

    it('does not render post-grant variant when subscription is null', () => {
      const wrapper = mountWithStore({
        subscription: null,
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      expect(wrapper.text()).not.toMatch(/signup grant.*depleted/i);
    });

    it('does not render post-grant variant in subscription mode even if exhaustedAfterGrant is true', () => {
      const store = useBillingStore();
      Object.assign(store, {
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      // mode='subscription' (default) — post-grant branch must not show, regular prompt must show
      const wrapper = mount(BillingUpgradePrompt, {
        props: { requiredPlan: 'growth' }, // mode defaults to 'subscription'
        global: {
          plugins: [vuetify],
          stubs: { RouterLink: true },
        },
      });
      expect(wrapper.text()).not.toMatch(/signup grant.*depleted/i);
      // Regular prompt still shows
      expect(wrapper.text()).toMatch(/requires the|Upgrade/i);
    });

    it('devkit default renders generic placeholder copy — no downstream-specific product literal', async () => {
      // This is a leak-guard for the DEVKIT'S OWN bare-stack default specifically — not
      // "whatever's currently configured". Force config.billing.staticContent to empty so
      // resolveStaticContent() falls through to the devkit defaults regardless of the real
      // ambient generated config (bare stack today, a consumer's own build tomorrow) — a
      // consumer whose OWN static content legitimately contains "growth"/"boost" must never
      // make this assertion spuriously fail. Isolated the same way core.appSpinner's default-
      // rendering contract is (mock the config service, not a consumer value, rule 2).
      try {
        const { Component, useBillingStore: useIsolatedBillingStore, resolveStaticContent: resolveIsolated } = await loadWithConfig({});

        setActivePinia(createPinia());
        const store = useIsolatedBillingStore();
        Object.assign(store, {
          subscription: { plan: 'free' },
          extrasBalance: { balance: 0 },
          extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
        });
        const wrapper = mount(Component, {
          // Neutral requiredPlan ('pro', not 'growth') — this prop isn't rendered by the
          // post-grant (exhaustedAfterGrant) branch under test, but keeping it outside the
          // words the assertions below check for removes any ambiguity between "resolved
          // static text" and "prop passthrough".
          props: { requiredPlan: 'pro', mode: 'meter' },
          global: { plugins: [vuetify], stubs: { RouterLink: true } },
        });
        const text = wrapper.text();
        // Read the expected grant label from the loaded/generated config (the same
        // resolveStaticContent() source the component itself reads) instead of asserting
        // a hardcoded devkit-default literal. (The rendered "$9.00" is the devkit's OWN
        // generic demo pack price — same placeholder used module-wide, e.g.
        // billing.subscriptions.component.vue — not a leaked literal; the component source
        // itself no longer hardcodes any price.)
        const { signupGrant } = resolveIsolated();
        expect(text.toLowerCase()).toContain(signupGrant.label.toLowerCase());
        expect(text).not.toMatch(/\bboost\b/i);
        expect(text).not.toMatch(/\bgrowth\b/i);
        expect(text).not.toContain('500 compute');
      } finally {
        vi.doUnmock('../../../lib/services/config.js');
        vi.resetModules();
      }
    });
  });

  describe('static-content resolution (issue #4460 — config-sourced pricing copy)', () => {
    // Unmock unconditionally after every test in this block, pass or fail — a mock left
    // active on assertion failure would leak into later tests' module-scope resolution.
    afterEach(() => {
      vi.doUnmock('../../../lib/services/config.js');
      vi.resetModules();
    });

    it('renders copy DRIVEN by the resolved static content — changing config changes the rendered copy', async () => {
      const { Component, useBillingStore: useStore } = await loadWithConfig({
        signupGrant: { label: 'custom test grant' },
        packs: [{ id: 'x', title: 'Custom Test Pack', cta: 'Buy Custom Test Pack', price: { amount: '$42.00', period: null } }],
        plans: [{ id: 'free', title: 'Free' }, { id: 'ultra', title: 'Ultra' }],
      });
      setActivePinia(createPinia());
      const store = useStore();
      Object.assign(store, {
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      const wrapper = mount(Component, {
        props: { requiredPlan: 'ultra', mode: 'meter' },
        global: { plugins: [vuetify], stubs: { RouterLink: true } },
      });
      const text = wrapper.text();
      expect(text).toContain('custom test grant');
      expect(text).toContain('Custom Test Pack');
      expect(text).toContain('$42.00');
      expect(text).toContain('Ultra');
    });
  });

  describe('config-driven meter period word (#4474)', () => {
    /**
     * Mount the meter-mode prompt with an optional `this.config` override installed
     * via global.mocks (the component reads `this.config`, not the imported config
     * service — same pattern as home.notfound.view.vue).
     * @param {Object} [config] - Value to install as `this.config` on the instance.
     * @returns {import('@vue/test-utils').VueWrapper}
     */
    const mountMeterPrompt = (config) =>
      mount(BillingUpgradePrompt, {
        props: { requiredPlan: 'pro', mode: 'meter' },
        global: {
          plugins: [vuetify],
          mocks: config ? { config } : {},
          stubs: { RouterLink: true },
        },
      });

    it('defaults to "monthly" when config.billing.meterPeriodWord is unset', () => {
      const wrapper = mountMeterPrompt();
      expect(wrapper.text()).toContain('upgrade for monthly compute');
    });

    it('uses the configured period word in the meter-mode prompt', () => {
      const wrapper = mountMeterPrompt({ billing: { meterPeriodWord: 'quarterly' } });
      expect(wrapper.text()).toContain('upgrade for quarterly compute');
      expect(wrapper.text()).not.toContain('monthly compute');
    });

    it('applies the configured period word to BOTH occurrences (meter prompt + post-grant depletion message)', () => {
      const store = useBillingStore();
      Object.assign(store, {
        subscription: { plan: 'free' },
        extrasBalance: { balance: 0 },
        extrasLedger: { entries: [{ source: 'signup_grant', amount: 500 }], total: 1, page: 1, limit: 20 },
      });
      const wrapper = mount(BillingUpgradePrompt, {
        props: { requiredPlan: 'pro', mode: 'meter' },
        global: {
          plugins: [vuetify],
          mocks: { config: { billing: { meterPeriodWord: 'quarterly' } } },
          stubs: { RouterLink: true },
        },
      });
      expect(wrapper.text()).toContain('upgrade for quarterly compute');
      expect(wrapper.text()).not.toContain('monthly compute');
    });
  });
});
