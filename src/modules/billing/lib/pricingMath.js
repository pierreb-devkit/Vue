/**
 * Pure pricing helpers — annual savings math, tab/plan lookups and pricing-mode resolution.
 *
 * No Vue dependency. Safe to call from composables, components, or SSR contexts.
 *
 * TAB CONTRACT (see billing.resolveStaticContent.js `normalizeTabs`):
 * every helper below that takes `tabs` expects the normalized tab-entry shape
 * `{ id, label, annualToggle, plans: Array|null, packs: Array|null }`, where a
 * `null` slot means "this tab is not that kind" and is never a devkit default.
 *
 * INVARIANT: plan ids are unique across tabs. A different price is a different
 * Stripe id anyway, so two tabs never legitimately share a plan id. `findPlan`
 * returns the first match in tab order if that invariant is ever broken.
 */

/**
 * @desc Compute the annual savings percentage for one plan.
 * Returns the rounded integer percentage saved when paying annually instead of 12x monthly.
 * Returns 0 when free, when annualPrice is missing, or when annual is not actually cheaper.
 * @param {{ monthlyPrice: number, annualPrice: number|null|undefined }} plan
 * @returns {number} Integer percentage in [0, 100]
 */
export function computeAnnualSavingsPct(plan) {
  const monthly = Number(plan?.monthlyPrice) || 0;
  const annual = Number(plan?.annualPrice) || 0;
  if (monthly <= 0 || annual <= 0) return 0;
  const fullYear = monthly * 12;
  if (annual >= fullYear) return 0;
  return Math.round(((fullYear - annual) / fullYear) * 100);
}

/**
 * @desc Compute the maximum savings percentage across an array of plans.
 * Used by the toggle to display a single representative "Save up to X%" copy.
 * @param {Array<{ monthlyPrice: number, annualPrice: number|null|undefined }>} plans
 * @returns {number} Integer percentage in [0, 100]
 */
export function computeMaxAnnualSavingsPct(plans) {
  if (!Array.isArray(plans) || plans.length === 0) return 0;
  return plans.reduce((max, plan) => {
    const pct = computeAnnualSavingsPct(plan);
    return pct > max ? pct : max;
  }, 0);
}

/**
 * @desc Legacy deep-link hash that targets the packs tab whatever a downstream names it.
 * Four producers emit this static string with no config access (the checkout cancel URL
 * and three in-app CTAs), so hash resolution matches it as an ALIAS before any tab id.
 * @type {string}
 */
const PACKS_HASH_ALIAS = 'units';

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

/**
 * @desc Enrich one static plan with its Stripe-backed runtime pricing.
 *
 * Single match-and-normalize site: every plans collection (whichever tab owns it)
 * runs through this same function against the same `billingStore.plans`, so a plan
 * in tab 3 is priced exactly like a plan in tab 1.
 *
 * Matches the Stripe plan by `planId`, falling back to a case-insensitive `name`
 * match. Static prices win when declared; otherwise the Stripe amount is used when
 * a corresponding Stripe price id exists.
 * @param {Object} staticPlan - Plan entry from static content.
 * @param {Array<Object>} billingPlans - Stripe-backed plans from the billing store.
 * @returns {Object} The plan with scalar prices plus monthlyPriceObject/annualPriceObject.
 */
