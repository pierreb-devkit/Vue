// src/modules/billing/lib/billing.resolveStaticContent.js
/**
 * Resolver — single source of truth for billing marketing content.
 *
 * Resolution order, per key:
 *   1. config.billing.staticContent[key]  (downstream project config)
 *   2. devkit billing.static-content.js    (generic default / fallback)
 *
 * Downstream projects customize pricing purely via project config
 * (src/config/defaults/<project>.config.js -> config.billing.staticContent).
 * They must NOT replace billing.static-content.js (stack-managed, wiped by
 * /update-stack --theirs).
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
  return {
    pricingMode: o.pricingMode ?? dPricingMode,
    plans: o.plans ?? dPlans,
    packs: o.packs ?? dPacks,
    faqs: o.faqs ?? dFaqs,
    tabs: o.tabs ?? dTabs,
    header: o.header ?? dHeader,
    halo: o.halo ?? dHalo,
  };
}

export default { resolveStaticContent };
