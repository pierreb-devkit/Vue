import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingCardComponent from '../components/billing.pricingCard.component.vue';
import { billingEn } from '../lang/en.js';
import { useAuthStore } from '../../auth/stores/auth.store.js';

const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

const vuetify = createVuetify();

const mockConfig = {
  vuetify: { theme: { flat: false, rounded: 'rounded-lg' } },
};

const freePlan = {
  id: 'free',
  name: 'Free',
  tagline: 'For starters',
  highlighted: false,
  cta: 'Get Started',
  features: [{ text: '1 project', included: true }],
  monthlyPrice: null,
  annualPrice: null,
};

const proPlan = {
  id: 'pro',
  name: 'Pro',
  tagline: 'For pros',
  highlighted: true,
  badge: 'Most Popular',
  cta: 'Upgrade',
  features: [
    { text: 'Unlimited projects', included: true },
    { text: 'Priority support', included: true },
  ],
  monthlyPrice: { id: 'price_monthly', amount: 29 },
  annualPrice: { id: 'price_annual', amount: 290 },
};

/**
 * Mount the pricing card component with Vuetify installed.
 * @param {Object} props Component props.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountComponent = (props = {}) =>
  mount(BillingPricingCardComponent, {
    props: { plan: freePlan, annual: false, current: false, ...props },
    global: {
      plugins: [vuetify, i18n],
      mocks: { config: mockConfig },
      stubs: {
        'v-tooltip': {
          name: 'v-tooltip',
          props: ['text', 'location'],
          template: '<div class="v-tooltip-stub"><slot name="activator" :props="{}" /></div>',
        },
        'v-skeleton-loader': {
          name: 'v-skeleton-loader',
          props: ['type'],
          template: '<div class="v-skeleton-loader-stub" />',
        },
      },
    },
  });

/**
 * Mount the pricing card with auth store seeded.
 * @param {Object} options - { plan, authIsLoggedIn, ...componentProps }
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountCard = ({ authIsLoggedIn = false, ...props } = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  // Seed auth store: isLoggedIn = !!cookieExpire
  if (authIsLoggedIn) {
    const auth = useAuthStore();
    auth.cookieExpire = '2099-01-01';
  }
  return mount(BillingPricingCardComponent, {
    props: { plan: freePlan, annual: false, current: false, ...props },
    global: {
      plugins: [pinia, vuetify, i18n],
      mocks: { config: mockConfig },
      stubs: {
        'v-tooltip': {
          name: 'v-tooltip',
          props: ['text', 'location'],
          template: '<div class="v-tooltip-stub"><slot name="activator" :props="{}" /></div>',
        },
        'v-skeleton-loader': {
          name: 'v-skeleton-loader',
          props: ['type'],
          template: '<div class="v-skeleton-loader-stub" />',
        },
      },
    },
  });
};

describe('BillingPricingCardComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders plan name and tagline', () => {
    const wrapper = mountComponent({ plan: proPlan });
    expect(wrapper.text()).toContain('Pro');
    expect(wrapper.text()).toContain('For pros');
  });

  it('renders plan.badge chip when badge is set (e.g. "500 compute @ signup" for Free)', () => {
    const planWithBadge = { ...freePlan, badge: '500 compute @ signup' };
    const wrapper = mountComponent({ plan: planWithBadge });
    expect(wrapper.text()).toContain('500 compute @ signup');
  });

  it('does not render badge chip when plan.badge is absent', () => {
    const wrapper = mountComponent({ plan: freePlan });
    // freePlan has no badge — chip must be absent
    const chip = wrapper.findComponent({ name: 'v-chip' });
    // The annual savings chip spacer div is rendered but there's no badge chip
    // We verify by checking the text doesn't contain any badge content
    expect(wrapper.text()).not.toContain('500 compute @ signup');
    expect(wrapper.text()).not.toContain('Most Popular');
  });

  it('displays "Free" for free plan when displayPrice is null', () => {
    const wrapper = mountComponent({ plan: freePlan });
    expect(wrapper.text()).toContain('Free');
    expect(wrapper.text()).not.toContain('Pricing unavailable');
  });

  it('displays "Pricing unavailable" for paid plan when pricing data is missing', () => {
    const paidNoPrices = { ...proPlan, monthlyPrice: null, annualPrice: null };
    const wrapper = mountComponent({ plan: paidNoPrices });
    expect(wrapper.text()).toContain('Pricing unavailable');
  });

  it('shows a text skeleton while Stripe pricing is loading', () => {
    const paidNoPrices = { ...proPlan, monthlyPrice: null, annualPrice: null };
    const wrapper = mountComponent({ plan: paidNoPrices, pricesLoading: true });
    const skeleton = wrapper.findComponent({ name: 'v-skeleton-loader' });
    expect(skeleton.exists()).toBe(true);
    // C.4: type changed from "button" (wrong pill shape) to "text" (correct for price display)
    expect(skeleton.props('type')).toBe('text');
    expect(wrapper.text()).not.toContain('Pricing unavailable');
  });

  it('shows a tooltip when paid pricing is unavailable after loading', () => {
    const paidNoPrices = { ...proPlan, monthlyPrice: null, annualPrice: null };
    const wrapper = mountComponent({ plan: paidNoPrices, pricesLoading: false });
    const tooltip = wrapper.findComponent({ name: 'v-tooltip' });
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.props('text')).toBe('Pricing temporarily unavailable');
  });

  it('displays monthly price when annual is false', () => {
    const wrapper = mountComponent({ plan: proPlan, annual: false });
    // Intl.NumberFormat USD: $29.00
    expect(wrapper.text()).toContain('$29.00');
    expect(wrapper.text()).toContain('/month');
  });

  it('displays annual price when annual is true', () => {
    const wrapper = mountComponent({ plan: proPlan, annual: true });
    expect(wrapper.text()).toContain('$290.00');
    expect(wrapper.text()).toContain('/year');
  });

  it('shows CTA button when not current plan', () => {
    const wrapper = mountComponent({ plan: proPlan, current: false });
    expect(wrapper.text()).toContain('Upgrade');
    expect(wrapper.text()).not.toContain('Current Plan');
  });

  it('shows Current Plan button when current', () => {
    const wrapper = mountComponent({ plan: proPlan, current: true });
    expect(wrapper.text()).toContain('Current Plan');
  });

  it('emits select with planId and monthly priceId when CTA is clicked', async () => {
    const wrapper = mountComponent({ plan: proPlan, current: false });
    const ctaBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Upgrade'));
    expect(ctaBtn).toBeDefined();
    await ctaBtn.trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0]).toEqual({
      planId: 'pro',
      priceId: 'price_monthly',
    });
  });

  it('emits select with annual priceId when annual is true', async () => {
    const wrapper = mountComponent({ plan: proPlan, current: false, annual: true });
    const ctaBtn = wrapper.findAll('.v-btn').find((b) => b.text().includes('Upgrade'));
    expect(ctaBtn).toBeDefined();
    await ctaBtn.trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0]).toEqual({
      planId: 'pro',
      priceId: 'price_annual',
    });
  });

  it('renders feature list', () => {
    const wrapper = mountComponent({ plan: proPlan });
    expect(wrapper.text()).toContain('Unlimited projects');
    expect(wrapper.text()).toContain('Priority support');
  });

  // ── Equivalences prop (meter mode) ───────────────────────────────────────

  it('renders equivalence bullets when equivalences prop is provided', () => {
    const wrapper = mountComponent({
      plan: proPlan,
      equivalences: [{ label: 'operations / week', count: 2000 }],
    });
    expect(wrapper.text()).toContain('~2000 operations / week');
  });

  it('renders multiple equivalences', () => {
    const wrapper = mountComponent({
      plan: proPlan,
      equivalences: [
        { label: 'scrapes / week', count: 1500 },
        { label: 'autofixes / week', count: 500 },
      ],
    });
    expect(wrapper.text()).toContain('~1500 scrapes / week');
    expect(wrapper.text()).toContain('~500 autofixes / week');
  });

  it('renders feature list alongside equivalences (additive — flat features show when no featureSections)', () => {
    // proPlan has flat features but no featureSections → v-else-if flat features fires even when equivalences present
    const wrapper = mountComponent({
      plan: proPlan,
      equivalences: [{ label: 'operations / week', count: 2000 }],
    });
    expect(wrapper.text()).toContain('Unlimited projects');
    expect(wrapper.text()).toContain('Priority support');
  });

  it('shows feature list when equivalences prop is null (backward compat)', () => {
    const wrapper = mountComponent({ plan: proPlan, equivalences: null });
    expect(wrapper.text()).toContain('Unlimited projects');
    expect(wrapper.text()).not.toContain('~');
  });

  it('shows feature list when equivalences prop is omitted (backward compat)', () => {
    const wrapper = mountComponent({ plan: proPlan });
    expect(wrapper.text()).toContain('Unlimited projects');
    expect(wrapper.text()).not.toContain('~');
  });

  it('shows feature list when equivalences is empty array', () => {
    const wrapper = mountComponent({ plan: proPlan, equivalences: [] });
    expect(wrapper.text()).toContain('Unlimited projects');
    expect(wrapper.text()).not.toContain('~');
  });

  // ── D.2 Structured equivalences (Phase 3 chips) ───────────────────────────

  it('renders BillingEquivalencesChipsComponent when equivalences are structured objects with kind', () => {
    const wrapper = mountComponent({
      plan: proPlan,
      equivalences: [
        { kind: 'easy', count: 500, label: 'light ops / week' },
        { kind: 'hard', count: 50, label: 'heavy ops / week' },
      ],
    });
    const chipsComp = wrapper.findComponent({ name: 'BillingEquivalencesChipsComponent' });
    expect(chipsComp.exists()).toBe(true);
    // Flat features render additively (proPlan has no featureSections, so v-else-if flat list fires)
    expect(wrapper.text()).toContain('Unlimited projects');
    // Legacy bullet list (with tilde prefix) must be hidden — chips component is used instead
    expect(wrapper.text()).not.toContain('~500');
  });

  it('falls back to legacy bullet list for flat equivalences (backward compat)', () => {
    const wrapper = mountComponent({
      plan: proPlan,
      equivalences: [{ label: 'operations / week', count: 2000 }],
    });
    const chipsComp = wrapper.findComponent({ name: 'BillingEquivalencesChipsComponent' });
    expect(chipsComp.exists()).toBe(false);
    expect(wrapper.text()).toContain('~2000 operations / week');
  });

  // ── Task 4.3: featureSections + inline annual savings ─────────────────────

  it('renders featureSections when provided (preferred over flat features)', () => {
    const plan = {
      id: 'pro',
      name: 'Pro',
      tagline: 't',
      cta: 'Go Pro',
      monthlyPrice: 39,
      annualPrice: 390,
      monthlyPriceObject: { amount: 39, id: 'price_xxx' },
      annualPriceObject: { amount: 390, id: 'price_yyy' },
      features: [{ text: 'flat-feature', included: true }],
      featureSections: [
        { title: 'Core', items: [{ text: 'sectioned-feature' }] },
      ],
    };
    const wrapper = mountComponent({ plan, annual: false });
    expect(wrapper.text()).toContain('sectioned-feature');
    expect(wrapper.text()).not.toContain('flat-feature');
  });

  it('falls back to flat features when featureSections is empty array', () => {
    const plan = {
      id: 'pro',
      name: 'Pro',
      tagline: 't',
      cta: 'Go Pro',
      monthlyPrice: 39,
      annualPrice: 390,
      features: [{ text: 'flat-feature', included: true }],
      featureSections: [],
    };
    const wrapper = mountComponent({ plan, annual: false });
    expect(wrapper.text()).toContain('flat-feature');
  });

  it('renders annual savings chip when annual=true and savings > 0', () => {
    const plan = {
      id: 'pro',
      name: 'Pro',
      tagline: 't',
      cta: 'Go Pro',
      monthlyPrice: 39,
      annualPrice: 390,
      monthlyPriceObject: { amount: 39, id: 'price_xxx' },
      annualPriceObject: { amount: 390, id: 'price_yyy' },
      features: [],
      featureSections: [],
    };
    const wrapper = mountComponent({ plan, annual: true });
    // 39*12=468, 390 → 17%
    expect(wrapper.text()).toMatch(/17%/);
  });

  it('does not render annual savings chip when annual=false', () => {
    const plan = {
      id: 'pro',
      name: 'Pro',
      tagline: 't',
      cta: 'Go Pro',
      monthlyPrice: 39,
      annualPrice: 390,
      monthlyPriceObject: { amount: 39, id: 'price_xxx' },
      annualPriceObject: { amount: 390, id: 'price_yyy' },
      features: [],
      featureSections: [],
    };
    const wrapper = mountComponent({ plan, annual: false });
    expect(wrapper.text()).not.toMatch(/17%/);
  });

  it('renders annual savings chip for legacy plans where monthlyPrice/annualPrice are { amount, id } objects', () => {
    const plan = {
      id: 'pro',
      name: 'Pro',
      tagline: 't',
      cta: 'Go Pro',
      // Legacy shape: prices as { amount, id } objects (pre-V2)
      monthlyPrice: { amount: 39, id: 'price_monthly' },
      annualPrice: { amount: 390, id: 'price_annual' },
      features: [],
      featureSections: [],
    };
    const wrapper = mountComponent({ plan, annual: true });
    // 39*12=468, 390 → 17%
    expect(wrapper.text()).toMatch(/17%/);
  });

  it('switches displayPrice from monthly to annual when annual prop flips', async () => {
    const plan = {
      id: 'pro',
      name: 'Pro',
      tagline: 't',
      cta: 'Go Pro',
      monthlyPrice: 19,
      annualPrice: 190,
      features: [],
      featureSections: [],
    };
    const wrapper = mountComponent({ plan, annual: false });
    expect(wrapper.text()).toContain('19');
    await wrapper.setProps({ annual: true });
    expect(wrapper.text()).toContain('190');
    // 19*12=228, 190 → 17% savings
    expect(wrapper.text()).toMatch(/17%/);
  });

  // ── Task 1.1: auth-aware CTA for Free plan ────────────────────────────────

  it('Free plan + guest → CTA label is "Sign up"', () => {
    const plan = { id: 'free', name: 'Free', tagline: 't', cta: 'Get Started', features: [], featureSections: [] };
    const wrapper = mountCard({ plan, authIsLoggedIn: false });
    expect(wrapper.text()).toContain('Sign up');
    expect(wrapper.text()).not.toContain('Get Started');
  });

  it('Free plan + signed-in → CTA label uses plan.cta (default)', () => {
    const plan = { id: 'free', name: 'Free', tagline: 't', cta: 'Get Started', features: [], featureSections: [] };
    const wrapper = mountCard({ plan, authIsLoggedIn: true });
    expect(wrapper.text()).toContain('Get Started');
  });

  it('Paid plan + guest → CTA label uses plan.cta (NOT "Sign up")', () => {
    const plan = { id: 'pro', name: 'Pro', tagline: 't', cta: 'Go Pro', features: [], featureSections: [], monthlyPrice: 39, annualPrice: 390 };
    const wrapper = mountCard({ plan, authIsLoggedIn: false });
    expect(wrapper.text()).toContain('Go Pro');
    expect(wrapper.text()).not.toContain('Sign up');
  });

  it('Free plan + guest click → emits select with intent: "signup"', async () => {
    const plan = { id: 'free', name: 'Free', tagline: 't', cta: 'Get Started', features: [], featureSections: [] };
    const wrapper = mountCard({ plan, authIsLoggedIn: false });
    await wrapper.find('button').trigger('click');
    const emits = wrapper.emitted('select');
    expect(emits).toBeTruthy();
    expect(emits[0][0].intent).toBe('signup');
  });

  // ── Bug fix: equivalences + featureSections additive rendering ────────────

  describe('equivalences + featureSections additive rendering', () => {
    it('renders BOTH equivalences chips AND feature sections when both present', () => {
      const plan = {
        id: 'pro',
        name: 'Pro',
        tagline: 't',
        cta: 'Go Pro',
        monthlyPrice: 39,
        annualPrice: 390,
        features: [{ text: 'flat-feature', included: true }],
        featureSections: [
          { title: 'Core', items: [{ text: 'sectioned-feature' }] },
        ],
      };
      const wrapper = mountComponent({
        plan,
        equivalences: [
          { kind: 'easy', count: 1600, label: 'scrap runs / week' },
        ],
      });
      // Equivalences chips component renders
      const chipsComp = wrapper.findComponent({ name: 'BillingEquivalencesChipsComponent' });
      expect(chipsComp.exists()).toBe(true);
      // Feature section renders (independent of equivalences)
      const sectionComp = wrapper.findComponent({ name: 'BillingPricingFeatureSectionComponent' });
      expect(sectionComp.exists()).toBe(true);
      // Sectioned feature text is present
      expect(wrapper.text()).toContain('sectioned-feature');
      // Flat features do NOT render (featureSections takes precedence via v-if/v-else-if)
      expect(wrapper.text()).not.toContain('flat-feature');
    });

    it('renders ONLY feature sections when equivalences is null', () => {
      const plan = {
        id: 'pro',
        name: 'Pro',
        tagline: 't',
        cta: 'Go Pro',
        monthlyPrice: 39,
        annualPrice: 390,
        features: [{ text: 'flat-feature', included: true }],
        featureSections: [
          { title: 'Core', items: [{ text: 'sectioned-feature' }] },
        ],
      };
      const wrapper = mountComponent({ plan, equivalences: null });
      // No chips component
      const chipsComp = wrapper.findComponent({ name: 'BillingEquivalencesChipsComponent' });
      expect(chipsComp.exists()).toBe(false);
      // Feature section renders
      const sectionComp = wrapper.findComponent({ name: 'BillingPricingFeatureSectionComponent' });
      expect(sectionComp.exists()).toBe(true);
      expect(wrapper.text()).toContain('sectioned-feature');
    });

    it('renders ONLY equivalences chips when plan has no featureSections and no flat features', () => {
      const plan = {
        id: 'pro',
        name: 'Pro',
        tagline: 't',
        cta: 'Go Pro',
        monthlyPrice: 39,
        annualPrice: 390,
        features: [],
        featureSections: [],
      };
      const wrapper = mountComponent({
        plan,
        equivalences: [{ kind: 'easy', count: 800, label: 'ops / week' }],
      });
      // Chips component renders
      const chipsComp = wrapper.findComponent({ name: 'BillingEquivalencesChipsComponent' });
      expect(chipsComp.exists()).toBe(true);
      // No feature section (empty featureSections)
      const sectionComp = wrapper.findComponent({ name: 'BillingPricingFeatureSectionComponent' });
      expect(sectionComp.exists()).toBe(false);
    });
  });
});
