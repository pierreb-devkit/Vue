/**
 * Billing module — static marketing content (devkit generic defaults).
 *
 * Contains plan copy, pack definitions, pricing-mode hint and FAQ entries.
 * This file is STACK-MANAGED — do NOT edit it to add downstream/project copy,
 * it is overwritten wholesale by `/update-stack --theirs`. Downstream projects
 * customize via `config.billing.staticContent` (project config, e.g.
 * `src/config/defaults/<project>.config.js`), resolved per-key by
 * `billing.resolveStaticContent.js` (project value wins when present, even
 * `null`, for DISPLAY-OPTIONAL keys — pricingMode/tabs/header/halo. For the
 * STRUCTURAL keys below — plans/packs/faqs — an explicit `null` (or non-array/
 * non-object) is coerced back to the devkit default, since consumers `.map()`/
 * read properties on these unconditionally; the devkit default here is only
 * the fallback). No secrets or environment-specific values belong in either
 * layer.
 *
 * Schema (per-key resolver contract — see billing.resolveStaticContent.js):
 *   - pricingMode  : 'subscription' | 'packs' | 'both-tabs' | null
 *                    When null, mode is derived from server `meterMode` + presence of packs.
 *   - plans        : Plan[]
 *   - packs        : Pack[]
 *   - faqs         : { title?: string, subtitle?: string, content: FAQ[] }
 *   - signupGrant  : { label: string }
 *                    Copy fragment for the meter-mode "signup grant depleted" prompt
 *                    (billing.upgradePrompt.component.vue), e.g. used as
 *                    `You used your ${signupGrant.label}.`. Structural key — an explicit
 *                    `null` (or non-object) is coerced back to the devkit default, same as
 *                    plans/packs/faqs, since the consumer reads `.label` unconditionally.
 *
 * Plan shape (V4 — unified with packs):
 *   {
 *     id, title, subtitle, highlight, badge, cta,
 *     monthlyPrice?, annualPrice?,         // optional raw numbers — when omitted card shows error or hides price
 *     info?: string|null,                  // ops-eval / per-cycle quota line, shown between CTA and features
 *     features: [{ icon, color, text }],   // flat list, icon (fa-solid fa-*) + Vuetify color + label
 *     sections?: Section[],                // OPTIONAL grouped, inheritance-aware feature sections (see below).
 *                                          // When present, REPLACES the flat `features` list on the card.
 *     inheritsFrom?: string|null,          // OPTIONAL id of the parent plan. The view resolves it to the
 *                                          // parent's `title` and the card renders one
 *                                          // "Everything in {parent title}, plus" heading above the sections.
 *     meta?: object,                       // free-form per-plan metadata (Stripe IDs, quotas, etc.)
 *   }
 *
 * Section shape (grouped feature list — opt-in, fully backward-compatible):
 *   {
 *     title?: string,                      // section heading, e.g. "Core", "Collaboration"
 *     items: [{
 *       text,                              // required label
 *       icon?: string,                     // fa-solid fa-* (defaults to fa-solid fa-check)
 *       iconColor?: string,                // Vuetify color name OR hex. Canonical key for grouped
 *                                          // items; the flat-list `color` key is accepted as a
 *                                          // back-compat alias so a flat→grouped migration keeps colors.
 *       tooltip?: string,                  // optional info-icon tooltip
 *       highlight?: boolean,               // emphasised row
 *       enabled?: boolean,                 // `false` greys the row out (e.g. "not in this plan")
 *     }],
 *   }
 *   Inheritance is PLAN-level only: set `plan.inheritsFrom` to render ONE
 *   "Everything in {parent title}, plus" heading above the sections. Sections themselves carry
 *   no inheritance heading — the card owns it.
 *
 * Minimal grouped-plan example (do NOT replace the flat demo plans below — kept for
 * downstream fallback parity; downstreams opt in by authoring `sections` in their own content):
 *   {
 *     id: 'pro', title: 'Pro', subtitle: 'For professionals', cta: 'Get Started',
 *     monthlyPrice: 49, annualPrice: 490,
 *     inheritsFrom: 'starter',   // → card renders ONE "Everything in Starter, plus" heading
 *     sections: [
 *       // First (untitled) section lists the inherited features, right under the plan-level heading.
 *       { items: [{ text: 'Unlimited projects', icon: 'fa-solid fa-folder' }] },
 *       { title: 'Pro only', items: [
 *         { text: 'Advanced analytics', icon: 'fa-solid fa-chart-line', iconColor: 'warning', highlight: true },
 *         { text: 'SSO', enabled: false },
 *       ] },
 *     ],
 *   }
 *
 * FAQ shape:
 *   { id, question, answer }
 */

