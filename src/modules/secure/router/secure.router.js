/**
 * Module dependencies.
 */
import secure from '../views/secure.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/secure',
    name: 'Secure',
    component: secure,
    meta: {
      icon: 'fa-solid fa-lock',
      action: 'read', subject: 'Secure', // protected, require ability
    },
  },
];

/**
 * Exports.
 */
