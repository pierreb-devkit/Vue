/**
 * Module dependencies.
 */
import { computed, onMounted, onUnmounted } from 'vue';
import { useBillingStore } from '../stores/billing.store';

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

  let timer = null;

  /**
   * @desc Trigger parallel refresh of meter usage and extras balance.
   * @returns {Promise<[Object, Object]>} Both resolved values
   */
  const refresh = () =>
    Promise.all([billingStore.fetchUsageMeter(), billingStore.fetchExtrasBalance()]);

  /** @desc Safe wrapper: catches refresh errors to avoid unhandled Promise rejections. */
  const safeRefresh = () => refresh().catch(() => {});

  onMounted(() => {
    void safeRefresh();
    if (pollIntervalMs > 0) {
      timer = setInterval(() => {
        void safeRefresh();
      }, pollIntervalMs);
    }
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
      timer = null;
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
