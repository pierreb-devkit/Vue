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
 * @desc Reduce an axios error to what is safe to log: never the request
 * payload or headers (`config.data`, `config.headers`), never the response body,
 * never a query string or a long path segment (tokens travel there).
 * @param {*} arg - Any logged value
 * @returns {*} The value, or a small summary when it is an axios error
 */
const safeUrl = (url) =>
  typeof url === 'string'
    ? url
        .split('?')[0]
        .split('/')
        .map((part) => (part.length >= 20 ? ':token' : part))
        .join('/')
    : url;

const redact = (arg) => {
  if (!arg || typeof arg !== 'object' || !arg.isAxiosError) return arg;
  return {
    name: arg.name,
    message: arg.message,
    code: arg.code,
    status: arg.response?.status,
    method: arg.config?.method,
    url: safeUrl(arg.config?.url),
  };
};

/**
 * @desc Create a scoped logger for a module.
 * @param {string} module - Logical module name (e.g. 'home', 'auth')
 * @returns {{ error: Function, warn: Function, info: Function }}
 */
export const createLogger = (module) => {
  const tag = `${PREFIX}[${module}]`;
  return {
    error: (...args) => console.error(tag, ...args.map(redact)),
    warn: (...args) => console.warn(tag, ...args.map(redact)),
    info: (...args) => console.info(tag, ...args.map(redact)),
  };
};

/**
 * Exports.
 */
export default { createLogger };
