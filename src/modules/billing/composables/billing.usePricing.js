/**
 * usePricing composable — central resolver for the pricing page.
 *
 * Combines:
 *   - Server-side config (auth.serverConfig.billing) — meterMode legacy flag
 *   - Static-content (config/billing.static-content.js) — plans, packs, faqs, pricingMode hint
 *   - Stripe-backed runtime data (billingStore.plans) — fills in price IDs after fetch
 *
 * Returns reactive refs the view consumes to drive layout and copy.
 */
import { computed } from 'vue';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import {
  pricingMode as staticPricingMode,
  plans as staticPlans,
  packs as staticPacks,
  faqs as staticFaqs,
} from '../config/billing.static-content.js';
import { computeMaxAnnualSavingsPct, resolvePricingMode } from '../lib/pricingMath.js';

/**
 * @desc Compose pricing-page state from static config + server config + billing store.
 * @returns {{
 *   mode: import('vue').ComputedRef<'subscription'|'packs'|'both-tabs'>,
 *   plans: import('vue').ComputedRef<Array>,
 *   packs: import('vue').ComputedRef<Array>,
 *   faqs: import('vue').ComputedRef<Array>,
 *   maxAnnualSavingsPct: import('vue').ComputedRef<number>,
 *   hasPlans: import('vue').ComputedRef<boolean>,
 *   hasPacks: import('vue').ComputedRef<boolean>,
 *   hasFaqs: import('vue').ComputedRef<boolean>,
 * }}
 */
export function usePricing() {
  const authStore = useAuthStore();
  const billingStore = useBillingStore();

  const plans = computed(() =>
    staticPlans.map((staticPlan) => {
      const stripePlan =
        billingStore.plans.find(
          (p) => p.planId === staticPlan.id || p.name?.toLowerCase() === staticPlan.id,
        ) || {};
      return {
        ...staticPlan,
        monthlyPrice:
          staticPlan.monthlyPrice ??
          (stripePlan.stripePriceMonthly ? stripePlan.monthlyPrice : 0),
        annualPrice:
          staticPlan.annualPrice ??
          (stripePlan.stripePriceAnnual ? stripePlan.annualPrice : 0),
        monthlyPriceObject: stripePlan.stripePriceMonthly
          ? { amount: stripePlan.monthlyPrice, id: stripePlan.stripePriceMonthly }
          : null,
        annualPriceObject: stripePlan.stripePriceAnnual
          ? { amount: stripePlan.annualPrice, id: stripePlan.stripePriceAnnual }
          : null,
      };
    }),
  );

  const packs = computed(() => staticPacks);
  const faqs = computed(() => staticFaqs);

  const hasPlans = computed(() => plans.value.length > 0);
  const hasPacks = computed(() => packs.value.length > 0);
  const hasFaqs = computed(() => faqs.value.length > 0);

  const meterMode = computed(() => authStore.serverConfig?.billing?.meterMode === true);

  const mode = computed(() =>
    resolvePricingMode({
      explicit: staticPricingMode,
      meterMode: meterMode.value,
      hasPlans: hasPlans.value,
      hasPacks: hasPacks.value,
    }),
  );

  const maxAnnualSavingsPct = computed(() => computeMaxAnnualSavingsPct(plans.value));

  return {
    mode,
    plans,
    packs,
    faqs,
    maxAnnualSavingsPct,
    hasPlans,
    hasPacks,
    hasFaqs,
  };
}

/**
 * Exports.
 */
export default usePricing;
