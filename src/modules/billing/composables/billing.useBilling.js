/**
 * Module dependencies.
 */
import { computed } from 'vue';
import { useBillingStore } from '../stores/billing.store';

/**
 * @desc Composable exposing plan-checking helpers for billing feature gates.
 * @returns {{ currentPlan: import('vue').ComputedRef<string>, isPlanActive: import('vue').ComputedRef<boolean>, hasPlan: (...plans: string[]) => boolean }}
 */
export function useBilling() {
  const billingStore = useBillingStore();

  const currentPlan = computed(() => billingStore.subscription?.plan || 'free');
  const isPlanActive = computed(() => billingStore.subscription?.status === 'active');

  /**
   * @desc Check whether the current subscription plan matches any of the given plans.
   * @param {...string} plans - Plan names to check against
   * @returns {boolean} True if the current plan is included
   */
  const hasPlan = (...plans) => plans.includes(currentPlan.value);

  return { hasPlan, isPlanActive, currentPlan };
}

/**
 * Exports.
 */
export default useBilling;
