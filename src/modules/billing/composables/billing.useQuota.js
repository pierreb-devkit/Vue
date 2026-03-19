/**
 * Module dependencies.
 */
import { computed } from 'vue';
import { useBillingStore } from '../stores/billing.store';

/**
 * @desc Composable exposing quota-checking helpers for plan-based feature gating.
 * @returns {{ plan: import('vue').ComputedRef<string>, period: import('vue').ComputedRef<string>, usage: import('vue').ComputedRef<Object>, limits: import('vue').ComputedRef<Object>, loading: import('vue').ComputedRef<boolean>, canDo: (resource: string, action: string) => boolean, usagePercent: (resource: string, action: string) => number, refresh: () => Promise<void> }}
 */
export function useQuota() {
  const billingStore = useBillingStore();

  const plan = computed(() => billingStore.quota?.plan || 'free');
  const period = computed(() => billingStore.quota?.period || '');
  const usage = computed(() => billingStore.quota?.usage || {});
  const limits = computed(() => billingStore.quota?.limits || {});
  const loading = computed(() => billingStore.loading);

  /**
   * @desc Check whether the user can perform a given resource action within quota limits.
   * @param {string} resource - Resource name (e.g. "documents")
   * @param {string} action - Action name (e.g. "create")
   * @returns {boolean} True if under the limit or no limit is defined
   */
  function canDo(resource, action) {
    const key = `${resource}.${action}`;
    const limit = limits.value[key];
    if (limit === undefined || limit === null || limit === Infinity) return true;
    const current = usage.value[key] || 0;
    return current < limit;
  }

  /**
   * @desc Get usage percentage for a given resource action.
   * @param {string} resource - Resource name (e.g. "documents")
   * @param {string} action - Action name (e.g. "create")
   * @returns {number} Percentage 0-100
   */
  function usagePercent(resource, action) {
    const key = `${resource}.${action}`;
    const limit = limits.value[key];
    if (limit === undefined || limit === null || limit === Infinity) return 0;
    if (limit <= 0) return 100;
    const current = usage.value[key] || 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  }

  /**
   * @desc Refresh quota data from the API.
   * @returns {Promise<void>}
   */
  async function refresh() {
    await billingStore.fetchUsage();
  }

  return { plan, period, usage, limits, loading, canDo, usagePercent, refresh };
}

/**
 * Exports.
 */
export default useQuota;
