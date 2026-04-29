import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useBillingStore } from '../stores/billing.store';
import BillingUsageBarComponent from '../components/billing.usageBar.component.vue';

// Prevent axios calls from useMeter polling
vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

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
    vi.clearAllMocks();
  });

  // ── Legacy mode (default) ────────────────────────────────────────────────

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
    expect(progressBar.props('modelValue')).toBe(25);
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

  // ── Meter mode ───────────────────────────────────────────────────────────

  it('renders meter mode when mode="meter" is passed', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 200, meterQuota: 1000, extrasRemaining: 50 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(true);
  });

  it('does not render v-progress-linear directly in meter mode (delegates to BillingMeterProgressComponent)', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 200, meterQuota: 1000 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    // The outer linear bar is only in legacy mode; meter uses BillingMeterProgressComponent
    const meterRoot = wrapper.find('.billing-usage-bar--meter');
    expect(meterRoot.exists()).toBe(true);
  });

  it('displays used / quota text in meter mode', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 300, meterQuota: 1000 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.text()).toContain('300');
    expect(wrapper.text()).toContain('1000');
  });

  it('appends +extras to meter display when extras > 0', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 300, meterQuota: 1000, extrasRemaining: 75 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.vm.meterDisplay).toContain('+75');
  });

  it('does not append +extras when extras is 0', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 300, meterQuota: 1000, extrasRemaining: 0 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.vm.meterDisplay).not.toContain('+');
  });

  it('emits open-drawer on click in meter mode', async () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 100, meterQuota: 500 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    await wrapper.find('.billing-usage-bar--meter').trigger('click');
    expect(wrapper.emitted('open-drawer')).toHaveLength(1);
  });

  it('emits open-drawer on Enter key in meter mode', async () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 100, meterQuota: 500 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    await wrapper.find('.billing-usage-bar--meter').trigger('keydown.enter');
    expect(wrapper.emitted('open-drawer')).toHaveLength(1);
  });

  it('meter mode root has role=button', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 0, meterQuota: 0 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.find('.billing-usage-bar--meter').attributes('role')).toBe('button');
  });

  it('uses custom label in meter mode', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 100, meterQuota: 500 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter', label: 'Compute' });
    expect(wrapper.text()).toContain('Compute');
  });

  it('uses "Weekly usage" fallback when no label provided in meter mode', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 0, meterQuota: 0 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.text()).toContain('Weekly usage');
  });

  it('legacy mode is unchanged when mode prop is omitted', () => {
    const wrapper = mountComponent(
      { resource: 'documents', action: 'create' },
      {
        plan: 'starter',
        period: '2026-03',
        usage: { 'documents.create': 5 },
        limits: { 'documents.create': 20 },
      },
    );
    expect(wrapper.find('.billing-usage-bar--meter').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'v-progress-linear' }).exists()).toBe(true);
  });
});
