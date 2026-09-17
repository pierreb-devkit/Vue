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
 *   - Structural collection (tabs): the single content source for the pricing page.
 *     After presence resolution, coerce to the devkit default when the resolved value
 *     is not a non-empty array. Prevents consumer .map()/.length crashes, exactly as
 *     the former top-level plans/packs collections did.
 *   - Structural object (faqs, signupGrant): coerce to devkit default when the resolved
 *     value is not a non-null object. Prevents consumer property-access crashes on null.
 *   - Display-optional (pricingMode, header, halo): pure presence-check — explicit
 *     null is a legitimate suppression signal and consumers tolerate it gracefully.
 *
 * NOTE the tier boundary INSIDE a tab entry: a tab's `plans`/`packs` slots are NOT
 * treated like the structural collection above. A `null` slot is a structural
 * statement ("this tab is not that kind") and is honoured verbatim — coercing it to
 * the devkit default would make every packs tab silently render the demo plans.
 */
import config from '../../../lib/services/config.js';
import {
  pricingMode as dPricingMode,
  faqs as dFaqs,
  signupGrant as dSignupGrant,
  tabs as dTabs,
  header as dHeader,
  halo as dHalo,
} from '../config/billing.static-content.js';

/**
 * @desc Normalize configured pricing tabs into the canonical tab-entry shape.
 *
 * THE SINGLE NORMALIZATION SITE. Several consumers destructure `resolveStaticContent()`
 * at MODULE LOAD (usePricing, the account screen, the upgrade prompt), so a second
 * normalization site would drift from this one silently.
 *
 * Contract, per entry:
 *   - `plans` / `packs` are content SLOTS. An array is kept verbatim; anything else
 *     (including `null`) resolves to `null`, meaning "this tab is not that kind".
 *     A slot is NEVER back-filled with the devkit default.
 *   - Both slots filled is a config mistake: warn and keep the plans slot. This runs at
 *     module load, where the contract is crash-safe coercion — so it warns, never throws.
 *   - `annualToggle` is display-optional: absent or falsy ⇒ the annual toggle is disabled
 *     while that tab is active.
 *
 * @param {Array<Object>} raw - Configured tabs (project override or devkit default).
 * @param {Array<Object>} defaultTabs - Devkit default tabs, used when `raw` is unusable.
 * @param {boolean} [wasProvided] - True when the caller's config explicitly set the `tabs`
 *   key (even to an unusable value). Absent-key callers omit this, which keeps the
 *   devkit-default path silent — only an explicit-but-unusable value warns.
 * @returns {Array<{id: string, label: string, annualToggle: boolean, plans: Array|null, packs: Array|null}>}
 */
export function normalizeTabs(raw, defaultTabs, wasProvided) {
  const usable = Array.isArray(raw) && raw.length > 0;
  if (wasProvided && !usable) {
    // Explicitly configured but unusable (e.g. the pre-migration `{ plans, units }` object,
    // or an empty array) — silently rendering the devkit demo catalogue would be worse than
    // absent config, so this one warns while the absent-key path stays silent.
    console.warn(
      '[billing] config.billing.staticContent.tabs is not a non-empty array — falling back to the devkit default catalogue. Move your plans/packs into tabs[] entries; see MIGRATIONS.md.',
    );
  }
  const source = usable ? raw : defaultTabs;
  if (!Array.isArray(source)) return [];

  return source
    .filter((tab) => tab && typeof tab === 'object')
    .map((tab, index) => {
      const plans = Array.isArray(tab.plans) ? tab.plans : null;
      let packs = Array.isArray(tab.packs) ? tab.packs : null;

      if (plans && packs) {
        // Ambiguous content kind — the filled slot is what derives it, so two filled
        // slots have no answer. Keep plans and carry on (module-load, crash-safe).
        console.warn(
          `[billing] pricing tab "${tab.id ?? index}" fills both the plans and the packs slot; keeping plans. A tab carries exactly one kind of content.`,
        );
        packs = null;
      }

      return {
        id: typeof tab.id === 'string' && tab.id ? tab.id : String(index),
        label: typeof tab.label === 'string' ? tab.label : '',
        annualToggle: !!tab.annualToggle,
        plans,
        packs,
      };
    });
}

/**
 * @desc Resolve effective billing static content (project override or devkit default), per key.
 * @returns {{ pricingMode: string, tabs: Array<Object>, faqs: object, signupGrant: {label: string}, header: object, halo: object|null }}
 */
export function resolveStaticContent() {
  const o = config?.billing?.staticContent ?? {};

  // Structural collection — coerce a null/non-array/empty value to the devkit default.
  const rTabs = 'tabs' in o ? o.tabs : dTabs;

  // Structural objects — coerce null/non-object to devkit default (crash-safe).
  const rFaqs = 'faqs' in o ? o.faqs : dFaqs;
  const rSignupGrant = 'signupGrant' in o ? o.signupGrant : dSignupGrant;

  return {
    // Display-optional: pure presence-check — explicit null honored by consumers.
    pricingMode: 'pricingMode' in o ? o.pricingMode : dPricingMode,
    header: 'header' in o ? o.header : dHeader,
    halo: 'halo' in o ? o.halo : dHalo,
    // Structural: fall back to devkit default when resolved value is not the expected type.
    // `'tabs' in o` tells normalizeTabs whether an unusable value was explicitly configured
    // (warn) versus simply absent (silent — every default install would otherwise log noise).
    tabs: normalizeTabs(rTabs, dTabs, 'tabs' in o),
    faqs: rFaqs && typeof rFaqs === 'object' ? rFaqs : dFaqs,
    signupGrant: rSignupGrant && typeof rSignupGrant === 'object' ? rSignupGrant : dSignupGrant,
  };
}
