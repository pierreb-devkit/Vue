/**
 * Module dependencies.
 */
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../auth/stores/auth.store';
import { ability } from '../../lib/helpers/ability';
import { capturePageview } from '../../lib/helpers/analytics';
import { isModuleActive, warnUnknownModuleKeys } from '../../lib/helpers/modules';
import { injectAdminChildren, injectModuleChildren } from '../../lib/helpers/router';
import config from '../../lib/services/config';

import home from '../home/router/home.router';
import auth from '../auth/router/auth.router';
import organizations, { ORG_PARENT_PATH } from '../organizations/router/organizations.router';
import admin from '../admin/router/admin.router';
import users, { ACCOUNT_PARENT_PATH } from '../users/router/users.router';
import tasks from '../tasks/router/tasks.router';
import billing, { organizationRoutes as billingOrganizationRoutes } from '../billing/router/billing.router';
import legal from '../legal/router/legal.router';
import docs from '../docs/router/docs.router';
import { invitationsAdminRoutes, invitationsAccountRoutes } from '../invitations/router/invitations.router';

/**
 * Downstream route registries — mutated by `registerDownstreamRoutes` before
 * the router is instantiated. Module-load order guarantees downstream code
 * (imported before this file's composition runs) populates these arrays first.
 *
 * @type {Array}
 */
const _downstreamCoreModules = [];
const _downstreamAdminChildModules = [];
const _downstreamAccountChildModules = [];
const _downstreamOptionalModules = [];

/**
 * Register downstream-specific route extensions.
 *
 * Call this from your downstream module (e.g. `src/modules/<project>/index.js`)
 * BEFORE the router is instantiated.  Calling it mutates the internal registry
 * arrays in place; the router composition picks up the additions automatically.
 *
 * @param {object}   [options={}]
 * @param {Array}    [options.coreModules]          Routes spread into `coreRoutes` (always mounted, no activation gate).
 * @param {Array}    [options.adminChildModules]    Added to `adminChildModules` (injected under `/admin`).
 * @param {Array}    [options.accountChildModules]  Added to `accountChildModules` (injected under `/users`).
 * @param {Array}    [options.optionalModules]      Added to `optionalModules` (gated by `isModuleActive`).
 * @returns {void}
 */
export function registerDownstreamRoutes(options = {}) {
  if (options.coreModules) _downstreamCoreModules.push(...options.coreModules);
  if (options.adminChildModules) _downstreamAdminChildModules.push(...options.adminChildModules);
  if (options.accountChildModules) _downstreamAccountChildModules.push(...options.accountChildModules);
  if (options.optionalModules) _downstreamOptionalModules.push(...options.optionalModules);
}

/**
 * Router configuration.
 *
 * Route composition is deferred inside `getRouter()` so that
 * `registerDownstreamRoutes` calls made during module initialisation (before
 * `getRouter` is invoked from `main.js`) are always visible to the composition.
 */
const getRouter = () => {
  // Core modules — always mounted
  const coreRoutes = [].concat(home, auth, users, ..._downstreamCoreModules);

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
  const adminChildModules = [
    { name: 'invitations', routes: invitationsAdminRoutes },
    ..._downstreamAdminChildModules,
  ];
  injectAdminChildren(admin, adminChildModules, isModuleActive);

  /**
   * Account child modules — routes injected as children of the `/users` parent
   * route (the account surface) via `injectModuleChildren`, gated by
   * `isModuleActive`. Net-new seam (mirrors the org-settings injection): the
   * standalone `invitations` module contributes its "Referrals" tab here so the
   * account layout renders `/users/invitations` inline. The matching tab
   * descriptor lives in `config.users.extraTabs` (merged by `user.view.vue`).
   *
   * Each module's router exports routes with **relative** paths (e.g.
   * `'invitations'`) so they resolve under the `/users` parent.
   */
  const accountChildModules = [
    { name: 'invitations', routes: invitationsAccountRoutes },
    ..._downstreamAccountChildModules,
  ];
  injectModuleChildren(users, accountChildModules, isModuleActive, ACCOUNT_PARENT_PATH);

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
  const organizationChildModules = [
    { name: 'billing', routes: billingOrganizationRoutes },
  ];
  injectModuleChildren(organizations, organizationChildModules, isModuleActive, ORG_PARENT_PATH);

  // Optional modules — mounted only when activated
  const optionalModules = [
    { name: 'organizations', routes: organizations },
    { name: 'admin', routes: admin },
    { name: 'tasks', routes: tasks },
    { name: 'billing', routes: billing },
    { name: 'legal', routes: legal },
    { name: 'docs', routes: docs },
    ..._downstreamOptionalModules,
  ];

  // Config-only module flags that aren't route-gated (no routes to activate/
  // deactivate, so they never appear in any registry below) — listed here so
  // the dev-mode `config.modules.*` key check doesn't flag them as unknown.
  // Narrow by design: this list is stack-owned, not downstream-extensible —
  // adding a new non-routed config-only flag downstream will trigger the
  // dev-mode warning until it either ships an `activated`/gates a route (the
  // supported pattern) or gets added here in a stack PR. Deliberately not
  // generalized into a registration mechanism for a dev-mode-only nudge.
  const nonRoutedModuleNames = ['analytics'];
  // Names across every isModuleActive-gated registry — optionalModules PLUS
  // the admin/account/organization child-module registries (e.g. `invitations`
  // is only gated via adminChildModules/accountChildModules, never optionalModules).
  warnUnknownModuleKeys(() => [
    ...optionalModules.map((mod) => mod.name),
    ...adminChildModules.map((mod) => mod.name),
    ...accountChildModules.map((mod) => mod.name),
    ...organizationChildModules.map((mod) => mod.name),
    ...nonRoutedModuleNames,
  ]);

  const routes = optionalModules.reduce(
    (acc, mod) => (isModuleActive(mod.name) ? acc.concat(mod.routes) : acc),
    coreRoutes,
  );

  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  });
  // Routes that don't require an organization
  const orgExemptPrefixes = ['/users', '/admin'];
  const orgExemptExact = ['/signin', '/signup', '/forgot', '/reset', '/token', '/verify-email', '/organization-required', '/pricing'];

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
