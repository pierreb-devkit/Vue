import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingCardComponent from '../components/billing.pricingCard.component.vue';
import { billingEn } from '../lang/en.js';

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

describe('BillingPricingCardComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders plan name and tagline', () => {
    const wrapper = mountComponent({ plan: proPlan });
    expect(wrapper.text()).toContain('Pro');
    expect(wrapper.text()).toContain('For pros');
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

  it('hides feature list when equivalences are provided', () => {
    const wrapper = mountComponent({
      plan: proPlan,
      equivalences: [{ label: 'operations / week', count: 2000 }],
    });
    expect(wrapper.text()).not.toContain('Unlimited projects');
    expect(wrapper.text()).not.toContain('Priority support');
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
    // Feature list must be hidden
    expect(wrapper.text()).not.toContain('Unlimited projects');
    // Legacy bullet list (with tilde prefix) must be hidden
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
});
