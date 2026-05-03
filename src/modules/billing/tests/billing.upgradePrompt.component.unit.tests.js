import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import { useBillingStore } from '../stores/billing.store';
import BillingUpgradePrompt from '../components/billing.upgradePrompt.component.vue';
import { billingEn } from '../lang/en.js';

const i18n = createI18n({ legacy: false, globalInjection: true, locale: 'en', fallbackLocale: 'en', messages: { en: { ...billingEn } } });

const vuetify = createVuetify();

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
      plugins: [vuetify, i18n],
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

  it('emits buy-pack instead of linking to pricing in meter mode', async () => {
    const wrapper = mountComponent({ requiredPlan: 'pro', mode: 'meter' });
    const btn = wrapper.findComponent({ name: 'v-btn' });
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('Buy units');
    expect(btn.props('to')).toBeUndefined();

    await btn.trigger('click');
    expect(wrapper.emitted('buy-pack')).toHaveLength(1);
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
});
