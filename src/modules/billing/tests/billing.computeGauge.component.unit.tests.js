import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import BillingComputeGaugeComponent from '../components/billing.computeGauge.component.vue';

const vuetify = createVuetify();

/**
 * Mount BillingComputeGaugeComponent with Vuetify + Pinia installed.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = () =>
  mount(BillingComputeGaugeComponent, {
    global: { plugins: [vuetify] },
  });

describe('BillingComputeGaugeComponent', () => {
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
    expect(wrapper.find('.compute-gauge').exists()).toBe(false);
  });

  it('hides when meterMode is false', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: false } };
    billingStore.usageMeter = { meterUsed: 5, meterQuota: 10, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.find('.compute-gauge').exists()).toBe(false);
  });

  it('hides when meterMode is true but usageMeter is null', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = null;

    const wrapper = mountComponent();
    expect(wrapper.find('.compute-gauge').exists()).toBe(false);
  });

  it('renders gauge and usage numbers when meterMode is true', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.find('.compute-gauge').exists()).toBe(true);
    expect(wrapper.text()).toContain('400');
    expect(wrapper.text()).toContain('1600');
  });

  // ── Color thresholds ─────────────────────────────────────────────────────

  it('uses primary color when usage is below 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 50, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.barColor).toBe('primary');
  });

  it('uses warning color when usage is at 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 80, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.barColor).toBe('warning');
  });

  it('uses error color when usage is at or above 100%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 100, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.barColor).toBe('error');
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('guards against division by zero when meterQuota is 0', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 0, meterQuota: 0, weekResetAt: null };

    const wrapper = mountComponent();
    // show requires usageMeter to be truthy (non-null object) — it is
    expect(wrapper.find('.compute-gauge').exists()).toBe(true);
    expect(wrapper.vm.progressPercent).toBe(0);
    expect(wrapper.vm.barColor).toBe('primary');
  });

  it('shows em-dash as reset date when weekResetAt is null', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 10, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.resetDate).toBe('—');
  });

  it('formats reset date from weekResetAt ISO string', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 10, meterQuota: 100, weekResetAt: '2026-05-18T00:00:00.000Z' };

    const wrapper = mountComponent();
    // Just assert it's a non-empty non-dash string — locale-dependent formatting
    expect(wrapper.vm.resetDate).not.toBe('—');
    expect(wrapper.vm.resetDate.length).toBeGreaterThan(0);
  });

  it('clamps remaining to 0 when meterUsed exceeds meterQuota', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 150, meterQuota: 100, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.remaining).toBe(0);
    expect(wrapper.vm.progressPercent).toBe(100);
    expect(wrapper.vm.barColor).toBe('error');
  });
});
