import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import BillingPlanBadgeComponent from '../components/billing.planBadge.component.vue';

const vuetify = createVuetify();

/**
 * Mount the plan badge component with Vuetify installed.
 * @param {Object} props Component props.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountComponent = (props) =>
  mount(BillingPlanBadgeComponent, {
    props,
    global: { plugins: [vuetify] },
  });

describe('BillingPlanBadgeComponent', () => {
  it('renders free plan with grey color', () => {
    const wrapper = mountComponent({ plan: 'free' });
    expect(wrapper.text()).toContain('free');
    expect(wrapper.vm.color).toBe('grey');
  });

  it('renders starter plan with primary color', () => {
    const wrapper = mountComponent({ plan: 'starter' });
    expect(wrapper.text()).toContain('starter');
    expect(wrapper.vm.color).toBe('primary');
  });

  it('renders pro plan with secondary color', () => {
    const wrapper = mountComponent({ plan: 'pro' });
    expect(wrapper.text()).toContain('pro');
    expect(wrapper.vm.color).toBe('secondary');
  });

  it('renders enterprise plan with warning color', () => {
    const wrapper = mountComponent({ plan: 'enterprise' });
    expect(wrapper.text()).toContain('enterprise');
    expect(wrapper.vm.color).toBe('warning');
  });

  it('falls back to grey for unknown plan', () => {
    // Validator will warn, but computed still returns grey fallback
    const wrapper = mountComponent({ plan: 'unknown' });
    expect(wrapper.vm.color).toBe('grey');
  });
});
