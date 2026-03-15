/**
 * Module dependencies.
 */
import user from '../views/user.view.vue';

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
