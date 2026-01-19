/**
 * Module dependencies.
 */
import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../auth/stores/auth.store';
import config from '../../lib/services/config';

import home from '../home/router/home.router';
import auth from '../auth/router/auth.router';
import users from '../users/router/users.router';
import secure from '../secure/router/secure.router';
import tasks from '../tasks/router/tasks.router';

const routes = [].concat(home, auth, users, secure, tasks);

/**
 * Router configuration.
 */
const getRouter = () => {
  const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes,
  });
  router.beforeEach((to, from, next) => {
    // meta
    document.title = to.name ? `${to.name} - ${config.app.title}` : config.app.title;
    const userRoles = localStorage.getItem(`${config.cookie.prefix}UserRoles`)
      ? localStorage.getItem(`${config.cookie.prefix}UserRoles`).split(',')
      : [];
    // secu
    if (to.matched.some((record) => record.meta.roles)) {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn && to.meta.roles.some((r) => userRoles.includes(r))) {
        next();
        return;
      }
      next('/signin');
    } else {
      next();
    }
  });
  return router;
};

/**
 * Exports.
 */
export default getRouter;
