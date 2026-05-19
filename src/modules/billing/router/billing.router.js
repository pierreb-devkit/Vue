/**
 * Module dependencies.
 */
import pricing from '../views/billing.pricing.view.vue';
import billingAccount from '../views/billing.account.view.vue';

/**
 * @desc Redirect legacy /billing route to the account billing view.
 *       C5 will implement additional legacy-redirect rules (e.g. ?tab=subscriptions).
 * @param {import('vue-router').RouteLocationNormalized} to - Incoming route location.
 * @returns {{ path: string, query: Object }} Redirect target route.
 */
const redirectBillingToAccount = (to) => ({ path: '/users/billing', query: { ...to.query } });

/**
 * Org-surface child routes — injected under /users/organizations/:organizationId
 * by C2 via `organizationChildModules`. The billing module owns its route;
 * the host (app.router / organization view) never imports the component directly.
 * Mirrors the costs.router.js self-injection pattern.
 *
 * Exported separately so app.router's `optionalModules` only sees absolute
 * top-level routes (default export) and is never handed a relative child path.
 */
export const organizationRoutes = [
  {
    path: 'billing',
    name: 'Account Organization Billing',
    component: () => import('../components/billing.subscriptions.component.vue'),
    meta: {
      display: false,
      action: 'manage',
      subject: 'Organization',
    },
  },
];

/**
 * Router configuration (top-level routes).
 *
 * `/users/billing` — canonical account billing entry point (C4).
 *   Detects the user's manageable orgs and either auto-redirects (single org)
 *   or renders an org-selector (multiple orgs) or a read-only "ask admin" state.
 *
 * `/billing` — legacy entry point. Redirects to `/users/billing` (C5 will add
 *   further legacy redirect rules such as `?tab=subscriptions`).
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
    path: '/users/billing',
    name: 'Account Billing',
    component: billingAccount,
    meta: {
      display: false,
      requiresAuth: true,
      action: 'read',
      subject: 'BillingSubscription',
    },
  },
  {
    path: '/billing',
    name: 'Billing',
    redirect: redirectBillingToAccount,
    meta: {
      display: false,
      requiresAuth: true,
      action: 'read',
      subject: 'BillingSubscription',
    },
  },
];
