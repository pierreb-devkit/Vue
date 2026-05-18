// src/modules/billing/lib/billing.resolveStaticContent.js
/**
 * Resolver — single source of truth for billing marketing content.
 *
 * Resolution order, per key — present in config (even if `null`) wins; absent → devkit default:
 *   1. config.billing.staticContent[key]  (downstream project config — wins even when null)
 *   2. devkit billing.static-content.js    (generic default / fallback, only when key is absent)
 *
 * Downstream projects customize pricing purely via project config
 * (src/config/defaults/<project>.config.js -> config.billing.staticContent).
 * They must NOT replace billing.static-content.js (stack-managed, wiped by
 * /update-stack --theirs).
 *
 * Key tiers:
 *   - Structural collections (plans, packs): after presence resolution, coerce to devkit
 *     default when the resolved value is not an array. Prevents consumer .map()/.length
 *     crashes when a downstream explicitly sets the key to null or a non-array value.
 *   - Structural object (faqs): coerce to devkit default when the resolved value is not
 *     a non-null object. Prevents consumer property-access crashes on null.
 *   - Display-optional (pricingMode, tabs, header, halo): pure presence-check — explicit
 *     null is a legitimate suppression signal and consumers tolerate it gracefully.
 */
import config from '../../../lib/services/config.js';
import {
  pricingMode as dPricingMode,
  plans as dPlans,
  packs as dPacks,
  faqs as dFaqs,
  tabs as dTabs,
  header as dHeader,
  halo as dHalo,
} from '../config/billing.static-content.js';

/**
 * @desc Resolve effective billing static content (project override or devkit default), per key.
 * @returns {{ pricingMode: string, plans: Array, packs: Array, faqs: object, tabs: object, header: object, halo: object|null }}
 */
export function resolveStaticContent() {
  const o = config?.billing?.staticContent ?? {};

  // Structural collections — coerce null/non-array to devkit default (crash-safe).
  const rPlans = 'plans' in o ? o.plans : dPlans;
  const rPacks = 'packs' in o ? o.packs : dPacks;

  // Structural object — coerce null/non-object to devkit default (crash-safe).
  const rFaqs = 'faqs' in o ? o.faqs : dFaqs;

  return {
    // Display-optional: pure presence-check — explicit null honored by consumers.
    pricingMode: 'pricingMode' in o ? o.pricingMode : dPricingMode,
    tabs: 'tabs' in o ? o.tabs : dTabs,
    header: 'header' in o ? o.header : dHeader,
    halo: 'halo' in o ? o.halo : dHalo,
    // Structural: fall back to devkit default when resolved value is not the expected type.
    plans: Array.isArray(rPlans) ? rPlans : dPlans,
    packs: Array.isArray(rPacks) ? rPacks : dPacks,
    faqs: rFaqs && typeof rFaqs === 'object' ? rFaqs : dFaqs,
  };
}
