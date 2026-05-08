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
 * Plan shape (extended):
 *   {
 *     id, name, tagline, highlighted, badge, cta,
 *     monthlyPrice?, annualPrice?,         // optional — when omitted card shows "Custom" or hides price
 *     features: [{ text, included }],      // legacy flat list, kept for backward-compat
 *     featureSections?: [{                 // NEW — preferred structure for V2 cards
 *       title?: string,                    // optional section heading (omit for un-grouped lists)
 *       inheritsFrom?: string,             // plan id — when set, card prefixes section with "Everything in {parentName}, plus"
 *       items: [{ text, icon?, tooltip?, highlight? }]
 *     }],
 *     equivalences?: [...]                 // unchanged
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
    name: 'Free',
    tagline: 'Discover the platform',
    highlighted: false,
    badge: null,
    cta: 'Get Started',
    features: [
      { text: '1 project', included: true },
      { text: '3 team members', included: true },
      { text: 'Community support', included: true },
      { text: 'Advanced analytics', included: false },
    ],
    featureSections: [
      {
        title: null,
        items: [
          { text: '1 project', icon: 'fa-solid fa-folder' },
          { text: '3 team members', icon: 'fa-solid fa-users' },
          { text: 'Community support', icon: 'fa-solid fa-comments' },
        ],
      },
    ],
    equivalences: [
      { label: 'operations / week', count: 100 },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For growing teams',
    highlighted: false,
    badge: null,
    cta: 'Get Started',
    features: [
      { text: '10 projects', included: true },
      { text: '10 team members', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced analytics', included: false },
    ],
    featureSections: [
      {
        title: null,
        inheritsFrom: 'free',
        items: [
          { text: '10 projects', icon: 'fa-solid fa-folder', highlight: true, iconColor: 'success' },
          { text: '10 team members', icon: 'fa-solid fa-users' },
          { text: 'Email support', icon: 'fa-solid fa-envelope' },
        ],
      },
    ],
    equivalences: [
      { label: 'operations / week', count: 500 },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For professionals',
    highlighted: true,
    badge: 'Most Popular',
    cta: 'Get Started',
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'Unlimited members', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
    ],
    featureSections: [
      {
        title: null,
        inheritsFrom: 'starter',
        items: [
          { text: 'Unlimited projects', icon: 'fa-solid fa-folder', highlight: true, iconColor: 'success' },
          { text: 'Unlimited members', icon: 'fa-solid fa-users' },
          { text: 'Priority support', icon: 'fa-solid fa-headset' },
          { text: 'Advanced analytics', icon: 'fa-solid fa-chart-line', iconColor: 'warning' },
        ],
      },
    ],
    equivalences: [
      { label: 'operations / week', count: 2000 },
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
 * @desc FAQ section content. Title + subtitle are optional (fallback to i18n).
 * @type {{ title?: string, subtitle?: string, content: Array<{id: string, question: string, answer: string}> }}
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
 * Each field is optional — when omitted the view falls back to i18n keys
 * `billing.pricing.tabs.plans` / `billing.pricing.tabs.units`.
 * Downstream projects can override either or both labels per project.
 * @type {{ plans?: string, units?: string }}
 */
export const tabs = {
  plans: 'Plans',
  units: 'Extras',
};

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
  },
};
