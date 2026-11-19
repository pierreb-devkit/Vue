/**
 * Module dependencies.
 */
import user from '../views/user.view.vue';

/**
 * @desc Path of the account parent route — the injection seam under which
 *       optional modules (e.g. the standalone `invitations` module's "Referrals"
 *       tab) register child routes via `injectModuleChildren`. Exported so the
 *       host (`app.router.js`) and tests reference the constant instead of
 *       hardcoding the string (mirrors `ORG_PARENT_PATH`).
 * @type {string}
 */
export const ACCOUNT_PARENT_PATH = '/users';

/**
 * Router configuration.
 */
export default [
  {
    path: '/users',
    name: 'Account',
    component: user,
    meta: {
      icon: 'fa-solid fa-circle-user',
      order: 10, // sidenav sort order within bottom section (lower = first)
      position: 'bottom',
      requiresAuth: true,
    },
    children: [
      {
        // bare /users → /users/profile (default child)
        path: '',
        redirect: { name: 'Account Profile' },
      },
      {
        path: 'profile',
        name: 'Account Profile',
        component: () => import('../views/user.profile.view.vue'),
        meta: {
          display: false,
          requiresAuth: true,
        },
      },
    ],
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
