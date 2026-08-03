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
 * exactly `{ activated: false }` to "active" — so a mis-cased key, a typo'd
 * module name, or the wrong property (e.g. `display` instead of `activated`)
 * silently leaves a module (and its routes) active with no signal that the
 * deactivation attempt did nothing. This scans `config.modules` once and
 * warns for each offending key:
 *  - the key matches no registered module name (wrong case or a typo) — the
 *    entry is never consulted by `isModuleActive` at all;
 *  - the key matches a registered (non-core) module but its entry has no
 *    `activated` property — some other property was set instead, so the
 *    module stays active.
 *
 * `config.modules.{name}` is a dual-purpose namespace: `useCoreStore.refreshNav`
 * (`src/modules/core/stores/core.store.js`) separately reads
 * `config.modules[routeName].display` to hide a nav item without touching
 * activation — a legitimate, unrelated use of the same top-level key. Both
 * messages below name that pattern explicitly so a project using `display`
 * intentionally (nav-hide only, module still active) isn't misread as
 * broken config; `activated` is only ever inert on a CORE module (always
 * active regardless of config), so that combination is skipped entirely
 * rather than telling the developer to add a property that would do nothing.
 *
 * No-op in production (checked via `import.meta.env.MODE`, mirroring the
 * idiom used by {@link module:lib/helpers/router}). Wrapped in `once()` so it
 * is safe to call from a site that re-runs (e.g. router (re)composition)
 * without re-scanning or re-logging on every call — `registeredModuleNames`
 * may be passed as a thunk so the caller only pays for building the list on
 * that first call.
 *
 * @param {Iterable<string>|() => Iterable<string>} [registeredModuleNames] - Names
 *   of optional modules known to the app (e.g. the router's optional-module
 *   registries), or a thunk returning them. Core modules are always included
 *   regardless of this list.
 * @returns {void}
 */
export const warnUnknownModuleKeys = once((registeredModuleNames = []) => {
  if (import.meta.env?.MODE === 'production') return;

  const modulesConfig = config.modules;
  if (!modulesConfig || typeof modulesConfig !== 'object') return;

  const names = typeof registeredModuleNames === 'function' ? registeredModuleNames() : registeredModuleNames;
  const known = new Set([...CORE_MODULES, ...names]);

  for (const [key, value] of Object.entries(modulesConfig)) {
    if (!known.has(key)) {
      console.warn(`[isModuleActive] config.modules.${key} matches no registered module — check for a wrong case or a typo. (If this key is a nav-only display override for a route named "${key}" — see useCoreStore.refreshNav — this warning is safe to ignore.) Otherwise the module stays ACTIVE by default.`);
      continue;
    }
    if (CORE_MODULES.has(key)) continue; // activated is always inert on a core module — nothing to flag
    const hasActivatedProp = value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'activated');
    if (!hasActivatedProp) {
      console.warn(`[isModuleActive] config.modules.${key} has no "activated" property — the module stays ACTIVE by default. If you're only using "display" to hide it from the nav (see useCoreStore.refreshNav) that's expected; if you meant to deactivate the module too, also add { activated: false }.`);
    }
  }
});

/**
 * Exports.
 */
export default { isModuleActive, warnUnknownModuleKeys };
