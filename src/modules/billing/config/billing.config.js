/**
 * Billing plans static marketing content.
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
  },
];

/**
 * Exports.
 */
export default plans;
