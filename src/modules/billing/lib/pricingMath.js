/**
 * @fileoverview Pure pricing helpers — savings math and mode resolution.
 * No Vue dependency. Safe to call from composables, components, or SSR contexts.
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
 * @desc Resolve the effective pricing display mode.
 *
 * When `explicit` is one of the known modes, return it directly.
 * Otherwise, derive a legacy-compatible mode from the previous server-side flag
 * (`meterMode`) + the presence of packs/plans in static config.
 *
 * Modes:
 *   - 'subscription'  : show plans grid only (no packs section, no tabs)
 *   - 'packs'         : show packs grid only (no plans, no toggle)
 *   - 'both-tabs'     : glass tabs Plans / Units (uses HomeTabsComponent — only "both" layout)
 *
 * @param {{ explicit: string|null, meterMode: boolean, hasPlans: boolean, hasPacks: boolean }} input
 * @returns {'subscription'|'packs'|'both-tabs'}
 * @throws {Error} When `explicit` is provided but not in the known modes set.
 */
export function resolvePricingMode({ explicit, meterMode, hasPlans, hasPacks }) {
  const known = new Set(['subscription', 'packs', 'both-tabs']);
  if (explicit) {
    if (!known.has(explicit)) {
      throw new Error(`unknown pricingMode: ${explicit}. Expected one of: ${Array.from(known).join(', ')}`);
    }
    return explicit;
  }
  // Legacy fallback — preserve current behavior for downstream projects that have not opted in.
  if (meterMode && hasPlans && hasPacks) return 'both-tabs';
  if (!hasPlans && hasPacks) return 'packs';
  return 'subscription';
}
