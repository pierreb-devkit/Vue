import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';
import { billingEn } from '../lang/en.js';

const vuetify = createVuetify();
const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      ...billingEn,
      billing: {
        ...billingEn.billing,
        pricingToggle: {
          ...billingEn.billing.pricingToggle,
          savingsActive: 'Annual saves you {pct}%',
        },
      },
    },
  },
});

/**
 * Mount the toggle component with Vuetify installed.
 * @param {Object} props Component props.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountComponent = (props = {}) =>
  mount(BillingPricingToggleComponent, {
    props: { annual: false, ...props },
    global: {
      plugins: [vuetify, i18n],
    },
  });

describe('BillingPricingToggleComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders Monthly and Annual labels', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Monthly');
    expect(wrapper.text()).toContain('Annual');
  });

  it('Monthly label has text-white class and reduced opacity when annual is true', () => {
    const wrapper = mountComponent({ annual: true });
    const spans = wrapper.findAll('span');
    const monthlySpan = spans.find((s) => s.text() === 'Monthly');
    expect(monthlySpan).toBeDefined();
    expect(monthlySpan.classes()).toContain('text-white');
    // Inactive label should be dimmed via inline style
    expect(monthlySpan.attributes('style')).toContain('opacity: 0.5');
  });

  it('Annual label has text-white class and full opacity when annual is true', () => {
    const wrapper = mountComponent({ annual: true });
    const spans = wrapper.findAll('span');
    const annualSpan = spans.find((s) => s.text() === 'Annual');
    expect(annualSpan).toBeDefined();
    expect(annualSpan.classes()).toContain('text-white');
    expect(annualSpan.attributes('style')).toContain('opacity: 1');
  });

  it('Monthly label has full opacity when annual is false (active)', () => {
    const wrapper = mountComponent({ annual: false });
    const spans = wrapper.findAll('span');
    const monthlySpan = spans.find((s) => s.text() === 'Monthly');
    expect(monthlySpan.attributes('style')).toContain('opacity: 1');
  });

  it('Annual label has reduced opacity when annual is false (inactive)', () => {
    const wrapper = mountComponent({ annual: false });
    const spans = wrapper.findAll('span');
    const annualSpan = spans.find((s) => s.text() === 'Annual');
    expect(annualSpan.attributes('style')).toContain('opacity: 0.5');
  });

  it('shows savings teaser copy below toggle when monthly is active (maxAnnualSavingsPct > 0)', () => {
    const wrapper = mountComponent({ annual: false, maxAnnualSavingsPct: 20 });
    expect(wrapper.text()).toContain('Switch to annual and save up to 20%');
  });

  it('shows savingsActive copy below toggle when annual is active (maxAnnualSavingsPct > 0)', () => {
    const wrapper = mountComponent({ annual: true, maxAnnualSavingsPct: 20 });
    expect(wrapper.text()).toContain('Annual saves you 20%');
  });

  it('savings caption below is always white when savings are present', () => {
    const wrapper = mountComponent({ annual: false, maxAnnualSavingsPct: 20 });
    const caption = wrapper.find('.text-white.text-body-small, .text-body-small.text-white');
    expect(caption.exists()).toBe(true);
  });

  it('no savings caption rendered when maxAnnualSavingsPct is 0', () => {
    const wrapper = mountComponent({ annual: false, maxAnnualSavingsPct: 0 });
    // Should not contain any savings text
    expect(wrapper.text()).not.toContain('save up to');
    expect(wrapper.text()).not.toContain('saves you');
  });

  it('no inline chip is rendered (chip removed in favor of caption below)', () => {
    const wrapper = mountComponent({ annual: true, maxAnnualSavingsPct: 25 });
    expect(wrapper.findComponent({ name: 'v-chip' }).exists()).toBe(false);
  });

  it('emits update:annual when switch is toggled', async () => {
    const wrapper = mountComponent({ annual: false });
    const vSwitch = wrapper.findComponent({ name: 'v-switch' });
    await vSwitch.vm.$emit('update:modelValue', true);
    expect(wrapper.emitted('update:annual')).toBeTruthy();
    expect(wrapper.emitted('update:annual')[0]).toEqual([true]);
  });
});
