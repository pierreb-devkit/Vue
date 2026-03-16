/**
 * Module dependencies.
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../auth/stores/auth.store';
import { ability } from '../../lib/helpers/ability';
import config from '../../lib/services/config';

import home from '../home/router/home.router';
import auth from '../auth/router/auth.router';
import organizations from '../organizations/router/organizations.router';
import admin from '../admin/router/admin.router';
import users from '../users/router/users.router';
import tasks from '../tasks/router/tasks.router';
import billing from '../billing/router/billing.router';

const routes = [].concat(home, auth, organizations, admin, users, tasks, billing);

/**
 * Router configuration.
 */
const getRouter = () => {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });
  // Routes that don't require an organization
  const orgExemptPrefixes = ['/users', '/admin'];
  const orgExemptExact = ['/signin', '/signup', '/forgot', '/reset', '/token', '/verify-email', '/organization-required', '/invite', '/pricing'];

  /**
   * Handle global navigation checks (title, auth, org requirement, CASL access).
   * @param {import('vue-router').RouteLocationNormalized} to Target route.
   * @returns {Promise<boolean|string|void>} Navigation resolution.
   */
  router.beforeEach(async (to) => {
    // meta
    const pageTitle = to.meta.title || to.name;
    document.title = pageTitle ? `${pageTitle} - ${config.app.title}` : config.app.title;

    const authStore = useAuthStore();

    // Ensure server config and user are loaded (needed for org-required check)
    try {
      if (authStore.isLoggedIn && authStore.serverConfig === null) {
        await authStore.fetchServerConfig();
      }
      if (authStore.isLoggedIn && !authStore.user) {
        await authStore.refreshAbilities();
      }
    } catch (err) {
      console.error('Router guard: failed to load server config or abilities, proceeding anyway', err);
    }

    // Redirect authenticated users away from auth pages (signin, signup, etc.)
    const authPages = ['/signin', '/signup', '/forgot', '/reset', '/token'];
    if (authStore.isLoggedIn && authPages.some((p) => to.path === p || to.path.startsWith(`${p}/`))) {
      if (authStore.serverConfig?.organizations?.enabled && !authStore.user?.currentOrganization) {
        return '/organization-required';
      }
      return '/';
    }

    // Organization membership required: if orgs enabled, user logged in, no org, and not on an exempt page → block
    if (
      authStore.isLoggedIn
      && authStore.serverConfig?.organizations?.enabled
      && !authStore.user?.currentOrganization
      && !orgExemptPrefixes.some((p) => to.path === p || to.path.startsWith(`${p}/`))
      && !orgExemptExact.some((p) => to.path === p || to.path.startsWith(p + '/'))
    ) {
      return '/organization-required';
    }

    // Auth-only routes (no CASL check, just require login)
    if (to.matched.some((record) => record.meta.requiresAuth && !record.meta.action)) {
      if (!authStore.isLoggedIn) return '/signin';
    }

    // billing plan gate
    if (to.meta.requiredPlan) {
      const { useBillingStore } = await import('../billing/stores/billing.store');
      const billingStore = useBillingStore();
      if (!billingStore.subscription) {
        try {
          await billingStore.fetchSubscription();
        } catch {
          // best-effort — if fetch fails, allow navigation to avoid blocking paid users
        }
      }
      // If subscription is unknown (e.g. API failure), skip the gate to avoid blocking paid users
      if (billingStore.subscription) {
        const planRanks = { free: 0, starter: 1, pro: 2 };
        const currentPlan = billingStore.subscription.plan || 'free';
        const currentRank = planRanks[currentPlan] ?? 0;
        const requiredRank = planRanks[to.meta.requiredPlan] ?? 0;
        if (currentRank < requiredRank) return '/pricing';
      }
    }

    // secu
    if (to.matched.some((record) => record.meta.action)) {
      if (authStore.isLoggedIn) {
        // If abilities not loaded yet, fetch them before checking
        if (!ability || !ability.rules || ability.rules.length === 0) {
          try {
            await authStore.refreshAbilities();
          } catch (err) {
            console.error('Router guard: failed to refresh abilities, proceeding anyway', err);
          }
        }
        if (ability && ability.rules && ability.rules.length > 0) {
          if (ability.can(to.meta.action, to.meta.subject)) return true;
          return '/'; // forbidden — redirect home
        }
        // Fallback: abilities still empty after refresh, deny access
        return '/';
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
