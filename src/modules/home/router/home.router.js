/**
 * Module dependencies.
 */
import home from '@/modules/home/views/home.view.vue';
import pages from '@/modules/home/views/pages.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/',
    name: 'Home',
    component: home,
    meta: {
      icon: 'home',
    },
  },
  {
    path: '/changelogs',
    name: 'changelogs',
    component: pages,
    meta: {
      display: false, // hide any time
      title: 'Changelogs',
      data: 'getChangelogs', // array of {title: ..., markdown: ...}
    },
  },
  {
    path: '*',
    redirect: { name: 'Home' },
    meta: {
      display: false, // hide any time
    },
  },
];
