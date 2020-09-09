/**
 * Module dependencies.
 */
import Vue from 'vue';
import Router from 'vue-router';
import store from '@/modules/_app/app.store';

import home from '@/modules/home/router/home.router';
import auth from '@/modules/auth/router/auth.router';
import users from '@/modules/users/router/users.router';
import subscriptions from '@/modules/subscriptions/router/subscriptions.router';
import secure from '@/modules/secure/router/secure.router';
import tasks from '@/modules/tasks/router/tasks.router';

const routes = [].concat(home, auth, users, subscriptions, secure, tasks);

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
  // secu
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (store.getters.isLoggedIn) {
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
