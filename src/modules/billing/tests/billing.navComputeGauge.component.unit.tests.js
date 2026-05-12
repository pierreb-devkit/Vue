import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import BillingNavComputeGaugeComponent from '../components/billing.navComputeGauge.component.vue';

// Prevent real HTTP calls — billing store uses axios from this service
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { data: null } }),
    post: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
}));

const vuetify = createVuetify();

/**
 * Mount BillingNavComputeGaugeComponent with Vuetify + Pinia installed.
 * Returns the wrapper; always call wrapper.unmount() or use the afterEach cleanup.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = () =>
  mount(BillingNavComputeGaugeComponent, {
    global: { plugins: [vuetify] },
    attachTo: document.body,
  });

describe('BillingNavComputeGaugeComponent', () => {
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    wrapper = null;
  });

  afterEach(() => {
    // Unmount to remove window.focus listener and avoid cross-test leaks
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
    vi.restoreAllMocks();
  });

  // ── Visibility gate ──────────────────────────────────────────────────────

  it('hides when user is not logged in', () => {
    const authStore = useAuthStore();
    // cookieExpire = 0 → isLoggedIn = false
    authStore.cookieExpire = 0;
    authStore.serverConfig = { billing: { meterMode: true } };

    wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VTooltip' }).exists()).toBe(false);
  });

  it('hides when meterMode is false', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: false } };

    wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VTooltip' }).exists()).toBe(false);
  });

  it('shows when logged in and meterMode is true', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VTooltip' }).exists()).toBe(true);
  });

  // ── v-progress-circular in #prepend slot ─────────────────────────────────

  it('renders v-progress-circular in the prepend slot', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(true);
    // No v-progress-linear (the old component used that)
    expect(wrapper.findComponent({ name: 'VProgressLinear' }).exists()).toBe(false);
  });

  it('shows "X% used" in v-list-item-title when usageMeter is available', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = meterQuota + extrasRemaining = 1600 + 0 = 1600
    // pctUsed = meterUsed / totalQuota = 800 / 1600 = 50%
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.text()).toContain('50% used');
  });

  it('shows "—" in v-list-item-title when usageMeter is null', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    wrapper = mountComponent();
    expect(wrapper.text()).toContain('—');
  });

  // ── pctUsed formula: meterUsed / (meterQuota + extrasRemaining) ──────────

  it('computes pctUsed = meterUsed / (meterQuota + extrasRemaining)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 1600 + 400 = 2000, pct = 800 / 2000 = 40%
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 400, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(40);
  });

  it('returns pctUsed=0 when totalQuota=0 (division-by-zero guard)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 0, meterQuota: 0, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(0);
  });

  it('clamps pctUsed to 100 when meterUsed exceeds totalQuota', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 50 + 0 = 50, meterUsed = 200 → pct = 200/50 = 400% → clamp to 100
    billingStore.usageMeter = { meterUsed: 200, meterQuota: 50, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(100);
  });

  it('returns pctUsed=50 for meterUsed=800, meterQuota=1600, extrasRemaining=0', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 1600 + 0 = 1600, pct = 800/1600 = 50%
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(50);
  });

  // ── iconColor thresholds (matches billing.computeGauge: 80% / 100%) ──────

  it('iconColor = "success" when pctUsed < 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 100, meterUsed = 50 → pct = 50% → success
    billingStore.usageMeter = { meterUsed: 50, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.iconColor).toBe('success');
  });

  it('iconColor = "warning" when pctUsed is 80%', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 100, meterUsed = 80 → pct = 80% → warning
    billingStore.usageMeter = { meterUsed: 80, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.iconColor).toBe('warning');
  });

  it('iconColor = "error" when pctUsed is 100% (at cap)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // totalQuota = 100, meterUsed = 100 → pct = 100% → error
    billingStore.usageMeter = { meterUsed: 100, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
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

    wrapper = mountComponent();
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

    wrapper = mountComponent();
    // Must NOT be null — nextMondayIso provides a fallback
    expect(wrapper.vm.resetLabel).not.toBeNull();
    expect(wrapper.vm.resetLabel).toMatch(/^resets /);
  });

  it('resetLabel falls back to nextMondayIso() when usageMeter is null', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    wrapper = mountComponent();
    // usageMeter is null → weekResetAt falls back to nextMondayIso()
    expect(wrapper.vm.resetLabel).not.toBeNull();
    expect(wrapper.vm.resetLabel).toMatch(/^resets /);
  });

  // ── nextMondayIso helper ─────────────────────────────────────────────────

  it('nextMondayIso() returns a valid ISO string at 00:00 UTC on a Monday', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    wrapper = mountComponent();
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

    wrapper = mountComponent();
    expect(billingStore.fetchUsageMeter).toHaveBeenCalledTimes(1);
  });

  it('installs a window.focus listener on mount that calls fetchUsageMeter', async () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    const billingStore = useBillingStore();
    billingStore.fetchUsageMeter = vi.fn().mockResolvedValue(undefined);

    wrapper = mountComponent();
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

    const w = mountComponent();
    w.unmount();
    // wrapper is already unmounted — set to null so afterEach doesn't double-unmount
    wrapper = null;

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

    wrapper = mountComponent();
    expect(wrapper.vm.usedDisplay).toBe((1234).toLocaleString());
  });

  it('totalDisplay formats totalQuota (meterQuota + extrasRemaining) as localized string', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 1000, meterQuota: 4000, extrasRemaining: 500, weekResetAt: null };
    // totalQuota = 4000 + 500 = 4500 (meterUsed excluded)

    wrapper = mountComponent();
    expect(wrapper.vm.totalDisplay).toBe((4500).toLocaleString());
  });

  // ── click navigation ─────────────────────────────────────────────────────

  it('v-list-item links to /users?tab=subscriptions', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    const listItem = wrapper.findComponent({ name: 'VListItem' });
    expect(listItem.props('to')).toEqual({ path: '/users', query: { tab: 'subscriptions' } });
  });
});
