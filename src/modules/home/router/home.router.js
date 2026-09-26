/**
 * Module dependencies.
 */
import config from '@/config';
import home from '../views/home.view.vue';
import pages from '../views/home.pages.view.vue';
import team from '../views/home.team.view.vue';
import notFound from '../views/home.notfound.view.vue';

/**
 * `home` is a core module (always mounted), but `/team` and `/pages/:name`
 * are optional stack routes a downstream project may not use — the only way
 * to remove them used to be patching the instantiated router at runtime
 * (`removeRoute` after creation), which is fragile across stack updates.
 *
 * Each switches off independently via `config.home.routes.{team,pages}.activated`
 * (both default `true` — unset behaves exactly like today). When off, the
 * route is not registered at all, so it falls through to the `NotFound`
 * catch-all like any other unknown path — no extra redirect logic needed.
 */
const teamActivated = config?.home?.routes?.team?.activated !== false;
const pagesActivated = config?.home?.routes?.pages?.activated !== false;

/**
 * Router configuration.
 */
export default [
  {
    path: '/',
    name: 'Home', // todo: get from config
    component: home,
    meta: {
      icon: 'fa-solid fa-house',
      order: 10, // sidenav sort order (lower = first)
      footer: true, // display footer
    },
  },
  ...(teamActivated
    ? [
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
      ]
    : []),
  ...(pagesActivated
    ? [
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
      ]
    : []),
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: notFound,
    meta: {
      display: false, // hide from drawer any time
      title: 'Page Not Found',
    },
  },
];

/**
 * Exports.
 */
