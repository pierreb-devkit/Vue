/**
 * Module dependencies.
 */
import home from '@/modules/home/views/home.view.vue';
import pages from '@/modules/home/views/pages.view.vue';
import team from '@/modules/home/views/team.view.vue';

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
    path: '/team',
    name: 'Team',
    component: team,
    meta: {
      display: false, // hide any time
      title: 'Team',
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
