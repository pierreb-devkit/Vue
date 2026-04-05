/**
 * Module dependencies.
 */
import docs from '../views/docs.view.vue';

/**
 * Router configuration.
 */
export default [
  {
    path: '/docs',
    name: 'Docs',
    component: docs,
    meta: {
      display: false,
      title: 'API Docs',
    },
  },
];
