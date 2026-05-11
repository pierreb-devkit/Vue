/**
 * Module dependencies.
 */
import pricing from '../views/billing.pricing.view.vue';

/**
 * @desc Redirect legacy /billing route to the subscriptions tab while preserving incoming query params.
 * @param {import('vue-router').RouteLocationNormalized} to - Incoming route location.
 * @returns {{ path: string, query: Object }} Redirect target route.
 */
const redirectBillingToSubscriptions = (to) => ({ path: '/users', query: { ...to.query, tab: 'subscriptions' } });

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
      marketing: true, // suppresses v-navigation-drawer for signed-in users (no drawer offset on full-bleed hero)
    },
  },
  {
    path: '/billing',
    name: 'Billing',
    redirect: redirectBillingToSubscriptions,
    meta: {
      display: false,
      requiresAuth: true,
      action: 'read',
      subject: 'BillingSubscription',
    },
  },
];
