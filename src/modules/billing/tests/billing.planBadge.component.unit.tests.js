import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';

// config is the generated runtime config; mock it per-test (same pattern as
// billing.resolveStaticContent.unit.tests.js).
vi.mock('../../../lib/services/config.js', () => ({ default: {} }));
import configMock from '../../../lib/services/config.js';
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
  // These 5 tests run against an empty mocked config (no override) — they prove the
  // unset-config default is byte-identical to the pre-hook behavior.
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

describe('BillingPlanBadgeComponent — config-driven plan set', () => {
  beforeEach(() => {
    for (const k of Object.keys(configMock)) delete configMock[k];
  });

  it('renders an overridden plan set and validates against it (devkit ids excluded)', () => {
    configMock.billing = {
      planBadge: {
        plans: [
          { id: 'team', color: 'info' },
          { id: 'scale', color: 'error' },
        ],
      },
    };

    const wrapper = mountComponent({ plan: 'team' });
    expect(wrapper.text()).toContain('team');
    expect(wrapper.vm.color).toBe('info');

    const validator = BillingPlanBadgeComponent.props.plan.validator;
    expect(validator('team')).toBe(true);
    expect(validator('scale')).toBe(true);
    expect(validator('free')).toBe(false);
    expect(validator('nope')).toBe(false);
  });

  it('uses fallbackColor for a plan id outside the overridden set, else grey', () => {
    configMock.billing = {
      planBadge: {
        plans: [{ id: 'team', color: 'info' }],
        fallbackColor: 'surface',
      },
    };
    let wrapper = mountComponent({ plan: 'ghost' });
    expect(wrapper.vm.color).toBe('surface');

    configMock.billing = {
      planBadge: {
        plans: [{ id: 'team', color: 'info' }],
      },
    };
    wrapper = mountComponent({ plan: 'ghost' });
    expect(wrapper.vm.color).toBe('grey');
  });

  it('pins the devkit default set + colors when config is unset', () => {
    const validator = BillingPlanBadgeComponent.props.plan.validator;
    expect(validator('enterprise')).toBe(true);

    const wrapper = mountComponent({ plan: 'free' });
    expect(wrapper.vm.color).toBe('grey');
  });
});
