/**
 * Structured logger helper.
 *
 * Centralises all client-side logging so every message carries
 * a consistent `[module]` prefix and severity level.
 * In production the transport can be swapped to a remote service
 * without touching call-sites.
 */

const PREFIX = '[app]';

/**
 * @desc Create a scoped logger for a module.
 * @param {string} module - Logical module name (e.g. 'home', 'auth')
 * @returns {{ error: Function, warn: Function, info: Function }}
 */
export const createLogger = (module) => {
  const tag = `${PREFIX}[${module}]`;
  return {
    error: (...args) => console.error(tag, ...args),
    warn: (...args) => console.warn(tag, ...args),
    info: (...args) => console.info(tag, ...args),
  };
};

/**
 * Exports.
 */
export default { createLogger };