/**
 * @desc Default pricing mode for the devkit example.
 * Set to 'both-tabs' so the devkit dev server shows the full multi-mode UX
 * out of the box (useful for visual QA of the redesign PR).
 * Downstream projects override this with their own value (or 'subscription' / 'packs' / null).
 * @type {'subscription'|'packs'|'both-tabs'|null}
 */
export const pricingMode = 'both-tabs';

/**
 * @desc Marketing plans — devkit generic defaults. Downstream projects do NOT edit this
 * array directly — customize via `config.billing.staticContent.plans` (project config),
 * resolved by `billing.resolveStaticContent.js`. This file is stack-managed and is
 * wiped by `/update-stack --theirs`.
 * @type {Array<Object>}
 */
export const plans = [
  {
    id: 'free',
    title: 'Free',
    subtitle: 'Discover the platform',
    highlight: false,
    badge: null,
    cta: 'Get Started',
    monthlyPrice: 0,
    annualPrice: 0,
    info: '100 operations / week',
    features: [
      { icon: 'fa-solid fa-folder', color: 'primary', text: '1 project' },
      { icon: 'fa-solid fa-users', color: 'primary', text: '3 team members' },
      { icon: 'fa-solid fa-envelope', color: 'primary', text: 'Community support' },
    ],
  },
  {
    id: 'starter',
    title: 'Starter',
    subtitle: 'For growing teams',
    highlight: false,
    badge: null,
    cta: 'Get Started',
    monthlyPrice: 19,
    annualPrice: 190,
    info: '500 operations / week',
    features: [
      { icon: 'fa-solid fa-folder', color: 'success', text: '10 projects' },
      { icon: 'fa-solid fa-users', color: 'primary', text: '10 team members' },
      { icon: 'fa-solid fa-envelope', color: 'primary', text: 'Email support' },
    ],
  },
  {
    id: 'pro',
    title: 'Pro',
    subtitle: 'For professionals',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Get Started',
    monthlyPrice: 49,
    annualPrice: 490,
    info: '2,000 operations / week',
    features: [
      { icon: 'fa-solid fa-folder', color: 'success', text: 'Unlimited projects' },
      { icon: 'fa-solid fa-users', color: 'primary', text: 'Unlimited members' },
      { icon: 'fa-solid fa-headset', color: 'primary', text: 'Priority support' },
      { icon: 'fa-solid fa-chart-line', color: 'warning', text: 'Advanced analytics' },
    ],
  },
];

/**
 * @desc Extra credit packs — devkit generic demo defaults (V4 unified card schema,
 * same shape as `plans` — see BillingCardComponent's ITEM SCHEMA docblock). This file
 * is stack-managed — downstream projects do NOT edit it directly, they customize via
 * `config.billing.staticContent.packs` (project config), resolved per-key by
 * `billing.resolveStaticContent.js`. Direct edits here are wiped by `/update-stack --theirs`.
 *
 * Pack shape (V4 — unified with plans):
 *   {
 *     id, title, subtitle, highlight, badge, cta,
 *     price: { amount: string, period: string|null },  // packs are one-time — period is always null
 *     info?: string|null,
 *     features: [{ icon, color, text }],                // flat list, same as plan features
 *     meta?: { packId, priceUsd, meterUnits },           // raw Stripe-facing values. Consumers
 *                                                         // needing the legacy { packId, label,
 *                                                         // priceUsd, meterUnits } shape (e.g. the
 *                                                         // extras-checkout modal) read them from
 *                                                         // here; `id` is the canonical identifier
 *                                                         // and MUST equal `meta.packId`.
 *   }
 *
 * @type {Array<Object>}
 */
