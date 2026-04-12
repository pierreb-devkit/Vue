/**
 * Router helpers.
 *
 * Utilities to compose the top-level route tree from multiple modules,
 * including the "child injection" pattern used by the admin module so
 * downstream-added tabs render inline within the admin layout instead
 * of navigating away to sibling pages.
 */

/**
 * @desc Inject routes from downstream modules as children of the admin parent route.
 *
 * The admin module exports a single parent route (`path: '/admin'`) with a
 * `children` array. Downstream modules that contribute an "admin tab" should
 * export routes with **relative** paths (e.g. `'knowledge'`, not
 * `'/admin/knowledge'`). This helper pushes those children into the parent
 * route's `children` array **only** when the module is active.
 *
 * Modules that are not active are silently skipped. The function is a no-op
 * when the admin parent route cannot be found (e.g. admin module disabled).
 *
 * @example
 * import admin from '../admin/router/admin.router';
 * import knowledge from '../knowledge/router/knowledge.router';
 * import costs from '../costs/router/costs.router';
 * import { injectAdminChildren } from '@/lib/helpers/router';
 * import { isModuleActive } from '@/lib/helpers/modules';
 *
 * injectAdminChildren(admin, [
 *   { name: 'knowledge', routes: knowledge },
 *   { name: 'costs', routes: costs },
 * ], isModuleActive);
 *
 * @param {Array<object>} adminRoutes - Admin module routes (the array exported by admin.router.js).
 * @param {Array<{ name: string, routes: Array<object> }>} childModules - Modules to inject.
 * @param {(name: string) => boolean} isModuleActive - Module activation predicate.
 * @returns {Array<object>} The same `adminRoutes` reference (mutated) for chaining.
 */
export const injectAdminChildren = (adminRoutes, childModules, isModuleActive) => {
  if (!Array.isArray(adminRoutes) || !Array.isArray(childModules)) return adminRoutes;
  const parent = adminRoutes.find((r) => r && r.path === '/admin' && Array.isArray(r.children));
  if (!parent) return adminRoutes;
  for (const mod of childModules) {
    if (!mod || !mod.name || !Array.isArray(mod.routes)) continue;
    if (typeof isModuleActive === 'function' && !isModuleActive(mod.name)) continue;
    parent.children.push(...mod.routes);
  }
  return adminRoutes;
};

/**
 * Exports.
 */
export default { injectAdminChildren };
