/**
 * Sign-in hooks.
 *
 * Optional modules register a callback (from their `<module>.app.js` entry)
 * that the auth store runs after every successful sign-in, once the
 * authenticated server config is loaded. This keeps auth (always on) free of
 * imports into optional modules.
 */

/** @type {Map<string, (ctx: { serverConfig: object|null, user: object|null }) => unknown>} */
const hooks = new Map();

/**
 * @desc Register (or replace) a sign-in hook by id.
 * @param {string} id - Unique hook id (e.g. 'billing-meter-refresh').
 * @param {(ctx: { serverConfig: object|null, user: object|null }) => unknown} fn - Callback; may return a promise.
 * @returns {void}
 */
export const onSignin = (id, fn) => {
  hooks.set(id, fn);
};

/**
 * @desc Remove a sign-in hook by id.
 * @param {string} id - Hook id.
 * @returns {void}
 */
export const offSignin = (id) => {
  hooks.delete(id);
};

/**
 * @desc Run every registered hook. Best-effort: a hook that throws or rejects
 * never breaks the sign-in, and nothing is awaited.
 * @param {{ serverConfig: object|null, user: object|null }} ctx - Session context.
 * @returns {void}
 */
export const runSigninHooks = (ctx) => {
  for (const fn of hooks.values()) {
    try {
      Promise.resolve(fn(ctx)).catch(() => { /* best-effort: a hook failure never blocks sign-in */ });
    } catch {
      /* best-effort: a hook failure never blocks sign-in */
    }
  }
};

/**
 * Exports.
 */
export default { onSignin, offSignin, runSigninHooks };
