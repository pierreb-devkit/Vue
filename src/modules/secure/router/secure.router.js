/**
 * Module dependencies.
 */
import secure from '@/modules/secure/views/secure.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/secure',
    name: 'Secure',
    component: secure,
    meta: {
      icon: 'lock',
      roles: ['user'], // proteced, require one of this roles
    },
  },
];
