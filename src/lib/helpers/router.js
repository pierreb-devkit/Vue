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
 * @param {(name: string) => boolean} [isModuleActive] - Optional module
 *   activation predicate. When omitted, all provided modules are treated
 *   as active and injected unconditionally.
 * @returns {Array<object>} The same `adminRoutes` reference (mutated) for chaining.
 */
/**
 * @desc Validate a single child route record before injection.
 *
 * Rejects malformed records that could corrupt the admin children array:
 *  - must be a non-null object
 *  - must have a string `path`
 *  - `path` must be relative (no leading `/`) — absolute paths would
 *    escape the admin parent and break nesting
 *  - must have a `component` (function, object, or Promise for async)
 *
 * Invalid records are logged in non-production mode and silently skipped.
 *
 * @param {unknown} route - Route record to validate.
 * @param {string} moduleName - Owning module name (for warnings).
 * @returns {boolean} True if the route is safe to inject.
 */
const isValidChildRoute = (route, moduleName) => {
  if (!route || typeof route !== 'object') return false;
  if (typeof route.path !== 'string' || route.path.length === 0) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`[injectAdminChildren] "${moduleName}": child route missing string path — skipped`);
    }
    return false;
  }
  if (route.path.startsWith('/')) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`[injectAdminChildren] "${moduleName}": absolute path "${route.path}" cannot be an admin child — use a relative path`);
    }
    return false;
  }
  if (!route.component) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`[injectAdminChildren] "${moduleName}": child route "${route.path}" missing component — skipped`);
    }
    return false;
  }
  return true;
};

export const injectAdminChildren = (adminRoutes, childModules, isModuleActive) => {
  if (!Array.isArray(adminRoutes) || !Array.isArray(childModules)) return adminRoutes;
  const parent = adminRoutes.find((r) => r && r.path === '/admin' && Array.isArray(r.children));
  if (!parent) return adminRoutes;
  for (const mod of childModules) {
    if (!mod || !mod.name || !Array.isArray(mod.routes)) continue;
    if (typeof isModuleActive === 'function' && !isModuleActive(mod.name)) continue;
    const validRoutes = mod.routes.filter((r) => isValidChildRoute(r, mod.name));
    parent.children.push(...validRoutes);
  }
  return adminRoutes;
};

/**
 * Exports.
 */
export default { injectAdminChildren };
