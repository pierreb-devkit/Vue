/**
 * Module dependencies.
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../auth/stores/auth.store';
import { ability } from '../../lib/helpers/ability';
import { capturePageview } from '../../lib/helpers/analytics';
import { isModuleActive } from '../../lib/helpers/modules';
import { injectAdminChildren, injectModuleChildren } from '../../lib/helpers/router';
import config from '../../lib/services/config';

import home from '../home/router/home.router';
import auth from '../auth/router/auth.router';
import organizations from '../organizations/router/organizations.router';
import admin from '../admin/router/admin.router';
import users from '../users/router/users.router';
import tasks from '../tasks/router/tasks.router';
import billing from '../billing/router/billing.router';
import legal from '../legal/router/legal.router';

// Core modules — always mounted
const coreRoutes = [].concat(home, auth, users);

/**
 * Admin child modules — routes injected as children of the `/admin` parent
 * route via `injectAdminChildren`. Downstream projects should register any
 * module that contributes an admin tab here (see MIGRATIONS.md).
 *
 * Each module's router file should export routes with **relative** paths
 * (e.g. `'my-tab'` rather than `'/admin/my-tab'`) so they resolve under
 * the `/admin/` parent.
 *
 * @example
 *   import myTabRoutes from '../my-tab/router/my-tab.router';
 *   const adminChildModules = [
 *     { name: 'my-tab', routes: myTabRoutes },
 *   ];
 */
const adminChildModules = [];
injectAdminChildren(admin, adminChildModules, isModuleActive);

/**
 * Organization-settings child modules — routes injected as children of the
 * `/users/organizations/:organizationId` parent route via `injectModuleChildren`.
 * Base devkit ships this empty; PR (c) and downstream projects populate it
 * (e.g. a billing-settings tab rendered inside the org detail layout).
 *
 * Each module's router file should export routes with **relative** paths
 * (e.g. `'billing'` rather than `'/users/organizations/:organizationId/billing'`)
 * so they resolve under the org parent.
 */
const organizationChildModules = [];
injectModuleChildren(organizations, organizationChildModules, isModuleActive, '/users/organizations/:organizationId');

// Optional modules — mounted only when activated
const optionalModules = [
  { name: 'organizations', routes: organizations },
  { name: 'admin', routes: admin },
  { name: 'tasks', routes: tasks },
  { name: 'billing', routes: billing },
  { name: 'legal', routes: legal },
];

const routes = optionalModules.reduce(
  (acc, mod) => (isModuleActive(mod.name) ? acc.concat(mod.routes) : acc),
  coreRoutes,
);

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
      return config.sign.route;
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

  // Block direct URL access to disabled modules
  const disabledModulePaths = optionalModules
    .filter((mod) => !isModuleActive(mod.name))
    .flatMap((mod) => mod.routes.map((r) => r.path.split('/:')[0]));

  // Paths exempt from the disabled-module guard (e.g. org-required must remain reachable regardless)
  const disabledModuleExempt = ['/organization-required'];

  /**
   * Redirect navigation attempts to disabled module paths back to home.
   * @param {import('vue-router').RouteLocationNormalized} to - Target route.
   * @returns {{ path: string } | undefined} Redirect to / when path is disabled, otherwise undefined.
   */
  router.beforeEach((to) => {
    if (disabledModuleExempt.includes(to.path)) return;
    const isDisabled = disabledModulePaths.some((p) => to.path === p || to.path.startsWith(p + '/'));
    if (isDisabled) return { path: '/' };
  });

  // Automatic page-view tracking
  router.afterEach((to) => {
    capturePageview(to);
  });

  return router;
};

/**
 * Exports.
 */
export default getRouter;
