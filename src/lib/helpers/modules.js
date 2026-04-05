/**
 * Module activation helpers.
 *
 * Core modules (home, auth, users, app, core) are always active.
 * Optional modules can be deactivated via config.modules.{name}.activated = false.
 */
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
 * Exports.
 */
export default { isModuleActive };
