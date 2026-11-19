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
    // Inactive label is dimmed with the Vuetify opacity utility
    expect(monthlySpan.classes()).toContain('opacity-50');
  });

  it('Annual label has text-white class and full opacity when annual is true', () => {
    const wrapper = mountComponent({ annual: true });
    const spans = wrapper.findAll('span');
    const annualSpan = spans.find((s) => s.text() === 'Annual');
    expect(annualSpan).toBeDefined();
    expect(annualSpan.classes()).toContain('text-white');
    expect(annualSpan.classes()).not.toContain('opacity-50');
  });

  it('Monthly label has full opacity when annual is false (active)', () => {
    const wrapper = mountComponent({ annual: false });
    const spans = wrapper.findAll('span');
    const monthlySpan = spans.find((s) => s.text() === 'Monthly');
    expect(monthlySpan.classes()).not.toContain('opacity-50');
  });

  it('Annual label has reduced opacity when annual is false (inactive)', () => {
    const wrapper = mountComponent({ annual: false });
    const spans = wrapper.findAll('span');
    const annualSpan = spans.find((s) => s.text() === 'Annual');
    expect(annualSpan.classes()).toContain('opacity-50');
  });

  it('does not render a savings caption below the toggle (savings moved to price.chip on card)', () => {
    // V4 design: savings info is shown as a chip on the card (price.chip), not as a caption below the toggle.
    const wrapper = mountComponent({ annual: false });
    expect(wrapper.text()).not.toContain('Switch to annual and save up to');
    expect(wrapper.text()).not.toContain('Annual saves you');
  });

  it('does not render savings caption when annual is active (savings are shown on card chip)', () => {
    const wrapper = mountComponent({ annual: true });
    // Caption div has been removed — savings info lives on BillingCardComponent price.chip
    expect(wrapper.text()).not.toContain('Annual saves you');
  });

  it('no separate text-body-small caption element rendered (toggle is caption-free in V4)', () => {
    const wrapper = mountComponent({ annual: false });
    // text-body-small savings div was removed in V4 — toggle is now caption-free
    const caption = wrapper.find('.text-body-small');
    expect(caption.exists()).toBe(false);
  });

  it('no inline v-chip is rendered in the toggle (savings live on card chip instead)', () => {
    const wrapper = mountComponent({ annual: true });
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

  it('wrapper inner div is dimmed (opacity-40) when disabled=true', () => {
    const wrapper = mountComponent({ annual: false, disabled: true });
    const innerDiv = wrapper.find('.d-flex.align-center.justify-center');
    expect(innerDiv.classes()).toContain('opacity-40');
  });

  it('wrapper inner div is not dimmed when disabled=false', () => {
    const wrapper = mountComponent({ annual: false, disabled: false });
    const innerDiv = wrapper.find('.d-flex.align-center.justify-center');
    expect(innerDiv.classes()).not.toContain('opacity-40');
  });

  it('v-switch is disabled=true when disabled prop is true (Vuetify blocks interaction at native level)', () => {
    const wrapper = mountComponent({ annual: false, disabled: true });
    const vSwitch = wrapper.findComponent({ name: 'v-switch' });
    // disabled guard is delegated to Vuetify v-switch; no additional JS guard needed
    expect(vSwitch.props('disabled')).toBe(true);
  });
});
