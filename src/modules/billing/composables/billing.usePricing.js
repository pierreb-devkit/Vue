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
  tabs as staticTabs,
  header as staticHeader,
  halo as staticHalo,
} from '../config/billing.static-content.js';
import { computeMaxAnnualSavingsPct, resolvePricingMode } from '../lib/pricingMath.js';

/**
 * @desc Compose pricing-page state from static config + server config + billing store.
 * @returns {{
 *   mode: import('vue').ComputedRef<'subscription'|'packs'|'both-tabs'>,
 *   plans: import('vue').ComputedRef<Array>,
 *   packs: import('vue').ComputedRef<Array>,
 *   faqs: import('vue').ComputedRef<{ title?: string, subtitle?: string, content: Array<{id: string, question: string, answer: string}> }>,
 *   tabs: import('vue').ComputedRef<{plans?: string, units?: string}>,
 *   maxAnnualSavingsPct: import('vue').ComputedRef<number>,
 *   hasPlans: import('vue').ComputedRef<boolean>,
 *   hasPacks: import('vue').ComputedRef<boolean>,
 *   hasFaqs: import('vue').ComputedRef<boolean>,
 * }}
 */
export function usePricing() {
  const authStore = useAuthStore();
  const billingStore = useBillingStore();

  /**
   * @desc Normalise a static price field to a scalar number.
   *       Accepts a plain number, a legacy { amount, id } object, or null/undefined.
   * @param {number|{amount: number, id: string}|null|undefined} price
   * @returns {number}
   */
  function toAmount(price) {
    if (price == null) return 0;
    if (typeof price === 'object') return Number(price.amount) || 0;
    return Number(price) || 0;
  }

  const plans = computed(() =>
    staticPlans.map((staticPlan) => {
      const stripePlan =
        billingStore.plans.find(
          (p) => p.planId === staticPlan.id || p.name?.toLowerCase() === staticPlan.id,
        ) || {};
      // Resolve scalar prices — supports both modern number format and legacy { amount, id } objects.
      const resolvedMonthly =
        staticPlan.monthlyPrice != null
          ? toAmount(staticPlan.monthlyPrice)
          : stripePlan.stripePriceMonthly
            ? Number(stripePlan.monthlyPrice) || 0
            : 0;
      const resolvedAnnual =
        staticPlan.annualPrice != null
          ? toAmount(staticPlan.annualPrice)
          : stripePlan.stripePriceAnnual
            ? Number(stripePlan.annualPrice) || 0
            : 0;
      return {
        ...staticPlan,
        monthlyPrice: resolvedMonthly,
        annualPrice: resolvedAnnual,
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
  const tabs = computed(() => staticTabs || {});
  const header = computed(() => staticHeader || {});
  const halo = computed(() => staticHalo);

  const hasPlans = computed(() => plans.value.length > 0);
  const hasPacks = computed(() => packs.value.length > 0);
  const hasFaqs = computed(() => Array.isArray(faqs.value?.content) && faqs.value.content.length > 0);

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
    tabs,
    header,
    halo,
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