export const packs = [
  {
    id: 'demo_small',
    title: 'Small Pack',
    subtitle: 'Quick top-up',
    highlight: false,
    badge: null,
    price: { amount: '$9.00', period: null },
    cta: 'Buy Small Pack',
    info: null,
    features: [
      { icon: 'fa-solid fa-spider', color: 'primary', text: '~50 typical compute jobs' },
      { icon: 'fa-solid fa-wand-magic-sparkles', color: 'primary', text: '~20 automation runs' },
      { icon: 'fa-solid fa-infinity', color: 'primary', text: 'Never expires' },
    ],
    meta: { packId: 'demo_small', priceUsd: 9, meterUnits: 5000 },
  },
  {
    id: 'demo_medium',
    title: 'Medium Pack',
    subtitle: 'For sustained work',
    highlight: false,
    badge: null,
    price: { amount: '$25.00', period: null },
    cta: 'Buy Medium Pack',
    info: null,
    features: [
      { icon: 'fa-solid fa-spider', color: 'primary', text: '~200 typical compute jobs' },
      { icon: 'fa-solid fa-wand-magic-sparkles', color: 'primary', text: '~80 automation runs' },
      { icon: 'fa-solid fa-infinity', color: 'primary', text: 'Never expires' },
    ],
    meta: { packId: 'demo_medium', priceUsd: 25, meterUnits: 20000 },
  },
  {
    id: 'demo_large',
    title: 'Large Pack',
    subtitle: 'Best value for heavy usage',
    highlight: true,
    badge: 'Best Value',
    price: { amount: '$99.00', period: null },
    cta: 'Buy Large Pack',
    info: null,
    features: [
      { icon: 'fa-solid fa-spider', color: 'primary', text: '~1,000 typical compute jobs' },
      { icon: 'fa-solid fa-wand-magic-sparkles', color: 'primary', text: '~400 automation runs' },
      { icon: 'fa-solid fa-tag', color: 'success', text: 'Best per-unit value' },
      { icon: 'fa-solid fa-infinity', color: 'primary', text: 'Never expires' },
    ],
    meta: { packId: 'demo_large', priceUsd: 99, meterUnits: 100000 },
  },
];

/**
 * @desc FAQ section content. `title` and `subtitle` are optional; any falsy value (including
 * `null` or empty string) triggers the view's hardcoded fallback:
 * `'Frequently asked questions'` for title, `null` (no subtitle rendered) for subtitle.
 * @type {{ title?: string|null, subtitle?: string|null, content: Array<{id: string, question: string, answer: string}> }}
 */
export const faqs = {
  title: 'Frequently asked questions',
  subtitle: null,
  content: [
    {
      id: 'demo-billing-cycle',
      question: 'When am I billed?',
      answer: 'Subscriptions are billed at the start of each cycle (monthly or annually). Annual saves you up to 17%.',
    },
    {
      id: 'demo-cancel',
      question: 'Can I cancel anytime?',
      answer: 'Yes. Cancel from your account settings — you keep access until the end of the current billing period.',
    },
    {
      id: 'demo-extra-packs',
      question: 'What are extra packs?',
      answer: 'One-shot purchases that top up your usage on top of your subscription. They never expire (within 24 months).',
    },
  ],
};

/**
 * @desc Copy fragment for the meter-mode signup-grant-depleted prompt
 * (billing.upgradePrompt.component.vue). Downstream projects override via
 * `config.billing.staticContent.signupGrant` to describe their own grant's size and
 * unit, e.g. `{ label: '2,000-credit one-shot grant' }`. This devkit default stays
 * generic — no specific quantity or product vocabulary.
 * @type {{ label: string }}
 */
export const signupGrant = {
  label: 'one-shot compute grant',
};

/**
 * @desc Configurable tab labels (used in 'both-tabs' mode).
 * This devkit default ships `plans: 'Plans'` / `units: 'Extras'`.
 * Downstream projects can override either or both labels per project.
 * The view's hardcoded fallback (`'Plans'` / `'Units'`) only applies when
 * the field is entirely absent or falsy — it is not reached under the devkit default.
 * @type {{ plans?: string, units?: string }}
 */
export const tabs = {
  plans: 'Plans',
  units: 'Extras',
};

/**
 * @desc Page header copy. Any falsy value (including `null`, `undefined`, or empty string)
 * triggers the view's hardcoded English fallback
 * (`'Pricing'` / `'Choose the plan that fits your needs.'`).
 * @type {{ title?: string|null, subtitle?: string|null }}
 */
export const header = {
  title: null,
  subtitle: null,
};

/**
 * @desc Hero halo colors per theme. When null, the view uses default brand palettes.
 * @type {{ light?: {backgroundColors: string[], haloColors: string[]}, dark?: {backgroundColors: string[], haloColors: string[]} } | null}
 */
export const halo = null;

/**
 * Exports.
 */
export default {
  billing: {
    pricingMode,
    plans,
    packs,
    faqs,
    signupGrant,
    tabs,
    header,
    halo,
  },
};
