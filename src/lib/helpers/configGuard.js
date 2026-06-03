/**
 * Config guard helpers for Vite build pipeline.
 */

/** @type {{ port: number }} */
const CONFIG_PLACEHOLDER = { port: 8080 };

/**
 * Dev-only hostnames and ports that must never reach a production bundle.
 * Root cause of 2026-05-10 signin-broken :3010 outage (issue #949).
 */
const DEV_HOSTS = new Set(['localhost', '127.0.0.1']);
const DEV_PORTS = new Set(['3000', '3001', '3010', '4000', '5000', '8000', '8080', '8888']);

/**
 * Validate that the application config is fully loaded (not the placeholder)
 * and does not contain dev-default API coordinates in production builds.
 *
 * In production mode:
 *   - A missing/placeholder config is a fatal error (SEO plugins need real values).
 *   - api.host must not be localhost or 127.0.0.1.
 *   - api.port must not be a well-known local dev port.
 * In development/test mode the function is a no-op.
 *
 * @param {object} config - The resolved application config object.
 * @param {string} mode   - Vite build mode (e.g. 'production', 'development').
 * @returns {void}
 * @throws {Error} When mode is 'production' and config is invalid or contains dev defaults.
 */
export const assertConfigLoaded = (config, mode) => {
  if (mode !== 'production') return;

  const safeConfig = config || CONFIG_PLACEHOLDER;
  const isPlaceholder =
    safeConfig === CONFIG_PLACEHOLDER || (Object.keys(safeConfig).length === 1 && safeConfig.port === 8080 && !safeConfig.host);
  if (isPlaceholder) {
    throw new Error(
      'Production build requires a valid config. Run `npm run config` to generate src/config/index.js before building.',
    );
  }

  // Guard against dev-default API host leaking into a prod bundle (#949).
  const apiHost = safeConfig?.api?.host;
  if (apiHost && DEV_HOSTS.has(String(apiHost))) {
    throw new Error(
      `Production build has dev-default API host "${apiHost}". ` +
        'Set DEVKIT_VUE_api_host to the real API URL before building.',
    );
  }

  // Guard against dev-default API port leaking into a prod bundle (#949).
  const apiPort = safeConfig?.api?.port;
  if (apiPort && DEV_PORTS.has(String(apiPort))) {
    throw new Error(
      `Production build has dev-default API port "${apiPort}". ` +
        'Set DEVKIT_VUE_api_port to "" (empty) or the real port before building.',
    );
  }
};

export { CONFIG_PLACEHOLDER };

export default { assertConfigLoaded, CONFIG_PLACEHOLDER };