export function resolvePlanPricing(staticPlan, billingPlans) {
  const candidates = Array.isArray(billingPlans) ? billingPlans : [];
  const stripePlan =
    candidates.find(
      (p) =>
        p.planId === staticPlan.id ||
        (typeof p.name === 'string' && p.name.toLowerCase() === String(staticPlan.id).toLowerCase()),
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
}

/**
 * @desc Flatten every plan declared across all tabs, in tab order.
 *
 * For page-level DISPLAY facts only (is there any paid plan? what is the best annual
 * discount?). Never use the resulting order as a tier ranking — see `findPlan`.
 * @param {Array<Object>} tabs - Normalized tab entries.
 * @returns {Array<Object>} Flat plans array (empty when no tab fills a plans slot).
 */
export function collectPlans(tabs) {
  if (!Array.isArray(tabs)) return [];
  return tabs.flatMap((tab) => (Array.isArray(tab?.plans) ? tab.plans : []));
}

/**
 * @desc Flatten every pack declared across all tabs, in tab order.
 * Used by the account screen, which presents one pack catalogue regardless of
 * how many tabs the pricing page splits them into.
 * @param {Array<Object>} tabs - Normalized tab entries.
 * @returns {Array<Object>} Flat packs array (empty when no tab fills a packs slot).
 */
export function collectPacks(tabs) {
  if (!Array.isArray(tabs)) return [];
  return tabs.flatMap((tab) => (Array.isArray(tab?.packs) ? tab.packs : []));
}

/**
 * @desc Find a plan by id and return it together with the tab that owns it.
 *
 * The owning tab is the point: tier order is only meaningful WITHIN one tab.
 * There is deliberately no global plan order across tabs — comparing a plan in
 * tab 3 against a plan in tab 1 would encode a ranking nobody decided. A CTA on a
 * plan in another tab is a SWITCH, never an upgrade or a downgrade.
 * @param {Array<Object>} tabs - Normalized tab entries.
 * @param {string} id - Plan id to look for.
 * @returns {{ plan: Object, tab: Object }|null} Match with its owning tab, or null.
 */
export function findPlan(tabs, id) {
  if (!Array.isArray(tabs) || !id) return null;
  for (const tab of tabs) {
    if (!Array.isArray(tab?.plans)) continue;
    const plan = tab.plans.find((p) => p?.id === id);
    if (plan) return { plan, tab };
  }
  return null;
}

/**
 * @desc Resolve which tab index a URL hash selects.
 *
 * Resolution order — ALIAS FIRST, deliberately:
 *   1. the legacy `units` alias → the FIRST tab filling a packs slot
 *   2. an exact `tab.id` match
 *   3. 0
 *
 * Alias-first is required, not cosmetic: with id-matching first, a tab that a
 * downstream happened to name `id: 'units'` while holding PLANS would capture every
 * "Buy extras" CTA in the app and land the user on a page with nothing to buy.
 * @param {{ hash: string, tabs: Array<Object> }} input
 * @returns {number} Zero-based tab index, always within range.
 */
export function resolveTabIndexFromHash({ hash, tabs }) {
  if (!Array.isArray(tabs) || tabs.length === 0) return 0;
  const key = String(hash ?? '').replace(/^#/, '');
  if (!key) return 0;

  if (key === PACKS_HASH_ALIAS) {
    const packsIndex = tabs.findIndex((tab) => Array.isArray(tab?.packs));
    if (packsIndex !== -1) return packsIndex;
  }

  const idIndex = tabs.findIndex((tab) => tab?.id === key);
  return idIndex === -1 ? 0 : idIndex;
}

/**
 * @desc Set of valid pricingMode strings. Module-level to avoid re-allocation per call.
 * @type {Set<string>}
 */
const KNOWN_PRICING_MODES = new Set(['subscription', 'packs', 'both-tabs']);

/**
 * @desc Resolve the effective pricing display mode.
 *
 * When `explicit` is one of the known modes, return it directly. Otherwise, more
 * than one configured tab means the tab bar is needed, whatever those tabs sell —
 * checked BEFORE the legacy `hasPlans && hasPacks` heuristic so that two plans tabs
 * can't silently resolve to a single-grid mode and hide the second tab entirely.
 * Last, derive a legacy-compatible mode from the previous server-side flag
 * (`meterMode`) + the presence of packs/plans.
 *
 * Modes:
 *   - 'subscription'  : show one plans grid (no packs section, no tabs)
 *   - 'packs'         : show one packs grid (no plans, no toggle)
 *   - 'both-tabs'     : glass tab bar over N tabs (uses HomeTabsComponent)
 *
 * @param {{ explicit: string|null, meterMode: boolean, hasPlans: boolean, hasPacks: boolean, tabCount?: number }} input
 * @returns {'subscription'|'packs'|'both-tabs'}
 * @throws {Error} When `explicit` is provided but not in the known modes set.
 */
export function resolvePricingMode({ explicit, meterMode, hasPlans, hasPacks, tabCount = 0 }) {
  if (explicit) {
    if (!KNOWN_PRICING_MODES.has(explicit)) {
      throw new Error(`unknown pricingMode: ${explicit}. Expected one of: ${Array.from(KNOWN_PRICING_MODES).join(', ')}`);
    }
    return explicit;
  }
  // More than one tab always needs the tab bar, whatever the tabs sell.
  if (tabCount > 1) return 'both-tabs';
  // Legacy fallback — preserve current behavior for downstream projects that have not opted in.
  if (meterMode && hasPlans && hasPacks) return 'both-tabs';
  if (!hasPlans && hasPacks) return 'packs';
  return 'subscription';
}
