/**
 * Module dependencies.
 */
import { createRouter, createWebHistory } from 'vue-router';
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
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });
  router.beforeEach(async (to) => {
    // meta
    const pageTitle = to.meta.title || to.name;
    document.title = pageTitle ? `${pageTitle} - ${config.app.title}` : config.app.title;
    // secu
    if (to.matched.some((record) => record.meta.action)) {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        // If abilities are loaded, use them
        const { ability } = await import('../../lib/helpers/ability.js');
        if (ability && ability.rules && ability.rules.length > 0) {
          if (ability.can(to.meta.action, to.meta.subject)) return true;
          return '/'; // forbidden — redirect home
        }
        // Fallback: no abilities yet (backend not updated), just allow if logged in
        return true;
      }
      return '/signin';
    }
  });
  return router;
};

/**
 * Exports.
 */
export default getRouter;
