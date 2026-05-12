import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import BillingNavComputeGaugeComponent from '../components/billing.navComputeGauge.component.vue';

const vuetify = createVuetify();

/**
 * Mount BillingNavComputeGaugeComponent with Vuetify + Pinia installed.
 * @param {Object} [opts]
 * @param {boolean} [opts.rail=false] - mirror of drawer rail prop
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = ({ rail = false } = {}) =>
  mount(BillingNavComputeGaugeComponent, {
    props: { rail },
    global: { plugins: [vuetify] },
  });

describe('BillingNavComputeGaugeComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ── Visibility gate ──────────────────────────────────────────────────────

  it('hides when user is not logged in', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    // cookieExpire = 0 → isLoggedIn = false
    authStore.cookieExpire = 0;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 5, meterQuota: 10, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.find('.billing-nav-gauge').exists()).toBe(false);
  });

  it('hides when meterMode is false', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: false } };
    billingStore.usageMeter = { meterUsed: 5, meterQuota: 10, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.find('.billing-nav-gauge').exists()).toBe(false);
  });

  it('hides when meterMode is true but usageMeter is null', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = null;

    const wrapper = mountComponent();
    expect(wrapper.find('.billing-nav-gauge').exists()).toBe(false);
  });

  // ── Button shape + gauge bar ─────────────────────────────────────────────

  it('renders as a v-list-item (button-shape) when meterMode is active', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VListItem' }).exists()).toBe(true);
  });

  it('renders a progress bar (not a FA icon) as the prepend slot content', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VProgressLinear' }).exists()).toBe(true);
    // No raw FA icon — gauge bar replaces the icon slot
    expect(wrapper.html()).not.toContain('fa-solid');
  });

  it('navigates to /users?tab=subscriptions on click (locked interaction)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, weekResetAt: null };

    const wrapper = mountComponent();
    const listItem = wrapper.findComponent({ name: 'VListItem' });
    expect(listItem.props('to')).toBe('/users?tab=subscriptions');
  });

  // ── Expanded state ───────────────────────────────────────────────────────

  it('shows % and reset label when not in rail mode (expanded)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, weekResetAt: '2026-05-19T00:00:00.000Z' };

    const wrapper = mountComponent({ rail: false });
    expect(wrapper.text()).toContain('50%');
    // Reset label must contain "resets"
    expect(wrapper.text()).toContain('resets');
  });

  it('does NOT show raw compute units inline (% only — no "X / Y" pattern)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, weekResetAt: null };

    const wrapper = mountComponent({ rail: false });
    // Must show 50% but NOT "800 / 1600"
    expect(wrapper.text()).toContain('50%');
    expect(wrapper.text()).not.toContain('800');
    expect(wrapper.text()).not.toContain('1600');
  });

  // ── Collapsed (rail) state ───────────────────────────────────────────────

  it('hides text content in rail mode (gauge bar only)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, weekResetAt: '2026-05-19T00:00:00.000Z' };

    const wrapper = mountComponent({ rail: true });
    // Text slots are not rendered in rail mode
    expect(wrapper.findComponent({ name: 'VListItemTitle' }).exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'VListItemSubtitle' }).exists()).toBe(false);
    // But the gauge bar must still exist
    expect(wrapper.findComponent({ name: 'VProgressLinear' }).exists()).toBe(true);
  });

  // ── Percentage calculation ───────────────────────────────────────────────

  it('computes 50% for meterUsed=800, meterQuota=1600', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pct).toBe(50);
  });

  it('clamps pct to 100 when meterUsed exceeds meterQuota', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 200, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pct).toBe(100);
  });

  it('returns pct=0 when meterQuota is 0 (division-by-zero guard)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 0, meterQuota: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pct).toBe(0);
  });

  // ── Color thresholds ─────────────────────────────────────────────────────

  it('uses success color when usage is below 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 50, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.thresholdColor).toBe('success');
  });

  it('uses warning color when usage is at 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 80, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.thresholdColor).toBe('warning');
  });

  it('uses error color when usage is at or above 100%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 100, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.thresholdColor).toBe('error');
  });

  // ── Reset date formatting ────────────────────────────────────────────────

  it('returns null resetLabel when weekResetAt is null', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 10, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.resetLabel).toBeNull();
  });

  it('returns a non-null resetLabel starting with "resets" when weekResetAt is set', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 10, meterQuota: 100, weekResetAt: '2026-05-19T00:00:00.000Z' };

    const wrapper = mountComponent();
    expect(wrapper.vm.resetLabel).not.toBeNull();
    expect(wrapper.vm.resetLabel).toMatch(/^resets /);
    expect(wrapper.vm.resetLabel.length).toBeGreaterThan('resets '.length);
  });
});
