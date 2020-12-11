/**
 * Module dependencies.
 */
import Vue from 'vue';
import Router from 'vue-router';
import store from '@/modules/_app/app.store';
import config from '@/config';

import home from '@/modules/home/router/home.router';
import auth from '@/modules/auth/router/auth.router';
import users from '@/modules/users/router/users.router';
import secure from '@/modules/secure/router/secure.router';
import tasks from '@/modules/tasks/router/tasks.router';

const routes = [].concat(home, auth, users, secure, tasks);

/**
 * Router configuration
 */
Vue.use(Router);
Vue.prototype.$routes = routes;

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach((to, from, next) => {
  // meta
  document.title = to.name;
  const userRoles = localStorage.getItem(`${config.cookie.prefix}UserRoles`)
    ? localStorage.getItem(`${config.cookie.prefix}UserRoles`).split(',')
    : [];
  // secu
  if (to.matched.some((record) => record.meta.roles)) {
    if (store.getters.isLoggedIn && to.meta.roles.some((r) => userRoles.includes(r))) {
      next();
      return;
    }
    next('/signin');
  } else {
    next();
  }
});

/**
 * Export default
 */
export default router;
