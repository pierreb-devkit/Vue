/**
 * Module dependencies.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useBillingStore } from '../stores/billing.store';

let pollTimer = null;
let consumerCount = 0;
// Shared error ref so the single interval callback can write into it
// and all consumers receive the same reactive signal.
const sharedMeterError = ref(null);

/**
 * @desc Fetch meter-backed billing data once when it has not been loaded yet.
 * Uses store state and in-flight counters to avoid duplicate initial requests
 * when multiple consumers mount during the same render cycle.
 * @param {ReturnType<typeof useBillingStore>} billingStore - Billing store instance
 * @returns {Promise<Array<unknown>>} Pending fetches, or an empty array when already loaded
 */
function fetchMissingMeterData(billingStore) {
  const requests = [];

  if (billingStore.usageMeter === null && billingStore.usageMeterRequests === 0) {
    requests.push(billingStore.fetchUsageMeter());
  }

  if (billingStore.extrasBalance === null && billingStore.extrasBalanceRequests === 0) {
    requests.push(billingStore.fetchExtrasBalance());
  }

  if (requests.length === 0) return Promise.resolve([]);

  return Promise.all(requests);
}

/**
 * @desc Composable exposing meter-based usage helpers for compute billing.
 * Polls the API at a configurable interval and exposes reactive derived state.
 * @param {Object} [opts] - Options
 * @param {number} [opts.pollIntervalMs=30000] - Polling interval in ms; set to 0 to disable
 * @param {boolean} [opts.refreshOnFocus=true] - Auto-refresh when tab regains visibility (resolves multi-tab stale state)
 * @returns {{
 *   used: import('vue').ComputedRef<number>,
 *   quota: import('vue').ComputedRef<number>,
 *   extras: import('vue').ComputedRef<number>,
 *   breakdown: import('vue').ComputedRef<Object>,
 *   progress: import('vue').ComputedRef<number>,
 *   breakdownPercent: import('vue').ComputedRef<Object>,
 *   totalRemaining: import('vue').ComputedRef<number>,
 *   netRemainingRaw: import('vue').ComputedRef<number>,
 *   overage: import('vue').ComputedRef<number>,
 *   meterError: import('vue').Ref<Error|null>,
 *   refresh: () => Promise<[Object, Object]>,
 *   purchasePack: (packId: string) => Promise<void>
 * }}
 */
export function useMeter({ pollIntervalMs = 30000, refreshOnFocus = true } = {}) {
  const billingStore = useBillingStore();
  consumerCount += 1;

  /** @type {import('vue').Ref<Error|null>} Last error from a background refresh or initial fetch. Shared across all consumers. */
  const meterError = sharedMeterError; // all consumers share one ref

  /** @type {import('vue').ComputedRef<number>} Meter credits consumed this week */
  const used = computed(() => billingStore.usageMeter?.meterUsed ?? 0);

  /** @type {import('vue').ComputedRef<number>} Included weekly quota */
  const quota = computed(() => billingStore.usageMeter?.meterQuota ?? 0);

  /**
   * @type {import('vue').ComputedRef<number>}
   * Extras balance: prefer usageMeter.extrasRemaining, fallback to extrasBalance.balance
   */
  const extras = computed(
    () => billingStore.usageMeter?.extrasRemaining ?? billingStore.extrasBalance?.balance ?? 0,
  );

  /** @type {import('vue').ComputedRef<Object>} Per-bucket breakdown of meter usage */
  const breakdown = computed(() => billingStore.usageMeter?.meterBreakdown ?? {});

  /**
   * @type {import('vue').ComputedRef<number>}
   * Percentage of weekly quota consumed, clamped to [0, 100].
   */
  const progress = computed(() => {
    if (quota.value === 0) return 0;
    return Math.max(0, Math.min(100, Math.round((used.value / quota.value) * 100)));
  });

  /**
   * @type {import('vue').ComputedRef<Object>}
   * Per-bucket share of total used (%). Values sum to ~100 when used > 0.
   * Returns empty object when used === 0.
   */
  const breakdownPercent = computed(() => {
    const total = used.value;
    if (total === 0) return {};
    const bd = breakdown.value;
    const result = {};
    for (const [key, val] of Object.entries(bd)) {
      result[key] = Math.round((val / total) * 100);
    }
    return result;
  });

  /**
   * @type {import('vue').ComputedRef<number>}
   * Sum of remaining included quota and extras credits (floor 0).
   * Used by progress bars and visual indicators — always >= 0 (backward-compat).
   */
  const totalRemaining = computed(() => Math.max(0, quota.value - used.value) + extras.value);

  /**
   * @type {import('vue').ComputedRef<number>}
   * Unclamped balance: quota - used + extras. Can be negative when in-flight jobs
   * push usage past quota (e.g. a long-running scrape finishing after quota is hit).
   * Use this in detail views / ledger displays that must show the real debt.
   */
  const netRemainingRaw = computed(() => quota.value - used.value + extras.value);

  /**
   * @type {import('vue').ComputedRef<number>}
   * Credits consumed beyond the included quota (floor 0).
   * Positive only when used > quota, regardless of extras balance.
   * Use this to show an "over quota" chip in drawer / detail views.
   */
  const overage = computed(() => Math.max(0, used.value - quota.value));

  /**
   * @desc Trigger parallel refresh of meter usage and extras balance.
   * @returns {Promise<[Object, Object]>} Both resolved values
   */
  const refresh = () =>
    Promise.all([billingStore.fetchUsageMeter(), billingStore.fetchExtrasBalance()]);

  /**
   * @desc Safe wrapper: clears stale errors before each attempt, then logs and surfaces new errors via meterError ref.
   * @returns {Promise<void>}
   */
  const safeRefresh = () => {
    meterError.value = null;
    return refresh().catch((err) => {
      console.error('[billing.useMeter] refresh failed', err);
      meterError.value = err;
    });
  };

  meterError.value = null;
  void fetchMissingMeterData(billingStore).catch((err) => {
    console.error('[billing.useMeter] initial fetch failed', err);
    meterError.value = err;
  });

  if (pollIntervalMs > 0 && pollTimer === null) {
    pollTimer = setInterval(() => {
      void safeRefresh();
    }, pollIntervalMs);
  }

  /**
   * @desc Handle tab visibility change — refresh when the tab becomes visible again.
   * Only triggers when polling is disabled (pollIntervalMs === 0) to avoid
   * double-fetching when the interval poll already covers freshness.
   * @returns {void}
   */
  // biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — composable closure, not a Qwik component
  const handleVisibilityChange = () => {
    if (refreshOnFocus && document.visibilityState === 'visible' && pollIntervalMs === 0) {
      void safeRefresh();
    }
  };

  onMounted(() => {
    if (refreshOnFocus) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  onUnmounted(() => {
    if (refreshOnFocus) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
    consumerCount -= 1;
    if (consumerCount === 0 && pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
      sharedMeterError.value = null;
    }
  });

  /**
   * @desc Initiate purchase of an extras credit pack.
   * @param {string} packId - Pack identifier to purchase
   * @returns {Promise<void>}
   */
  const purchasePack = (packId) => billingStore.createExtrasCheckout(packId);

  return {
    used,
    quota,
    extras,
    breakdown,
    progress,
    breakdownPercent,
    totalRemaining,
    netRemainingRaw,
    overage,
    meterError,
    refresh,
    purchasePack,
  };
}

/**
 * Exports.
 */
export default useMeter;

/**
 * @desc Reset module-scope polling state for isolated unit tests.
 * @returns {void}
 */
export function __resetUseMeterForTests() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  consumerCount = 0;
  sharedMeterError.value = null;
}
