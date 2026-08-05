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

  it('shows "X% of quota" in v-list-item-title when usageMeter is available', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // pctUsed = meterUsed / meterQuota (quota-only) = 800 / 1600 = 50%
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.text()).toContain('50% of quota');
  });

  it('shows "—" in v-list-item-title when usageMeter is null', () => {
    const authStore = useAuthStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };

    wrapper = mountComponent();
    expect(wrapper.text()).toContain('—');
  });

  // ── pctUsed formula: quota-only (meterUsed / meterQuota), matches server ──

  it('computes pctUsed = meterUsed / meterQuota (quota-only, ignores extrasRemaining)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // quota-only: pct = 800 / 1600 = 50% (previously blended with extrasRemaining → 40%)
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 400, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(50);
  });

  it('returns pctUsed=0 when meterQuota=0 (division-by-zero guard)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 0, meterQuota: 0, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(0);
  });

  it('clamps pctUsed to 100 when meterUsed exceeds meterQuota', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // meterQuota = 50, meterUsed = 200 → pct = 200/50 = 400% → clamp to 100
    billingStore.usageMeter = { meterUsed: 200, meterQuota: 50, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(100);
  });

  it('returns pctUsed=50 for meterUsed=800, meterQuota=1600, extrasRemaining=0 (no-op proof: extras absent)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 800, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(50);
  });

  it('clamps pctUsed to 100 and iconColor to "error" when quota is exceeded while extras remain (#4548 regression)', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    // Reproduces the reported bug: meterQuota 1000, extrasRemaining 5000, meterUsed 1020.
    // Blended formula rendered 17%; quota-only clamps to 100 and flags error, matching
    // the server's quota-threshold alert on this same account.
    billingStore.usageMeter = { meterUsed: 1020, meterQuota: 1000, extrasRemaining: 5000, weekResetAt: null };

    wrapper = mountComponent();
    expect(wrapper.vm.pctUsed).toBe(100);
    expect(wrapper.vm.iconColor).toBe('error');
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

  it('v-list-item links to /users/billing', () => {
    const authStore = useAuthStore();
    const billingStore = useBillingStore();
    authStore.cookieExpire = Date.now() + 86400000;
    authStore.serverConfig = { billing: { meterMode: true } };
    billingStore.usageMeter = { meterUsed: 400, meterQuota: 1600, extrasRemaining: 0, weekResetAt: null };

    wrapper = mountComponent();
    const listItem = wrapper.findComponent({ name: 'VListItem' });
    expect(listItem.props('to')).toBe('/users/billing');
  });

  // ── a11y + touch ─────────────────────────────────────────────────────────

  describe('a11y + touch', () => {
    // jsdom does not implement window.visualViewport; Vuetify's VOverlay uses it
    // when the tooltip opens. Stub it so tests that toggle tooltipOpen don't crash.
    beforeEach(() => {
      if (!window.visualViewport) {
        Object.defineProperty(window, 'visualViewport', {
          configurable: true,
          value: { width: 1024, height: 768, offsetTop: 0, offsetLeft: 0, addEventListener: () => {}, removeEventListener: () => {} },
        });
      }
    });

    afterEach(() => {
      // Clean up stub between tests to keep other suites unaffected
      if (window.visualViewport) {
        Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
      }
    });

    const setupVisible = () => {
      const authStore = useAuthStore();
      const billingStore = useBillingStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      billingStore.usageMeter = { meterUsed: 50, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };
    };

    it('aria-expanded defaults to "false" on the activator (v-list-item)', () => {
      setupVisible();
      wrapper = mountComponent();
      const listItem = wrapper.findComponent({ name: 'VListItem' });
      expect(listItem.attributes('aria-expanded')).toBe('false');
    });

    it('onTouchActivate toggles tooltipOpen from false to true', () => {
      setupVisible();
      wrapper = mountComponent();
      expect(wrapper.vm.tooltipOpen).toBe(false);
      wrapper.vm.onTouchActivate();
      expect(wrapper.vm.tooltipOpen).toBe(true);
    });

    it('second onTouchActivate call toggles tooltipOpen back to false', () => {
      setupVisible();
      wrapper = mountComponent();
      wrapper.vm.onTouchActivate();
      wrapper.vm.onTouchActivate();
      expect(wrapper.vm.tooltipOpen).toBe(false);
    });
  });

  // ── #4260 — admin ∞ rainbow display ─────────────────────────────────────

  describe('admin display (#4260)', () => {
    const setupAdmin = () => {
      const authStore = useAuthStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      authStore.user = { roles: ['admin'] };
    };

    it('isAdmin is true when user roles include "admin"', () => {
      setupAdmin();
      wrapper = mountComponent();
      expect(wrapper.vm.isAdmin).toBe(true);
    });

    it('isAdmin is false when user has no admin role', () => {
      const authStore = useAuthStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      authStore.user = { roles: ['user'] };
      wrapper = mountComponent();
      expect(wrapper.vm.isAdmin).toBe(false);
    });

    it('isAdmin is false when user is null', () => {
      const authStore = useAuthStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      authStore.user = null;
      wrapper = mountComponent();
      expect(wrapper.vm.isAdmin).toBe(false);
    });

    it('renders ∞ glyph for admin instead of "X% of quota"', () => {
      setupAdmin();
      wrapper = mountComponent();
      expect(wrapper.text()).toContain('∞');
      expect(wrapper.text()).not.toContain('% of quota');
      expect(wrapper.text()).not.toContain('—');
    });

    it('renders admin-rainbow class on the ∞ span', () => {
      setupAdmin();
      wrapper = mountComponent();
      const rainbowSpan = wrapper.find('.admin-rainbow');
      expect(rainbowSpan.exists()).toBe(true);
    });

    it('renders .nav-gauge-admin-ring div in prepend slot for admin (not VProgressCircular)', () => {
      setupAdmin();
      wrapper = mountComponent();
      expect(wrapper.find('.nav-gauge-admin-ring').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(false);
    });

    it('renders VProgressCircular (not admin ring) for non-admin users', () => {
      const authStore = useAuthStore();
      const billingStore = useBillingStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      authStore.user = { roles: ['user'] };
      billingStore.usageMeter = { meterUsed: 50, meterQuota: 100, extrasRemaining: 0, weekResetAt: null };
      wrapper = mountComponent();
      expect(wrapper.find('.nav-gauge-admin-ring').exists()).toBe(false);
      expect(wrapper.findComponent({ name: 'VProgressCircular' }).exists()).toBe(true);
    });

    it('aria-label includes "unlimited (admin)" for admin users', () => {
      setupAdmin();
      wrapper = mountComponent();
      const listItem = wrapper.findComponent({ name: 'VListItem' });
      expect(listItem.attributes('aria-label')).toMatch(/unlimited.*admin/i);
    });
  });

  // ── #4349 — equivalence capacity chips ───────────────────────────────────

  describe('equivalence chips (#4349)', () => {
    const setupWithEquivalences = (
      equivalences,
      meter = { meterUsed: 0, meterQuota: 10000, extrasRemaining: 0, weekResetAt: null },
    ) => {
      const authStore = useAuthStore();
      const billingStore = useBillingStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true, equivalences } };
      billingStore.usageMeter = meter;
    };

    it('registers BillingEquivalencesChipsComponent', () => {
      setupWithEquivalences([{ kind: 'easy', unitCost: 200, label: 'easy ops' }]);
      wrapper = mountComponent();
      expect(wrapper.vm.$options.components.BillingEquivalencesChipsComponent).toBeTruthy();
    });

    it('derives chips with count = floor(totalRemaining / unitCost)', () => {
      // totalRemaining = (10000 + 0) - 0 = 10000
      setupWithEquivalences([
        { kind: 'easy', unitCost: 200, label: 'easy ops' },
        { kind: 'hard', unitCost: 2000, label: 'hard ops' },
      ]);
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([
        { kind: 'easy', count: 50, label: 'easy ops' },
        { kind: 'hard', count: 5, label: 'hard ops' },
      ]);
    });

    it('floors fractional results (no rounding up)', () => {
      // totalRemaining = 9500 → 9500 / 200 = 47.5 → 47
      setupWithEquivalences(
        [{ kind: 'easy', unitCost: 200, label: 'easy ops' }],
        { meterUsed: 500, meterQuota: 10000, extrasRemaining: 0, weekResetAt: null },
      );
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([{ kind: 'easy', count: 47, label: 'easy ops' }]);
    });

    it('returns no chips when equivalences config is absent', () => {
      const authStore = useAuthStore();
      const billingStore = useBillingStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      billingStore.usageMeter = { meterUsed: 0, meterQuota: 10000, extrasRemaining: 0, weekResetAt: null };
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([]);
    });

    it('returns no chips when equivalences is null', () => {
      setupWithEquivalences(null);
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([]);
    });

    it('returns no chips when equivalences is an empty array', () => {
      setupWithEquivalences([]);
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([]);
    });

    it('drops entries with non-positive / non-finite unitCost (no div-by-zero or Infinity)', () => {
      setupWithEquivalences([
        { kind: 'easy', unitCost: 0, label: 'zero' },
        { kind: 'easy', unitCost: -5, label: 'neg' },
        { kind: 'hard', unitCost: Number.NaN, label: 'nan' },
        { kind: 'hard', unitCost: Number.POSITIVE_INFINITY, label: 'inf' },
        { kind: 'easy', unitCost: 200, label: 'valid' },
      ]);
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([{ kind: 'easy', count: 50, label: 'valid' }]);
    });

    it('drops unknown kinds and the non-consumption feature kind', () => {
      setupWithEquivalences([
        { kind: 'feature', unitCost: 1, label: 'integrations' },
        { kind: 'weird', unitCost: 10, label: 'weird' },
        { kind: 'hard', unitCost: 2000, label: 'hard ops' },
      ]);
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([{ kind: 'hard', count: 5, label: 'hard ops' }]);
    });

    it('drops entries whose label is not a string', () => {
      setupWithEquivalences([
        { kind: 'easy', unitCost: 200, label: 42 },
        { kind: 'easy', unitCost: 200, label: 'ok' },
      ]);
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([{ kind: 'easy', count: 50, label: 'ok' }]);
    });

    it('handles a one-shot grant (quota=0 + extras) from the remaining grant, no per-period branch', () => {
      // free/one-shot plan: meterQuota 0, grant lives in extrasRemaining.
      // totalRemaining = max(0, (0 + 500) - 100) = 400 → floor(400 / 200) = 2
      setupWithEquivalences(
        [{ kind: 'easy', unitCost: 200, label: 'easy ops' }],
        { meterUsed: 100, meterQuota: 0, extrasRemaining: 500, weekResetAt: null },
      );
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([{ kind: 'easy', count: 2, label: 'easy ops' }]);
    });

    it('renders a truthful 0 when remaining compute is exhausted', () => {
      // totalRemaining = max(0, 500 - 1000) = 0 → count 0
      setupWithEquivalences(
        [{ kind: 'easy', unitCost: 200, label: 'easy ops' }],
        { meterUsed: 1000, meterQuota: 500, extrasRemaining: 0, weekResetAt: null },
      );
      wrapper = mountComponent();
      expect(wrapper.vm.equivalenceChips).toEqual([{ kind: 'easy', count: 0, label: 'easy ops' }]);
    });
  });

  // ── #4349 — tooltip render (real chips component, open tooltip) ───────────

  describe('equivalence chips render in the open tooltip (#4349)', () => {
    let originalViewport;

    beforeEach(() => {
      // jsdom lacks visualViewport (Vuetify VOverlay reads it when the tooltip opens).
      // Capture any pre-existing descriptor and stub only when absent, so cleanup
      // restores exactly what was there (never clobbers a real/global visualViewport).
      originalViewport = Object.getOwnPropertyDescriptor(window, 'visualViewport');
      if (!window.visualViewport) {
        Object.defineProperty(window, 'visualViewport', {
          configurable: true,
          value: { width: 1024, height: 768, offsetTop: 0, offsetLeft: 0, addEventListener: () => {}, removeEventListener: () => {} },
        });
      }
    });

    afterEach(() => {
      // Restore the original descriptor when one existed; otherwise leave a defined
      // `undefined` value (not a deleted property) so Vuetify overlay teardown's
      // optional-chained reads stay safe.
      if (originalViewport) {
        Object.defineProperty(window, 'visualViewport', originalViewport);
      } else {
        Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
      }
    });

    it('renders the real chip text (count + label) inside the open tooltip', async () => {
      const authStore = useAuthStore();
      const billingStore = useBillingStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = {
        billing: {
          meterMode: true,
          equivalences: [
            { kind: 'easy', unitCost: 200, label: 'easy operations' },
            { kind: 'hard', unitCost: 2000, label: 'heavy operations' },
          ],
        },
      };
      // Stub the mount-time fetch (the global axios mock resolves { data: null },
      // which would async-null usageMeter across the awaits below).
      billingStore.fetchUsageMeter = vi.fn().mockResolvedValue(undefined);
      // totalRemaining = 10000 → 50 easy / 5 heavy
      billingStore.usageMeter = { meterUsed: 0, meterQuota: 10000, extrasRemaining: 0, weekResetAt: null };

      wrapper = mountComponent();
      wrapper.vm.onTouchActivate(); // open the tooltip
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      // Tooltip content is teleported to body — assert the real chips rendered there.
      const body = document.body.textContent || '';
      expect(body).toContain('50 easy operations');
      expect(body).toContain('5 heavy operations');
    });
  });

  // ── #4349 — ring visibility motion (Slice 2) ─────────────────────────────

  describe('ring motion (#4349)', () => {
    const setupRing = (meter) => {
      const authStore = useAuthStore();
      const billingStore = useBillingStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      billingStore.usageMeter = meter;
    };

    it('isLow is false below 80%', () => {
      setupRing({ meterUsed: 50, meterQuota: 100, extrasRemaining: 0, weekResetAt: null });
      wrapper = mountComponent();
      expect(wrapper.vm.isLow).toBe(false);
    });

    it('isLow is true at or above 80%', () => {
      setupRing({ meterUsed: 80, meterQuota: 100, extrasRemaining: 0, weekResetAt: null });
      wrapper = mountComponent();
      expect(wrapper.vm.isLow).toBe(true);
    });

    it('wraps the ring in .nav-gauge-ring-enter (mount animation) for non-admin', () => {
      setupRing({ meterUsed: 10, meterQuota: 100, extrasRemaining: 0, weekResetAt: null });
      wrapper = mountComponent();
      expect(wrapper.find('.nav-gauge-ring-enter').exists()).toBe(true);
    });

    it('applies .nav-gauge-ring-alert on the ring when usage is low', () => {
      setupRing({ meterUsed: 90, meterQuota: 100, extrasRemaining: 0, weekResetAt: null });
      wrapper = mountComponent();
      expect(wrapper.find('.nav-gauge-ring-alert').exists()).toBe(true);
    });

    it('does not apply .nav-gauge-ring-alert when usage is healthy', () => {
      setupRing({ meterUsed: 10, meterQuota: 100, extrasRemaining: 0, weekResetAt: null });
      wrapper = mountComponent();
      expect(wrapper.find('.nav-gauge-ring-alert').exists()).toBe(false);
    });

    it('uses the admin ring (no .nav-gauge-ring-enter wrapper) for admin users', () => {
      const authStore = useAuthStore();
      authStore.cookieExpire = Date.now() + 86400000;
      authStore.serverConfig = { billing: { meterMode: true } };
      authStore.user = { roles: ['admin'] };
      wrapper = mountComponent();
      expect(wrapper.find('.nav-gauge-ring-enter').exists()).toBe(false);
      expect(wrapper.find('.nav-gauge-admin-ring').exists()).toBe(true);
    });
  });
});
