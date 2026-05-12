import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import BillingNavComputeGaugeComponent from '../components/billing.navComputeGauge.component.vue';

const vuetify = createVuetify();

/**
 * Mount BillingNavComputeGaugeComponent with Vuetify + Pinia installed.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = () =>
  mount(BillingNavComputeGaugeComponent, {
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });

describe('BillingNavComputeGaugeComponent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Visibility gate ──────────────────────────────────────────────────────

  it('hides when user is not logged in', () => {
    const authStore = useAuthStore();
    // cookieExpire = 0 → isLoggedIn = false
    authStore.cookieExpire = 0;
    authStore.serverConfig = { billing: { meterMode: true } };

    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VTooltip' }).exists()).toBe(false);
  });

  it('hides when meterMode is false', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: false } };

    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VTooltip' }).exists()).toBe(false);
  });

  it('shows when logged in and meterMode is true', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VTooltip' }).exists()).toBe(true);
  });

  // ── v-progress-circular in #prepend slot ─────────────────────────────────

  it('renders v-progress-circular in the prepend slot', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(true);
    // No v-progress-linear (the old component used that)
    expect(wrapper.findComponent({ name: 'VProgressLinear' }).exists()).toBe(false);
  });

  it('shows "X% used" in v-list-item-title when usageMeter is available', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = meterQuota + extrasRemaining + meterUsed = 800 + 0 + 800 = 1600
    // pctUsed = 800 / 1600 = 50%
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 800, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('50% used');
  });

  it('shows "—" in v-list-item-title when usageMeter is null', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('—');
  });

  // ── pctUsed formula: includes extrasRemaining ────────────────────────────

  it('computes pctUsed = meterUsed / (meterQuota + extrasRemaining + meterUsed)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 1600 + 400 + 800 = 2800 → pct = 800/2800 = 28.57 → round = 29
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 400, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(29);
  });

  it('returns pctUsed=0 when totalQuota=0 (division-by-zero guard)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 0, meterQuota: 0, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(0);
  });

  it('verifies pctUsed formula: meterUsed=200, meterQuota=50, extras=0 → 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 50 + 0 + 200 = 250, pct = 200/250 = 80%
    billingStore.usageMeter = { meterUsed: 200, meterQuota: 50, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(80);
  });

  it('returns pctUsed=50 for meterUsed=800, meterQuota=800, extrasRemaining=0', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 800 + 0 + 800 = 1600, pct = 800/1600 = 50%
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 800, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(50);
  });

  // ── iconColor thresholds ─────────────────────────────────────────────────

  it('iconColor = "success" when pctUsed <= 50', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 50, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    // pctUsed = 50/150 = 33% → success
    expect(wrapper.vm.iconColor).toBe('success');
  });

  it('iconColor = "warning" when pctUsed is between 51% and 75%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // Need pctUsed in (50, 75] — use extrasRemaining=0, meterUsed=65, meterQuota=35
    // totalQuota = 35 + 0 + 65 = 100, pct = 65% → warning
    billingStore.usageMeter = { meterUsed: 65, meterQuota: 35, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.iconColor).toBe('warning');
  });

  it('iconColor = "error" when pctUsed > 75', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // meterUsed=90, meterQuota=10, extras=0 → totalQuota=100, pct=90% → error
    billingStore.usageMeter = { meterUsed: 90, meterQuota: 10, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.iconColor).toBe('error');
  });

  // ── resetLabel with nextMondayIso fallback ───────────────────────────────

  it('resetLabel uses weekResetAt when provided', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = {
      meterUsed: 10, meterQuota: 100, extrasRemaining: 0,
      weekResetAt: '2026-05-19T00:00:00.000Z',
    };

    const wrapper = mountComponent();
    expect(wrapper.vm.resetLabel).not.toBeNull();
    expect(wrapper.vm.resetLabel).toMatch(/^resets /);
    expect(wrapper.vm.resetLabel.length).toBeGreaterThan('resets '.length);
  });

  it('resetLabel falls back to nextMondayIso() when weekResetAt is null', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 10, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    // Must NOT be null — nextMondayIso provides a fallback
    expect(wrapper.vm.resetLabel).not.toBeNull();
    expect(wrapper.vm.resetLabel).toMatch(/^resets /);
  });

  it('resetLabel falls back to nextMondayIso() when usageMeter is null', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const wrapper = mountComponent();
    // usageMeter is null → weekResetAt falls back to nextMondayIso()
    expect(wrapper.vm.resetLabel).not.toBeNull();
    expect(wrapper.vm.resetLabel).toMatch(/^resets /);
  });

  // ── nextMondayIso helper ─────────────────────────────────────────────────

  it('nextMondayIso() returns a valid ISO string at 00:00 UTC', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const wrapper = mountComponent();
    const iso = wrapper.vm.nextMondayIso();

    expect(typeof iso).toBe('string');
    const d = new Date(iso);
    expect(Number.isNaN(d.getTime())).toBe(false);
    // Must be a Monday (UTCDay === 1)
    expect(d.getUTCDay()).toBe(1);
    // Must be at midnight UTC
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    // Must be in the future
    expect(d.getTime()).toBeGreaterThan(Date.now());
  });

  // ── Auto-fetch on mount + window.focus listener ──────────────────────────

  it('calls billingStore.fetchUsageMeter on mount', async () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const billingStore = useBillingStore();
    billingStore.fetchUsageMeter = vi.fn().mockResolvedValue(undefined);

    mountComponent();
    expect(billingStore.fetchUsageMeter).toHaveBeenCalledTimes(1);
  });

  it('installs a window.focus listener on mount that calls fetchUsageMeter', async () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const billingStore = useBillingStore();
    billingStore.fetchUsageMeter = vi.fn().mockResolvedValue(undefined);

    mountComponent();
    // Simulate window focus
    window.dispatchEvent(new Event('focus'));
    expect(billingStore.fetchUsageMeter).toHaveBeenCalledTimes(2);
  });

  it('removes window.focus listener on unmount', async () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const billingStore = useBillingStore();
    billingStore.fetchUsageMeter = vi.fn().mockResolvedValue(undefined);

    const wrapper = mountComponent();
    wrapper.unmount();

    // Focus after unmount should NOT call fetchUsageMeter again
    const callsBefore = billingStore.fetchUsageMeter.mock.calls.length;
    window.dispatchEvent(new Event('focus'));
    expect(billingStore.fetchUsageMeter.mock.calls.length).toBe(callsBefore);
  });

  // ── Tooltip content: usedDisplay / totalDisplay ──────────────────────────

  it('usedDisplay formats meterUsed as a localized number string', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 1234, meterQuota: 5000, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    expect(wrapper.vm.usedDisplay).toBe((1234).toLocaleString());
  });

  it('totalDisplay formats totalQuota as a localized number string', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 1000, meterQuota: 4000, extrasRemaining: 500, weekResetAt: null };
    // totalQuota = 4000 + 500 + 1000 = 5500

    const wrapper = mountComponent();
    expect(wrapper.vm.totalDisplay).toBe((5500).toLocaleString());
  });

  // ── click navigation ─────────────────────────────────────────────────────

  it('v-list-item links to /users?tab=subscriptions', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    const wrapper = mountComponent();
    const listItem = wrapper.findComponent({ name: 'VListItem' });
    expect(listItem.props('to')).toEqual({ path: '/users', query: { tab: 'subscriptions' } });
  });
});
