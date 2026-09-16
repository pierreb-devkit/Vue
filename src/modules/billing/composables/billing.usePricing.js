/**
 * usePricing composable — central resolver for the pricing page.
 *
 * Combines:
 *   - Server-side config (auth.serverConfig.billing) — meterMode legacy flag
 *   - Static-content (config/billing.static-content.js) — tabs, faqs, pricingMode hint
 *   - Stripe-backed runtime data (billingStore.plans) — fills in price IDs after fetch
 *
 * `tabs` is the single content source: each tab carries its own plans or packs, and
 * every plans collection — whichever tab owns it — is enriched by the same
 * `resolvePlanPricing` against the same `billingStore.plans`.
 *
 * Returns reactive refs the view consumes to drive layout and copy.
 */
import { computed } from 'vue';
import { useAuthStore } from '../../auth/stores/auth.store.js';
import { useBillingStore } from '../stores/billing.store.js';
import { resolveStaticContent } from '../lib/billing.resolveStaticContent.js';
import {
  computeMaxAnnualSavingsPct,
  resolvePricingMode,
  resolvePlanPricing,
  collectPlans,
  collectPacks,
} from '../lib/pricingMath.js';

const {
  pricingMode: staticPricingMode,
  tabs: staticTabs,
  faqs: staticFaqs,
  header: staticHeader,
  halo: staticHalo,
} = resolveStaticContent();

/**
 * @desc Compose pricing-page state from static config + server config + billing store.
 * @returns {{
 *   mode: import('vue').ComputedRef<'subscription'|'packs'|'both-tabs'>,
 *   tabs: import('vue').ComputedRef<Array<{id: string, label: string, annualToggle: boolean, plans: Array|null, packs: Array|null}>>,
 *   allPlans: import('vue').ComputedRef<Array>,
 *   allPacks: import('vue').ComputedRef<Array>,
 *   faqs: import('vue').ComputedRef<{ title?: string, subtitle?: string, content: Array<{id: string, question: string, answer: string}> }>,
 *   header: import('vue').ComputedRef<object>,
 *   halo: import('vue').ComputedRef<object|null>,
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
   * Tabs with every plans slot enriched from Stripe. A `null` slot stays `null` —
   * it means "this tab is not a plans tab", never "no plans yet".
   */
  const tabs = computed(() =>
    staticTabs.map((tab) => ({
      ...tab,
      plans: Array.isArray(tab.plans)
        ? tab.plans.map((staticPlan) => resolvePlanPricing(staticPlan, billingStore.plans))
        : null,
    })),
  );

  // Page-level DISPLAY facts across every tab. Never a tier ranking — see findPlan().
  const allPlans = computed(() => collectPlans(tabs.value));
  const allPacks = computed(() => collectPacks(tabs.value));

  const faqs = computed(() => staticFaqs);
  const header = computed(() => staticHeader || {});
  const halo = computed(() => staticHalo);

  const hasPlans = computed(() => allPlans.value.length > 0);
  const hasPacks = computed(() => allPacks.value.length > 0);
  const hasFaqs = computed(() => Array.isArray(faqs.value?.content) && faqs.value.content.length > 0);

  const meterMode = computed(() => authStore.serverConfig?.billing?.meterMode === true);

  const mode = computed(() =>
    resolvePricingMode({
      explicit: staticPricingMode,
      meterMode: meterMode.value,
      hasPlans: hasPlans.value,
      hasPacks: hasPacks.value,
      tabCount: tabs.value.length,
    }),
  );

  const maxAnnualSavingsPct = computed(() => computeMaxAnnualSavingsPct(allPlans.value));

  return {
    mode,
    tabs,
    allPlans,
    allPacks,
    faqs,
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
