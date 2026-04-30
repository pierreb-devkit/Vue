import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useBillingStore } from '../stores/billing.store';
import { useMeter } from '../composables/billing.useMeter';

// Mock axios (used indirectly via store)
vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

// Module-level array so mountMeter can register every wrapper for afterEach cleanup
// even when tests only destructure `result` and never capture `wrapper` themselves.
// Using an array handles the case where a test calls mountMeter() more than once.
const _wrappers = [];

/**
 * @desc Mount a wrapper component calling useMeter and expose its return value.
 * Registers the created wrapper into _wrappers for afterEach cleanup.
 * @param {Object} [opts] - Options forwarded to useMeter
 * @returns {{ result: Object, wrapper: import('@vue/test-utils').VueWrapper }}
 */
function mountMeter(opts = {}) {
  let result;
  const Wrapper = defineComponent({
    setup() {
      result = useMeter(opts);
      return {};
    },
    template: '<div />',
  });
  const wrapper = mount(Wrapper);
  _wrappers.push(wrapper);
  return { result, wrapper };
}

describe('useMeter composable', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBillingStore();
    vi.clearAllMocks();
    // Stub store actions to no-ops by default
    vi.spyOn(store, 'fetchUsageMeter').mockResolvedValue(null);
    vi.spyOn(store, 'fetchExtrasBalance').mockResolvedValue(null);
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    _wrappers.forEach((w) => w.unmount());
    _wrappers.length = 0;
  });

  // ── Computed defaults ────────────────────────────────────────────────────

  it('defaults used to 0 when usageMeter is null', () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.used.value).toBe(0);
  });

  it('defaults quota to 0 when usageMeter is null', () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.quota.value).toBe(0);
  });

  it('defaults extras to 0 when both usageMeter and extrasBalance are null', () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.extras.value).toBe(0);
  });

  it('prefers usageMeter.extrasRemaining over extrasBalance.balance for extras', () => {
    store.usageMeter = { meterUsed: 0, meterQuota: 100, extrasRemaining: 500 };
    store.extrasBalance = { balance: 999 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.extras.value).toBe(500);
  });

  it('falls back to extrasBalance.balance when usageMeter.extrasRemaining is absent', () => {
    store.usageMeter = { meterUsed: 0, meterQuota: 100 };
    store.extrasBalance = { balance: 250 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.extras.value).toBe(250);
  });

  it('defaults breakdown to empty object when usageMeter is null', () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.breakdown.value).toEqual({});
  });

  // ── progress ─────────────────────────────────────────────────────────────

  it('progress is 0 when quota is 0', () => {
    store.usageMeter = { meterUsed: 500, meterQuota: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.progress.value).toBe(0);
  });

  it('progress computes correct percentage', () => {
    store.usageMeter = { meterUsed: 2000, meterQuota: 8000 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.progress.value).toBe(25);
  });

  it('progress is clamped to 100 when over quota', () => {
    store.usageMeter = { meterUsed: 10000, meterQuota: 8000 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.progress.value).toBe(100);
  });

  it('progress is clamped to 0 minimum', () => {
    store.usageMeter = { meterUsed: -100, meterQuota: 8000 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.progress.value).toBe(0);
  });

  it('progress rounds to nearest integer', () => {
    store.usageMeter = { meterUsed: 1, meterQuota: 3 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.progress.value).toBe(33);
  });

  // ── breakdownPercent ──────────────────────────────────────────────────────

  it('breakdownPercent returns empty object when used is 0', () => {
    store.usageMeter = { meterUsed: 0, meterQuota: 8000, meterBreakdown: { scrap: 0, autofix: 0 } };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.breakdownPercent.value).toEqual({});
  });

  it('breakdownPercent sums to ~100 across buckets', () => {
    store.usageMeter = {
      meterUsed: 1200,
      meterQuota: 8000,
      meterBreakdown: { scrap: 800, autofix: 400 },
    };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    const bp = result.breakdownPercent.value;
    const sum = Object.values(bp).reduce((a, b) => a + b, 0);
    // Due to Math.round rounding, allow ±1
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
  });

  it('breakdownPercent computes correct per-bucket percent', () => {
    store.usageMeter = {
      meterUsed: 1000,
      meterQuota: 8000,
      meterBreakdown: { scrap: 700, autofix: 300 },
    };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.breakdownPercent.value.scrap).toBe(70);
    expect(result.breakdownPercent.value.autofix).toBe(30);
  });

  // ── totalRemaining ────────────────────────────────────────────────────────

  it('totalRemaining is quota - used + extras', () => {
    store.usageMeter = { meterUsed: 2000, meterQuota: 8000, extrasRemaining: 500 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.totalRemaining.value).toBe(6500);
  });

  it('totalRemaining floors at 0 when used exceeds quota (no extras)', () => {
    store.usageMeter = { meterUsed: 10000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.totalRemaining.value).toBe(0);
  });

  it('totalRemaining uses extras when quota is exhausted', () => {
    store.usageMeter = { meterUsed: 8000, meterQuota: 8000, extrasRemaining: 1500 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.totalRemaining.value).toBe(1500);
  });

  // ── refresh ────────────────────────────────────────────────────────────────

  it('refresh calls fetchUsageMeter and fetchExtrasBalance in parallel', async () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    const promise = result.refresh();
    // Both must be called before awaiting (parallel)
    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(1);
    expect(store.fetchExtrasBalance).toHaveBeenCalledTimes(1);
    await promise;
  });

  it('refresh is called on mount', async () => {
    mountMeter({ pollIntervalMs: 0 });
    // onMounted fires synchronously in test environment with @vue/test-utils
    expect(store.fetchUsageMeter).toHaveBeenCalled();
    expect(store.fetchExtrasBalance).toHaveBeenCalled();
  });

  // ── polling ────────────────────────────────────────────────────────────────

  it('polling refreshes on every interval tick', async () => {
    vi.useFakeTimers();
    const { wrapper } = mountMeter({ pollIntervalMs: 5000 });

    // Reset call counts from initial mount refresh
    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    vi.advanceTimersByTime(5000);
    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(1);
    expect(store.fetchExtrasBalance).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(2);
    expect(store.fetchExtrasBalance).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });

  it('polling is disabled when pollIntervalMs is 0', async () => {
    vi.useFakeTimers();
    mountMeter({ pollIntervalMs: 0 });

    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    vi.advanceTimersByTime(60000);
    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
    expect(store.fetchExtrasBalance).not.toHaveBeenCalled();
  });

  it('clears polling interval on unmount', () => {
    vi.useFakeTimers();
    const { wrapper } = mountMeter({ pollIntervalMs: 5000 });

    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    wrapper.unmount();
    vi.advanceTimersByTime(10000);

    // No further calls after unmount
    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
    expect(store.fetchExtrasBalance).not.toHaveBeenCalled();
  });

  // ── purchasePack ───────────────────────────────────────────────────────────

  it('purchasePack delegates to store.createExtrasCheckout', async () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    await result.purchasePack('pack_500');
    expect(store.createExtrasCheckout).toHaveBeenCalledWith('pack_500');
  });

  it('purchasePack propagates store errors to caller', async () => {
    store.createExtrasCheckout.mockRejectedValueOnce(new Error('Checkout failed'));
    const { result } = mountMeter({ pollIntervalMs: 0 });
    await expect(result.purchasePack('pack_500')).rejects.toThrow('Checkout failed');
  });
});
