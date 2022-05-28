/**
 * Module dependencies.
 */
import home from '../views/home.view.vue';
import pages from '../views/pages.view.vue';
import team from '../views/team.view.vue';

/**
 * Router configuration
 */
export default [
  {
    path: '/',
    name: 'Home', // todo: get from config
    component: home,
    meta: {
      icon: 'fa-solid fa-house',
      footer: true, // display footer
    },
  },
  {
    path: '/changelogs',
    name: 'changelogs',
    component: pages,
    meta: {
      display: false, // hide from drawer any time
      title: 'Changelogs',
      data: 'getChangelogs', // array of {title: ..., markdown: ...}
      footer: true, // display footer
    },
  },
  {
    path: '/team',
    name: 'Team',
    component: team,
    meta: {
      display: false, // hide from drawer any time
      title: 'Team',
      footer: true, // display footer
    },
  },
  {
    path: '/pages/:name',
    name: 'Pages',
    component: pages,
    meta: {
      display: false, // hide from drawer any time
      data: 'getPages', // array of {title: ..., markdown: ...}
      footer: true, // display footer
    },
  },
  {
    path: '/:catchAll(.*)',
    redirect: { name: 'Home' },
    meta: {
      display: false, // hide from drawer any time
    },
  },
];
