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
 *  - the key matches a registered module but its entry has no `activated`
 *    property — some other property (e.g. `display`, which independently
 *    toggles nav visibility) was set instead, so the module stays active.
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
      console.warn(`[isModuleActive] config.modules.${key} matches no registered module — check for a wrong case or a typo; the module stays ACTIVE by default.`);
      continue;
    }
    const hasActivatedProp = value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'activated');
    if (!hasActivatedProp) {
      console.warn(`[isModuleActive] config.modules.${key} has no "activated" property — the module stays ACTIVE by default. A different property (e.g. "display") does not gate activation; use { activated: false } to deactivate it.`);
    }
  }
});

/**
 * Exports.
 */
export default { isModuleActive, warnUnknownModuleKeys };
