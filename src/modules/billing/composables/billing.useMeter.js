/**
 * Module dependencies.
 */
import { computed, onUnmounted } from 'vue';
import { useBillingStore } from '../stores/billing.store';

let pollTimer = null;
let consumerCount = 0;

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
 * @returns {{
 *   used: import('vue').ComputedRef<number>,
 *   quota: import('vue').ComputedRef<number>,
 *   extras: import('vue').ComputedRef<number>,
 *   breakdown: import('vue').ComputedRef<Object>,
 *   progress: import('vue').ComputedRef<number>,
 *   breakdownPercent: import('vue').ComputedRef<Object>,
 *   totalRemaining: import('vue').ComputedRef<number>,
 *   refresh: () => Promise<[Object, Object]>,
 *   purchasePack: (packId: string) => Promise<void>
 * }}
 */
export function useMeter({ pollIntervalMs = 30000 } = {}) {
  const billingStore = useBillingStore();
  consumerCount += 1;

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
   */
  const totalRemaining = computed(() => Math.max(0, quota.value - used.value) + extras.value);

  /**
   * @desc Trigger parallel refresh of meter usage and extras balance.
   * @returns {Promise<[Object, Object]>} Both resolved values
   */
  const refresh = () =>
    Promise.all([billingStore.fetchUsageMeter(), billingStore.fetchExtrasBalance()]);

  /** @desc Safe wrapper: catches refresh errors to avoid unhandled Promise rejections. */
  const safeRefresh = () => refresh().catch(() => {});

  void fetchMissingMeterData(billingStore).catch(() => {});

  if (pollIntervalMs > 0 && pollTimer === null) {
    pollTimer = setInterval(() => {
      void safeRefresh();
    }, pollIntervalMs);
  }

  onUnmounted(() => {
    consumerCount -= 1;
    if (consumerCount === 0 && pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
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
}
