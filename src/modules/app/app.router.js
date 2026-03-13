/**
 * Module dependencies.
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../auth/stores/auth.store';
import config from '../../lib/services/config';

import home from '../home/router/home.router';
import auth from '../auth/router/auth.router';
import organizations from '../organizations/router/organizations.router';
import admin from '../admin/router/admin.router';
import users from '../users/router/users.router';
import tasks from '../tasks/router/tasks.router';

const routes = [].concat(home, auth, organizations, admin, users, tasks);

/**
 * Router configuration.
 */
const getRouter = () => {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });
  // Routes that don't require an organization
  const orgExemptPaths = ['/signin', '/signup', '/forgot', '/reset', '/token', '/verify-email', '/organization-required', '/users', '/admin', '/invite'];

  router.beforeEach(async (to) => {
    // meta
    const pageTitle = to.meta.title || to.name;
    document.title = pageTitle ? `${pageTitle} - ${config.app.title}` : config.app.title;

    const authStore = useAuthStore();

    // Ensure server config and user are loaded (needed for org-required check)
    if (authStore.isLoggedIn && authStore.serverConfig === null) {
      await authStore.fetchServerConfig();
    }
    if (authStore.isLoggedIn && !authStore.user) {
      await authStore.refreshAbilities();
    }

    // Organization membership required: if orgs enabled, user logged in, no org, and not on an exempt page → block
    if (
      authStore.isLoggedIn
      && authStore.serverConfig?.organizations?.enabled
      && !authStore.user?.currentOrganization
      && !orgExemptPaths.some((p) => to.path.startsWith(p))
    ) {
      return '/organization-required';
    }

    // secu
    if (to.matched.some((record) => record.meta.action)) {
      if (authStore.isLoggedIn) {
        const { ability } = await import('../../lib/helpers/ability.js');
        // If abilities not loaded yet, fetch them before checking
        if (!ability || !ability.rules || ability.rules.length === 0) {
          await authStore.refreshAbilities();
        }
        if (ability && ability.rules && ability.rules.length > 0) {
          if (ability.can(to.meta.action, to.meta.subject)) return true;
          return '/'; // forbidden — redirect home
        }
        // Fallback: abilities still empty after refresh, allow if logged in
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
