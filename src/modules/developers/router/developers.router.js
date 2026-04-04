/**
 * Module dependencies.
 */
import developers from '../views/developers.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/developers',
    name: 'Developers',
    component: developers,
    meta: {
      display: false,
      requiresAuth: true,
      action: 'read',
      subject: 'DeveloperKey',
    },
  },
];
