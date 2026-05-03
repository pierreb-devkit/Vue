/**
 * Module dependencies.
 */
import pricing from '../views/billing.pricing.view.vue';

/**
 * Router configuration.
 *
 * `/billing` is no longer a stand-alone view: subscriptions live under
 * the user account "Subscriptions" tab. Hitting `/billing` redirects to
 * `/users?tab=subscriptions` so old links keep working.
 */
export default [
  {
    path: '/pricing',
    name: 'Pricing',
    component: pricing,
    meta: {
      display: false,
      footer: true,
    },
  },
  {
    path: '/billing',
    name: 'Billing',
    redirect: (to) => ({ path: '/users', query: { ...to.query, tab: 'subscriptions' } }),
    meta: {
      display: false,
      requiresAuth: true,
      action: 'read',
      subject: 'BillingSubscription',
    },
  },
];
