import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';
import { billingEn } from '../lang/en.js';

const vuetify = createVuetify();
const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

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

  it('applies text-medium-emphasis to Annual label when annual is false', () => {
    const wrapper = mountComponent({ annual: false });
    const spans = wrapper.findAll('span');
    const monthlySpan = spans.find((s) => s.text() === 'Monthly');
    const annualSpan = spans.find((s) => s.text() === 'Annual');
    expect(monthlySpan).toBeDefined();
    expect(annualSpan).toBeDefined();
    expect(monthlySpan.classes()).not.toContain('text-medium-emphasis');
    expect(annualSpan.classes()).toContain('text-medium-emphasis');
  });

  it('applies text-medium-emphasis to Monthly label when annual is true', () => {
    const wrapper = mountComponent({ annual: true });
    const spans = wrapper.findAll('span');
    const monthlySpan = spans.find((s) => s.text() === 'Monthly');
    const annualSpan = spans.find((s) => s.text() === 'Annual');
    expect(monthlySpan).toBeDefined();
    expect(annualSpan).toBeDefined();
    expect(monthlySpan.classes()).toContain('text-medium-emphasis');
    expect(annualSpan.classes()).not.toContain('text-medium-emphasis');
  });

  it('shows the annual savings hint only when monthly is active (teaser, not redundant with chip)', () => {
    // C.3: hint is a teaser when monthly — redundant when annual chip is already visible
    const wrapperMonthly = mountComponent({ annual: false });
    expect(wrapperMonthly.text()).toContain('Save 20% annually');

    const wrapperAnnual = mountComponent({ annual: true });
    expect(wrapperAnnual.text()).not.toContain('Save 20% annually');
  });

  it('shows Save 20% chip only when annual is true', () => {
    const wrapperMonthly = mountComponent({ annual: false });
    expect(wrapperMonthly.findComponent({ name: 'v-chip' }).exists()).toBe(false);

    const wrapperAnnual = mountComponent({ annual: true });
    const chip = wrapperAnnual.findComponent({ name: 'v-chip' });
    expect(chip.exists()).toBe(true);
    expect(chip.text()).toContain('Save 20%');
  });

  it('emits update:annual when switch is toggled', async () => {
    const wrapper = mountComponent({ annual: false });
    const vSwitch = wrapper.findComponent({ name: 'v-switch' });
    await vSwitch.vm.$emit('update:modelValue', true);
    expect(wrapper.emitted('update:annual')).toBeTruthy();
    expect(wrapper.emitted('update:annual')[0]).toEqual([true]);
  });
});
