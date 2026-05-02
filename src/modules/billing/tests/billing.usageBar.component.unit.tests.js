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

// Mutable auth store state shared across tests
const authState = vi.hoisted(() => ({
  isLoggedIn: true,
  user: null,
  serverConfig: null,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authState,
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
    authState.user = null;
    authState.serverConfig = null;
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

  it('displays used / quota text in meter mode (standard)', () => {
    const store = useBillingStore();
    store.subscription = { status: 'active', plan: 'starter' };
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

  it('does not emit open-drawer on click in meter mode (informational only)', async () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 100, meterQuota: 500 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    await wrapper.find('.billing-usage-bar--meter').trigger('click');
    expect(wrapper.emitted('open-drawer')).toBeUndefined();
  });

  it('meter mode root has no role=button (informational only)', () => {
    const store = useBillingStore();
    store.usageMeter = { meterUsed: 0, meterQuota: 0 };
    const wrapper = mountComponent({ resource: '', action: '', mode: 'meter' });
    expect(wrapper.find('.billing-usage-bar--meter').attributes('role')).toBeUndefined();
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

  // ── Meter mode: displayMode variants ────────────────────────────────────

  it('displayMode is "admin" when user has admin role', () => {
    authState.user = { roles: ['admin'] };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.vm.displayMode).toBe('admin');
  });

  it('displays "∞ Admin" label in admin displayMode', () => {
    authState.user = { roles: ['admin'] };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.text()).toContain('∞ Admin');
  });

  it('admin display has billing-usage-bar--admin class', () => {
    authState.user = { roles: ['admin'] };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.find('.billing-usage-bar--admin').exists()).toBe(true);
  });

  it('displayMode is "free" when no subscription and no usageMeter', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = null;
    store.usageMeter = null;
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.vm.displayMode).toBe('free');
  });

  it('free display shows "0 / <freeTierQuota> compute"', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = null;
    store.usageMeter = null;
    const wrapper = mountComponent({ mode: 'meter', freeTierQuota: 10 });
    expect(wrapper.text()).toContain('0 / 10 compute');
  });

  it('free display renders progress bar at 0%', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = null;
    store.usageMeter = null;
    const wrapper = mountComponent({ mode: 'meter' });
    const bar = wrapper.findComponent({ name: 'v-progress-linear' });
    expect(bar.exists()).toBe(true);
    expect(bar.props('modelValue')).toBe(0);
  });

  it('displayMode is "standard" when subscription and usageMeter exist', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = { status: 'active', plan: 'starter' };
    store.usageMeter = { meterUsed: 200, meterQuota: 1000, extrasRemaining: 0 };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.vm.displayMode).toBe('standard');
  });

  it('standard display shows used / quota via meterDisplay', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = { status: 'active', plan: 'starter' };
    store.usageMeter = { meterUsed: 200, meterQuota: 1000, extrasRemaining: 0 };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.text()).toContain('200');
    expect(wrapper.text()).toContain('1000');
  });

  // ── Meter mode: overage display ──────────────────────────────────────────

  it('no overage badge when used is within quota (overage = 0)', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = { status: 'active', plan: 'starter' };
    store.usageMeter = { meterUsed: 800, meterQuota: 1000, extrasRemaining: 0 };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.vm.meterOverage).toBe(0);
    // Child receives overage=0 — no overage chip should render
    const meterProgress = wrapper.findComponent({ name: 'BillingMeterProgressComponent' });
    expect(meterProgress.props('overage')).toBe(0);
    expect(wrapper.findComponent({ name: 'v-chip' }).exists()).toBe(false);
    expect(wrapper.text()).not.toContain('over');
  });

  it('shows overage badge and error color when used exceeds quota (overage > 0)', () => {
    authState.user = { roles: ['user'] };
    const store = useBillingStore();
    store.subscription = { status: 'active', plan: 'starter' };
    store.usageMeter = { meterUsed: 1100, meterQuota: 1000, extrasRemaining: 0 };
    const wrapper = mountComponent({ mode: 'meter' });
    expect(wrapper.vm.meterOverage).toBe(100);
    expect(wrapper.vm.meterNetRemainingRaw).toBe(-100);
    // meterDisplay shows negative remaining in header
    expect(wrapper.text()).toContain('-100');
    // meterProgress child renders the overage badge
    const meterProgress = wrapper.findComponent({ name: 'BillingMeterProgressComponent' });
    expect(meterProgress.exists()).toBe(true);
    expect(meterProgress.props('overage')).toBe(100);
    expect(meterProgress.props('netRemainingRaw')).toBe(-100);
  });
});
