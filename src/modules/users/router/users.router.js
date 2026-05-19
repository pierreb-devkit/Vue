/**
 * Module dependencies.
 */
import user from '../views/user.view.vue';

// TODO(remove one release after PR(c) merges AND after billing.store successUrl repointed):
// legacy ?tab=subscriptions alias — one-release retention only.
// IMPORTANT: this guard also actively bridges Stripe successUrl redirects —
// billing.store.js createCheckout/createExtrasCheckout currently point successUrl
// to `/users?tab=subscriptions&success=true`. Do NOT remove this guard until those
// successUrl values are repointed to `/users/billing?success=true`.
/**
 * @desc Redirect legacy `/users?tab=subscriptions` bookmarks to the canonical
 *       account billing route `/users/billing`. Preserves all other query params
 *       and drops only the `tab` key (Vue Router silently drops undefined-valued
 *       query keys from the final URL). Returns `undefined` for all other traffic
 *       so the /users profile view renders normally.
 *
 *       Note: if `to.query.tab` is an array (repeated `?tab=` param), the strict
 *       `=== 'subscriptions'` does NOT redirect — conservative pass-through for
 *       ambiguous input, by design.
 * @param {import('vue-router').RouteLocationNormalized} to - Incoming route.
 * @returns {{ path: string, query: Object } | undefined}
 */
const redirectLegacySubscriptionsTab = (to) => {
  if (to.query?.tab === 'subscriptions') {
    return { path: '/users/billing', query: { ...to.query, tab: undefined } };
  }
};

/**
 * Router configuration.
 */
export default [
  {
    path: '/users',
    name: 'Account',
    component: user,
    // TODO(remove one release after PR(c) merges AND after billing.store successUrl repointed):
    // drop beforeEnter once ?tab=subscriptions bookmarks expire AND billing.store.js
    // createCheckout/createExtrasCheckout successUrl values are repointed to /users/billing.
    beforeEnter: redirectLegacySubscriptionsTab,
    meta: {
      icon: 'fa-solid fa-circle-user',
      order: 10, // sidenav sort order within bottom section (lower = first)
      position: 'bottom',
      requiresAuth: true,
    },
  },
  {
    path: '/users/:id',
    redirect: '/users',
    meta: {
      display: false,
      requiresAuth: true,
    },
  },
];

/**
 * Exports.
 */
