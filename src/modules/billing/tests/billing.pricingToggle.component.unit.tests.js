import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import BillingPricingToggleComponent from '../components/billing.pricingToggle.component.vue';

const vuetify = createVuetify();

/**
 * Mount the toggle component with Vuetify installed.
 * @param {Object} props Component props.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountComponent = (props = {}) =>
  mount(BillingPricingToggleComponent, {
    props: { annual: false, ...props },
    global: {
      plugins: [vuetify],
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

  it('does not render a savings caption below the toggle (savings moved to price.chip on card)', () => {
    // V4 design: savings info is shown as a chip on the card (price.chip), not as a caption below the toggle.
    const wrapper = mountComponent({ annual: false, maxAnnualSavingsPct: 20 });
    expect(wrapper.text()).not.toContain('Switch to annual and save up to 20%');
    expect(wrapper.text()).not.toContain('Annual saves you');
  });

  it('does not render savings caption when annual is active (savings are shown on card chip)', () => {
    const wrapper = mountComponent({ annual: true, maxAnnualSavingsPct: 20 });
    // Caption div has been removed — savings info lives on BillingCardComponent price.chip
    expect(wrapper.text()).not.toContain('Annual saves you');
  });

  it('no separate savings caption element rendered regardless of maxAnnualSavingsPct', () => {
    const wrapper = mountComponent({ annual: false, maxAnnualSavingsPct: 20 });
    // text-body-small savings div was removed in V4 — toggle is now caption-free
    const caption = wrapper.find('.text-body-small');
    expect(caption.exists()).toBe(false);
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

  // ── disabled prop ─────────────────────────────────────────────────────────

  it('v-switch has disabled prop when disabled=true', () => {
    const wrapper = mountComponent({ annual: false, disabled: true });
    const vSwitch = wrapper.findComponent({ name: 'v-switch' });
    expect(vSwitch.props('disabled')).toBe(true);
  });

  it('wrapper inner div has reduced opacity (0.4) when disabled=true', () => {
    const wrapper = mountComponent({ annual: false, disabled: true });
    const innerDiv = wrapper.find('.d-flex.align-center.justify-center');
    expect(innerDiv.attributes('style')).toContain('opacity: 0.4');
  });

  it('wrapper inner div has full opacity (1) when disabled=false', () => {
    const wrapper = mountComponent({ annual: false, disabled: false });
    const innerDiv = wrapper.find('.d-flex.align-center.justify-center');
    expect(innerDiv.attributes('style')).toContain('opacity: 1');
  });

  it('v-switch is disabled=true when disabled prop is true (Vuetify blocks interaction at native level)', () => {
    const wrapper = mountComponent({ annual: false, disabled: true });
    const vSwitch = wrapper.findComponent({ name: 'v-switch' });
    // disabled guard is delegated to Vuetify v-switch; no additional JS guard needed
    expect(vSwitch.props('disabled')).toBe(true);
  });
});
