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
      action: 'read',
      subject: 'User',
    },
  },
];

/**
 * Exports.
 */
