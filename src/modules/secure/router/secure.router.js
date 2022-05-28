/**
 * Module dependencies.
 */
import secure from '../views/secure.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/secure',
    name: 'Secure',
    component: secure,
    meta: {
      icon: 'fa-solid fa-lock',
      roles: ['user'], // proteced, require one of this roles
    },
  },
];
