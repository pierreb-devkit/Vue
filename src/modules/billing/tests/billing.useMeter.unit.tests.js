import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useBillingStore } from '../stores/billing.store';
import { __resetUseMeterForTests, useMeter } from '../composables/billing.useMeter';

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

/**
 * @desc Build a deferred promise pair for timing-sensitive tests.
 * @returns {{ promise: Promise<void>, resolve: () => void }}
 */
function createDeferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe('useMeter composable', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useBillingStore();
    vi.clearAllMocks();
    __resetUseMeterForTests();
    vi.spyOn(store, 'fetchUsageMeter').mockImplementation(async () => {
      store.usageMeterRequests += 1;
      try {
        store.usageMeter ??= { meterUsed: 0, meterQuota: 0, meterBreakdown: {}, extrasRemaining: 0 };
        return store.usageMeter;
      } finally {
        store.usageMeterRequests -= 1;
      }
    });
    vi.spyOn(store, 'fetchExtrasBalance').mockImplementation(async () => {
      store.extrasBalanceRequests += 1;
      try {
        store.extrasBalance ??= { balance: 0, packsAvailable: [] };
        return store.extrasBalance;
      } finally {
        store.extrasBalanceRequests -= 1;
      }
    });
    vi.spyOn(store, 'createExtrasCheckout').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    _wrappers.forEach((w) => w.unmount());
    _wrappers.length = 0;
    __resetUseMeterForTests();
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

  // ── netRemainingRaw ───────────────────────────────────────────────────────

  it('netRemainingRaw is quota - used + extras (positive case)', () => {
    store.usageMeter = { meterUsed: 2000, meterQuota: 8000, extrasRemaining: 500 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.netRemainingRaw.value).toBe(6500);
  });

  it('netRemainingRaw can be negative when used > quota and extras = 0', () => {
    store.usageMeter = { meterUsed: 10000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.netRemainingRaw.value).toBe(-2000);
  });

  it('netRemainingRaw accounts for extras even when used > quota', () => {
    store.usageMeter = { meterUsed: 10000, meterQuota: 8000, extrasRemaining: 5000 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.netRemainingRaw.value).toBe(3000);
  });

  it('netRemainingRaw is 0 when used equals quota and extras = 0', () => {
    store.usageMeter = { meterUsed: 8000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.netRemainingRaw.value).toBe(0);
  });

  // ── overage ───────────────────────────────────────────────────────────────

  it('overage is 0 when used < quota', () => {
    store.usageMeter = { meterUsed: 2000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.overage.value).toBe(0);
  });

  it('overage is 0 when used equals quota', () => {
    store.usageMeter = { meterUsed: 8000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.overage.value).toBe(0);
  });

  it('overage is positive when used > quota', () => {
    store.usageMeter = { meterUsed: 10000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.overage.value).toBe(2000);
  });

  it('overage ignores extras balance (reflects raw quota breach)', () => {
    store.usageMeter = { meterUsed: 10000, meterQuota: 8000, extrasRemaining: 5000 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.overage.value).toBe(2000);
  });

  // ── totalRemaining regression (always >= 0) ───────────────────────────────

  it('totalRemaining is always >= 0 even when used > quota (regression)', () => {
    store.usageMeter = { meterUsed: 50000, meterQuota: 8000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.totalRemaining.value).toBeGreaterThanOrEqual(0);
  });

  it('totalRemaining stays >= 0 when used far exceeds quota with no extras', () => {
    store.usageMeter = { meterUsed: 100000, meterQuota: 1000, extrasRemaining: 0 };
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.totalRemaining.value).toBe(0);
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
    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(1);
    expect(store.fetchExtrasBalance).toHaveBeenCalledTimes(1);
  });

  // ── polling ────────────────────────────────────────────────────────────────

  it('mounting multiple consumers only fetches initial meter data once', async () => {
    const usageDeferred = createDeferred();
    const extrasDeferred = createDeferred();

    store.fetchUsageMeter.mockImplementation(() => {
      store.usageMeterRequests += 1;
      return usageDeferred.promise
        .then(() => {
          store.usageMeter = { meterUsed: 10, meterQuota: 100, meterBreakdown: {}, extrasRemaining: 4 };
          return store.usageMeter;
        })
        .finally(() => {
          store.usageMeterRequests -= 1;
        });
    });

    store.fetchExtrasBalance.mockImplementation(() => {
      store.extrasBalanceRequests += 1;
      return extrasDeferred.promise
        .then(() => {
          store.extrasBalance = { balance: 4, packsAvailable: [] };
          return store.extrasBalance;
        })
        .finally(() => {
          store.extrasBalanceRequests -= 1;
        });
    });

    mountMeter({ pollIntervalMs: 0 });
    mountMeter({ pollIntervalMs: 0 });

    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(1);
    expect(store.fetchExtrasBalance).toHaveBeenCalledTimes(1);

    usageDeferred.resolve();
    extrasDeferred.resolve();
    await Promise.all([usageDeferred.promise, extrasDeferred.promise]);
  });

  it('creates the polling timer only once for multiple polling consumers', () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    mountMeter({ pollIntervalMs: 5000 });
    mountMeter({ pollIntervalMs: 5000 });

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

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

  it('cleans up the polling timer when the last consumer unmounts', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const first = mountMeter({ pollIntervalMs: 5000 });
    const second = mountMeter({ pollIntervalMs: 0 });

    clearIntervalSpy.mockClear();
    first.wrapper.unmount();
    expect(clearIntervalSpy).not.toHaveBeenCalled();

    second.wrapper.unmount();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  // ── refreshOnFocus (visibilitychange) ─────────────────────────────────────

  it('adds a visibilitychange listener on mount when refreshOnFocus is true', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    mountMeter({ pollIntervalMs: 0, refreshOnFocus: true });
    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('does not add a visibilitychange listener when refreshOnFocus is false', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    mountMeter({ pollIntervalMs: 0, refreshOnFocus: false });
    const visibilityCalls = addSpy.mock.calls.filter(([event]) => event === 'visibilitychange');
    expect(visibilityCalls).toHaveLength(0);
  });

  it('refreshes when tab becomes visible and polling is disabled', async () => {
    mountMeter({ pollIntervalMs: 0, refreshOnFocus: true });

    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    // Simulate document becoming visible
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(store.fetchUsageMeter).toHaveBeenCalledTimes(1);
    expect(store.fetchExtrasBalance).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on visibilitychange when document is hidden', async () => {
    mountMeter({ pollIntervalMs: 0, refreshOnFocus: true });

    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    // Simulate document becoming hidden (tab switch away)
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
    expect(store.fetchExtrasBalance).not.toHaveBeenCalled();

    // Restore for subsequent tests
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('does not refresh on visibilitychange when polling is already active', () => {
    vi.useFakeTimers();
    mountMeter({ pollIntervalMs: 5000, refreshOnFocus: true });

    store.fetchUsageMeter.mockClear();
    store.fetchExtrasBalance.mockClear();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // pollIntervalMs > 0 — visibilitychange handler should NOT trigger refresh
    expect(store.fetchUsageMeter).not.toHaveBeenCalled();
    expect(store.fetchExtrasBalance).not.toHaveBeenCalled();
  });

  it('removes the visibilitychange listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { wrapper } = mountMeter({ pollIntervalMs: 0, refreshOnFocus: true });
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
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

  // ── meterError ─────────────────────────────────────────────────────────────

  it('meterError is null by default', () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect(result.meterError.value).toBeNull();
  });

  it('meterError is set when initial fetchMissingMeterData fails', async () => {
    const fetchError = new Error('Network error');
    store.fetchUsageMeter.mockRejectedValueOnce(fetchError);
    store.fetchExtrasBalance.mockRejectedValueOnce(fetchError);

    const { result } = mountMeter({ pollIntervalMs: 0 });
    // Allow the rejected promise to settle
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.meterError.value).toBeTruthy();
  });

  it('meterError is set when a polling safeRefresh fails', async () => {
    vi.useFakeTimers();
    const { result } = mountMeter({ pollIntervalMs: 5000 });

    const refreshError = new Error('Polling error');
    store.fetchUsageMeter.mockRejectedValueOnce(refreshError);
    store.fetchExtrasBalance.mockRejectedValueOnce(refreshError);

    vi.advanceTimersByTime(5000);
    // Allow microtasks to flush
    await Promise.resolve();
    await Promise.resolve();

    expect(result.meterError.value).toBeTruthy();
  });

  it('meterError clears to null after a transient failure when next refresh succeeds', async () => {
    vi.useFakeTimers();
    const { result } = mountMeter({ pollIntervalMs: 5000 });

    // First poll: both fetches reject
    const refreshError = new Error('Transient error');
    store.fetchUsageMeter.mockRejectedValueOnce(refreshError);
    store.fetchExtrasBalance.mockRejectedValueOnce(refreshError);

    vi.advanceTimersByTime(5000);
    await Promise.resolve();
    await Promise.resolve();

    expect(result.meterError.value).toBeTruthy();

    // Second poll: fetches succeed
    store.fetchUsageMeter.mockResolvedValueOnce({});
    store.fetchExtrasBalance.mockResolvedValueOnce({});

    vi.advanceTimersByTime(5000);
    await Promise.resolve();
    await Promise.resolve();

    expect(result.meterError.value).toBeNull();
  });

  it('meterError is exposed in the returned object', () => {
    const { result } = mountMeter({ pollIntervalMs: 0 });
    expect('meterError' in result).toBe(true);
  });

  it('preserves an existing meterError when a new consumer mounts (no unconditional reset)', async () => {
    // First consumer establishes a baseline; we then simulate an error set by an
    // earlier failed refresh and assert that mounting a second consumer does NOT
    // wipe the shared error ref. safeRefresh is the only allowed lifecycle reset.
    const { result: first } = mountMeter({ pollIntervalMs: 0 });
    const earlierError = new Error('first consumer error');
    first.meterError.value = earlierError;

    const { result: second } = mountMeter({ pollIntervalMs: 0 });
    // Allow microtasks from the second mount's initial fetch to settle
    await Promise.resolve();
    await Promise.resolve();

    // Both refs are the shared sharedMeterError — second consumer's ref must still
    // reflect the earlier error, not be reset to null.
    expect(second.meterError.value).toBe(earlierError);
    expect(first.meterError.value).toBe(earlierError);
  });
});
