import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useBillingStore } from '../stores/billing.store';
import BillingUsageBarComponent from '../components/billing.usageBar.component.vue';

const vuetify = createVuetify();

/**
 * Mount the usage bar component with Vuetify and Pinia installed.
 * @param {Object} props Component props.
 * @param {Object} [quotaData] Quota data to set on the store.
 * @returns {import('@vue/test-utils').VueWrapper} Mounted wrapper
 */
const mountComponent = (props, quotaData = null) => {
  if (quotaData) {
    const store = useBillingStore();
    store.quota = quotaData;
  }
  return mount(BillingUsageBarComponent, {
    props,
    global: {
      plugins: [vuetify],
    },
  });
};

describe('BillingUsageBarComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders progress bar with correct percentage', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.vm.percent).toBe(25);
    const progressBar = wrapper.findComponent({ name: 'v-progress-linear' });
    expect(progressBar.exists()).toBe(true);
  });

  it('shows green color when usage is below 70%', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.vm.barColor).toBe('success');
  });

  it('shows orange color when usage is between 70% and 90%', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 15 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.vm.barColor).toBe('warning');
  });

  it('shows red color when usage is at or above 90%', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 18 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.vm.barColor).toBe('error');
  });

  it('shows "Unlimited" when no limit is defined', () => {
    const wrapper = mountComponent(
      { resource: 'requests', action: 'execute' },
      {
        plan: 'pro',
        period: '2026-03',
        usage: { 'requests.execute': 500 },
        limits: {},
      },
    );
    expect(wrapper.text()).toContain('Unlimited');
    const progressBar = wrapper.findComponent({ name: 'v-progress-linear' });
    expect(progressBar.exists()).toBe(false);
  });

  it('shows "Unlimited" when limit is Infinity', () => {
    const wrapper = mountComponent(
      { resource: 'requests', action: 'execute' },
      {
        plan: 'pro',
        period: '2026-03',
        usage: { 'requests.execute': 500 },
        limits: { 'requests.execute': Infinity },
      },
    );
    expect(wrapper.text()).toContain('Unlimited');
  });

  it('displays correct label and count format', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.text()).toContain('documents create');
    expect(wrapper.text()).toContain('5/20');
  });

  it('uses custom label when provided', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create', label: 'Documents' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.text()).toContain('Documents');
  });
});
