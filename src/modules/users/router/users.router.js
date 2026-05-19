/**
 * Module dependencies.
 */
import user from '../views/user.view.vue';

// TODO(remove next release): legacy ?tab=subscriptions alias — one-release retention only
/**
 * @desc Redirect legacy `/users?tab=subscriptions` bookmarks to the canonical
 *       account billing route `/users/billing`. Preserves all other query params
 *       and drops only the `tab` key. Returns `undefined` for all other traffic
 *       so the /users profile view renders normally.
 * @param {import('vue-router').RouteLocationNormalized} to - Incoming route.
 * @returns {{ path: string, query: Object } | undefined}
 */
const redirectLegacySubscriptionsTab = (to) => {
  if (to.query?.tab === 'subscriptions') {
    const { tab: _dropped, ...rest } = to.query;
    return { path: '/users/billing', query: rest };
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
    // TODO(remove next release): drop beforeEnter once ?tab=subscriptions bookmarks expire
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
