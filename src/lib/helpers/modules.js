/**
 * Module activation helpers.
 *
 * Core modules (home, auth, users, app, core) are always active.
 * Optional modules can be deactivated via config.modules.{name}.activated = false.
 */
import { once } from 'lodash-es';
import config from '../services/config';

const CORE_MODULES = new Set(['home', 'auth', 'users', 'app', 'core']);

/**
 * @desc Check whether a module is activated.
 * Core modules always return true regardless of config.
 * @param {string} moduleName - Module key as used in config.modules
 * @returns {boolean}
 */
export const isModuleActive = (moduleName) => {
  if (CORE_MODULES.has(moduleName)) return true;
  return config.modules?.[moduleName]?.activated !== false;
};

/**
 * @desc Dev-mode-only guard against silent `isModuleActive` fail-open bugs.
 *
 * `isModuleActive` resolves any `config.modules.{name}` entry that isn't
 * exactly `{ activated: false }` to "active" — so a mis-cased key or a
 * typo'd module name silently leaves a module (and its routes) active with
 * no signal that the deactivation attempt did nothing.
 *
 * `config.modules.{name}` is a **dual-purpose namespace**: `useCoreStore.refreshNav`
 * (`src/modules/core/stores/core.store.js`) separately reads
 * `config.modules[routeName].display` to hide a nav item without touching
 * activation, keyed by the Vue Router route NAME (PascalCase, e.g. `'Tasks'`)
 * — a different key space than module names, and a legitimate, unrelated use
 * of the same top-level object. Discriminating by **intent** (does the entry
 * carry an `activated` property?) is what keeps this from false-positiving on
 * that shipped pattern:
 *  - entry has an `activated` property → **activation intent** → the key must
 *    match a registered MODULE name, else warn (this is what catches the
 *    original bug: a mis-cased/typo'd module name with `activated: false`
 *    that silently does nothing).
 *  - entry has no `activated` property → **nav-hide intent** (`display`, or
 *    any other shape) → the key must match a registered ROUTE name OR a
 *    registered MODULE name (the coincidental case where they're spelled the
 *    same), else warn. Never suggests adding `activated` here — for this
 *    branch there is no way to tell "meant to also deactivate" from "meant
 *    nav-hide only", so the message stays neutral.
 *
 * Either warning covers both real causes handled identically (a typo/wrong
 * case, or genuinely dead leftover config e.g. a config key a module no
 * longer reads) — activation is unaffected either way, which the message
 * says explicitly so it doesn't overclaim there's necessarily a bug.
 *
 * No-op in production (checked via `import.meta.env.MODE`, mirroring the
 * idiom used by {@link module:lib/helpers/router}). Wrapped in `once()` so it
 * is safe to call from a site that re-runs (e.g. router (re)composition)
 * without re-scanning or re-logging on every call — both name lists may be
 * passed as thunks so the caller only pays for building them on that first
 * call.
 *
 * @param {Iterable<string>|() => Iterable<string>} [registeredModuleNames] - Names
 *   of optional modules known to the app (e.g. the router's optional-module
 *   registries), or a thunk returning them. Core modules are always included
 *   regardless of this list.
 * @param {Iterable<string>|() => Iterable<string>} [registeredRouteNames] - Route
 *   `name`s the app actually mounts (the same list `useCoreStore.refreshNav`
 *   consults for nav-hide overrides), or a thunk returning them.
 * @returns {void}
 */
export const warnUnknownModuleKeys = once((registeredModuleNames = [], registeredRouteNames = []) => {
  if (import.meta.env?.MODE === 'production') return;

  const modulesConfig = config.modules;
  if (!modulesConfig || typeof modulesConfig !== 'object') return;

  const moduleNames = typeof registeredModuleNames === 'function' ? registeredModuleNames() : registeredModuleNames;
  const routeNames = typeof registeredRouteNames === 'function' ? registeredRouteNames() : registeredRouteNames;
  const knownModules = new Set([...CORE_MODULES, ...moduleNames]);
  const knownRoutes = new Set(routeNames);

  for (const [key, value] of Object.entries(modulesConfig)) {
    const hasActivatedProp = value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'activated');

    if (hasActivatedProp) {
      // Activation intent — must resolve against a registered MODULE name.
      if (!knownModules.has(key)) {
        console.warn(`[isModuleActive] config.modules.${key} sets "activated" but matches no registered module — either a typo/wrong case or dead leftover config; module activation is NOT affected.`);
      }
      continue;
    }

    // No "activated" — nav-hide intent (or unrelated leftover config). Per
    // useCoreStore.refreshNav, this namespace is keyed by route NAME, not
    // module name, so check both: a route-name match is the real supported
    // pattern; a module-name match is the coincidental case (module and
    // route happen to share a name) — either is treated as intentional.
    if (!knownRoutes.has(key) && !knownModules.has(key)) {
      console.warn(`[isModuleActive] config.modules.${key} matches no registered module or route name — either a typo/wrong case or dead leftover config; module activation is NOT affected.`);
    }
  }
});

/**
 * Exports.
 */
export default { isModuleActive, warnUnknownModuleKeys };
