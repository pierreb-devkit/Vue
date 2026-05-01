/**
 * Billing module — static marketing content (devkit defaults).
 *
 * Contains plan copy and pack definitions that are environment-independent.
 * Downstream projects override `plans` and `packs` with their own branded content.
 * No secrets or environment-specific values belong here.
 *
 * Each plan may optionally include an `equivalences` array for meter mode display.
 * Equivalences are illustrative devkit defaults — downstream projects override with
 * their own branding and counts.
 * @type {Array<{id: string, name: string, tagline: string, highlighted: boolean, badge: string|null, cta: string, features: Array<{text: string, included: boolean}>, equivalences?: Array<{label: string, count: number}>}>}
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
    // i18n key: billing.equivalences.scrapRun → "operations / week"
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
    equivalences: [
      { label: 'operations / week', count: 2000 },
    ],
  },
];

/**
 * Extra credit packs available for purchase.
 * Devkit default is empty — downstream projects populate with marketing copy and Stripe pack IDs.
 * @type {Array<{packId: string, label: string, priceUsd: number, meterUnits: number}>}
 */
export const packs = [];

/**
 * Exports.
 */
export default {
  billing: {
    plans,
    packs,
  },
};
