/**
 * Module dependencies.
 */
import pricing from '../views/Pricing.view.vue';
import billing from '../views/Billing.view.vue';

/**
 * Router configuration.
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
    component: billing,
    meta: {
      display: false,
      requiresAuth: true,
    },
  },
];

/**
 * Exports.
 */
