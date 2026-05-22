/**
 * Billing module — static marketing content (devkit defaults).
 *
 * Contains plan copy, pack definitions, pricing-mode hint and FAQ entries.
 * Downstream projects override these with their own branded content.
 * No secrets or environment-specific values belong here.
 *
 * Schema (downstream contract):
 *   - pricingMode  : 'subscription' | 'packs' | 'both-tabs' | null
 *                    When null, mode is derived from server `meterMode` + presence of packs.
 *   - plans        : Plan[]
 *   - packs        : Pack[]
 *   - faqs         : { title?: string, subtitle?: string, content: FAQ[] }
 *
 * Plan shape (V4 — unified with packs):
 *   {
 *     id, title, subtitle, highlight, badge, cta,
 *     monthlyPrice?, annualPrice?,         // optional raw numbers — when omitted card shows error or hides price
 *     info?: string|null,                  // ops-eval / per-cycle quota line, shown between CTA and features
 *     features: [{ icon, color, text }],   // flat list, icon (fa-solid fa-*) + Vuetify color + label
 *     meta?: object,                       // free-form per-plan metadata (Stripe IDs, quotas, etc.)
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
 * @desc Marketing plans — devkit defaults. Downstream projects replace this whole array.
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
 * @desc Extra credit packs — devkit demo defaults (visual QA for the redesign PR).
 * Downstream projects override this fully with their own marketing copy and Stripe pack IDs.
 * The devkit demo is safe because each downstream project owns its own static-content.js
 * (it is a downstream-owned file, not synced via /update-stack).
 *
 * Pack shape (extended):
 *   {
 *     packId: string,
 *     label: string,
 *     priceUsd: number,
 *     meterUnits: number,
 *     featureSections?: [{                 // OPTIONAL — same shape as plan featureSections
 *       title?: string,
 *       items: [{ text, icon?, iconColor? }]
 *     }],
 *   }
 *
 * @type {Array<Object>}
 */
export const packs = [
  {
    packId: 'demo_small',
    label: 'Small Pack',
    priceUsd: 9,
    meterUnits: 5000,
    featureSections: [
      {
        title: null,
        items: [
          { text: '~50 typical scrap runs', icon: 'fa-solid fa-spider' },
          { text: '~20 autofix sessions', icon: 'fa-solid fa-wand-magic-sparkles' },
          { text: 'Never expires (24mo)', icon: 'fa-solid fa-infinity' },
        ],
      },
    ],
  },
  {
    packId: 'demo_medium',
    label: 'Medium Pack',
    priceUsd: 25,
    meterUnits: 20000,
    featureSections: [
      {
        title: null,
        items: [
          { text: '~200 typical scrap runs', icon: 'fa-solid fa-spider' },
          { text: '~80 autofix sessions', icon: 'fa-solid fa-wand-magic-sparkles' },
          { text: 'Never expires (24mo)', icon: 'fa-solid fa-infinity' },
        ],
      },
    ],
  },
  {
    packId: 'demo_large',
    label: 'Large Pack',
    priceUsd: 99,
    meterUnits: 100000,
    featureSections: [
      {
        title: null,
        items: [
          { text: '~1,000 typical scrap runs', icon: 'fa-solid fa-spider' },
          { text: '~400 autofix sessions', icon: 'fa-solid fa-wand-magic-sparkles' },
          { text: 'Best value (saves ~10%)', icon: 'fa-solid fa-tag', iconColor: 'success' },
          { text: 'Never expires (24mo)', icon: 'fa-solid fa-infinity' },
        ],
      },
    ],
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
    tabs,
    header,
    halo,
  },
};
