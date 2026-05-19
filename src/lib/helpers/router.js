/**
 * Router helpers.
 *
 * Utilities to compose the top-level route tree from multiple modules,
 * including the "child injection" pattern used by the admin module so
 * downstream-added tabs render inline within the admin layout instead
 * of navigating away to sibling pages.
 */

/**
 * @desc Validate a single child route record before injection.
 *
 * Rejects malformed records that could corrupt the parent children array:
 *  - must be a non-null object
 *  - must have a string `path`
 *  - `path` must be relative (no leading `/`) — absolute paths would
 *    escape the parent and break nesting
 *  - must have a `component` (function, object, or Promise for async)
 *
 * Invalid records are logged in non-production mode and silently skipped.
 *
 * @param {unknown} route - Route record to validate.
 * @param {string} moduleName - Owning module name (for warnings).
 * @param {string} callerName - Name of the calling function (for warnings).
 * @returns {boolean} True if the route is safe to inject.
 */
const isValidChildRoute = (route, moduleName, callerName = 'injectModuleChildren') => {
  if (!route || typeof route !== 'object') return false;
  if (typeof route.path !== 'string' || route.path.length === 0) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`[${callerName}] "${moduleName}": child route missing string path — skipped`);
    }
    return false;
  }
  if (route.path.startsWith('/')) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`[${callerName}] "${moduleName}": absolute path "${route.path}" cannot be an admin child — use a relative path`);
    }
    return false;
  }
  if (!route.component) {
    if (import.meta.env?.MODE !== 'production') {
      console.warn(`[${callerName}] "${moduleName}": child route "${route.path}" missing component — skipped`);
    }
    return false;
  }
  return true;
};

/**
 * @desc Inject routes from downstream modules as children of a named parent route.
 *
 * Finds the parent route in `routes` by matching `parentPath`, then pushes
 * valid, active-module children into its `children` array. This is the
 * generalized form of {@link injectAdminChildren} — it works for any
 * surface (admin, org-settings, etc.) by letting callers specify `parentPath`.
 *
 * Modules that are not active are silently skipped. The function is a no-op
 * when the parent route cannot be found (e.g. module disabled). Malformed
 * child routes (missing path/component, absolute path) are filtered out via
 * {@link isValidChildRoute} with dev-mode warnings.
 *
 * @example
 * import admin from '../admin/router/admin.router';
 * import knowledge from '../knowledge/router/knowledge.router';
 * import { injectModuleChildren } from '@/lib/helpers/router';
 * import { isModuleActive } from '@/lib/helpers/modules';
 *
 * injectModuleChildren(admin, [
 *   { name: 'knowledge', routes: knowledge },
 * ], isModuleActive);
 *
 * @param {Array<object>} routes - Route array containing the target parent.
 * @param {Array<{ name: string, routes: Array<object> }>} childModules - Modules to inject.
 * @param {(name: string) => boolean} [isModuleActive] - Optional module
 *   activation predicate. When omitted, all provided modules are treated
 *   as active and injected unconditionally.
 * @param {string} [parentPath='/admin'] - The `path` of the parent route to
 *   inject into. Defaults to `'/admin'` for back-compat with injectAdminChildren.
 * @returns {Array<object>} The same `routes` reference (mutated) for chaining.
 */
export const injectModuleChildren = (routes, childModules, isModuleActive, parentPath = '/admin') => {
  if (!Array.isArray(routes) || !Array.isArray(childModules)) return routes;
  const parent = routes.find((r) => r && r.path === parentPath && Array.isArray(r.children));
  if (!parent) return routes;
  for (const mod of childModules) {
    if (!mod || !mod.name || !Array.isArray(mod.routes)) continue;
    if (typeof isModuleActive === 'function' && !isModuleActive(mod.name)) continue;
    const validRoutes = mod.routes.filter((r) => isValidChildRoute(r, mod.name, 'injectModuleChildren'));
    parent.children.push(...validRoutes);
  }
  return routes;
};

/**
 * @desc Inject routes from downstream modules as children of the admin parent route.
 *
 * Back-compat wrapper around {@link injectModuleChildren} targeting `'/admin'`.
 * Downstream projects (e.g. Trawl) depend on this signature — it must remain
 * behaviorally identical to the original implementation.
 *
 * @param {Array<object>} adminRoutes - Admin module routes (the array exported by admin.router.js).
 * @param {Array<{ name: string, routes: Array<object> }>} adminChildModules - Modules to inject.
 * @param {(name: string) => boolean} [isModuleActive] - Optional module
 *   activation predicate. When omitted, all provided modules are treated
 *   as active and injected unconditionally.
 * @returns {Array<object>} The same `adminRoutes` reference (mutated) for chaining.
 */
export const injectAdminChildren = (adminRoutes, adminChildModules, isModuleActive) =>
  injectModuleChildren(adminRoutes, adminChildModules, isModuleActive, '/admin');

/**
 * Exports.
 */
export default { injectAdminChildren, injectModuleChildren };
