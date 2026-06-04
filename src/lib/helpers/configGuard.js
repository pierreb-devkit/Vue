/**
 * Config guard helpers for Vite build pipeline.
 */

/** @type {{ port: number }} */
const CONFIG_PLACEHOLDER = { port: 8080 };

/**
 * Dev-only hostnames and ports that must never reach a production bundle.
 * Root cause of 2026-05-10 signin-broken :3010 outage (trawl_vue#949).
 */
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);
const DEV_PORTS = new Set(['3000', '3001', '3010', '4000', '5000', '8000', '8080', '8888']);

/**
 * Validate that the application config is fully loaded (not the placeholder)
 * and does not contain dev-default API coordinates in production builds.
 *
 * Behavior in production mode:
 *   - By DEFAULT (warn-only): logs a console.warn for each violation and continues.
 *     This preserves the '{project}.config.js as local-usable template, overridden at
 *     build time via Docker build-args' pattern used by some downstreams (e.g. pierreb_vue).
 *   - STRICT (opt-in): pass `strict: true` or set DEVKIT_VUE_assert_strict=true in the
 *     build environment and read it in vite.config.js before calling this function.
 *     Recommended for projects that were burned by a dev-default leak (e.g. trawl_vue#949).
 *
 * In development/test mode the function is always a no-op.
 *
 * @param {object}  config          - The resolved application config object.
 * @param {string}  mode            - Vite build mode (e.g. 'production', 'development').
 * @param {object}  [options]       - Optional settings.
 * @param {boolean} [options.strict=false] - When true, violations throw instead of warn.
 *   Activate via `{ strict: process.env.DEVKIT_VUE_assert_strict === 'true' }` in
 *   vite.config.js (Node context where process.env is available).
 * @returns {void}
 * @throws {Error} Only when mode is 'production', options.strict is true, and config is
 *   invalid or contains dev defaults.
 */
export const assertConfigLoaded = (config, mode, { strict = false } = {}) => {
  if (mode !== 'production') return;

  /**
   * Report a violation — throw in strict mode, warn otherwise.
   * @param {string} message - Human-readable violation description.
   */
  const report = (message) => {
    if (strict) throw new Error(message);
    console.warn(message);
  };

  const safeConfig = config || CONFIG_PLACEHOLDER;
  const isPlaceholder =
    safeConfig === CONFIG_PLACEHOLDER || (Object.keys(safeConfig).length === 1 && safeConfig.port === 8080 && !safeConfig.host);
  if (isPlaceholder) {
    report('Production build requires a valid config. Run `npm run generateConfig` to generate src/config/index.js before building.');
    // In warn mode, a placeholder config means no api object to inspect — bail early.
    if (!strict) return;
  }

  // Guard against dev-default API host leaking into a prod bundle (trawl_vue#949).
  const apiHost = String(safeConfig?.api?.host || '').trim().toLowerCase();
  if (apiHost && DEV_HOSTS.has(apiHost)) {
    report(
      `Production build has dev-default API host/hostname "${safeConfig?.api?.host}". ` +
        'Set DEVKIT_VUE_api_host to the real host/hostname before building.',
    );
  }

  // Guard against dev-default API port leaking into a prod bundle (trawl_vue#949).
  const apiPort = String(safeConfig?.api?.port || '').trim();
  if (apiPort && DEV_PORTS.has(apiPort)) {
    report(
      `Production build has dev-default API port "${apiPort}". ` +
        'Set DEVKIT_VUE_api_port to "" (empty) or the real port before building.',
    );
  }
};

export { CONFIG_PLACEHOLDER };

export default { assertConfigLoaded, CONFIG_PLACEHOLDER };
