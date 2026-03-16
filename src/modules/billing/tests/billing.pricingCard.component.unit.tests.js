import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import BillingPricingCardComponent from '../components/billing.pricingCard.component.vue';

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
      plugins: [vuetify],
      mocks: { config: mockConfig },
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

  it('displays monthly price when annual is false', () => {
    const wrapper = mountComponent({ plan: proPlan, annual: false });
    expect(wrapper.text()).toContain('$29');
    expect(wrapper.text()).toContain('/ month');
  });

  it('displays annual price when annual is true', () => {
    const wrapper = mountComponent({ plan: proPlan, annual: true });
    expect(wrapper.text()).toContain('$290');
    expect(wrapper.text()).toContain('/ year');
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
});
