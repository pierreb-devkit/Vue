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
    pricingMode: 'pricingMode' in o ? o.pricingMode : dPricingMode,
    plans: 'plans' in o ? o.plans : dPlans,
    packs: 'packs' in o ? o.packs : dPacks,
    faqs: 'faqs' in o ? o.faqs : dFaqs,
    tabs: 'tabs' in o ? o.tabs : dTabs,
    header: 'header' in o ? o.header : dHeader,
    halo: 'halo' in o ? o.halo : dHalo,
  };
}
