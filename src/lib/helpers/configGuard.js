/**
 * Config guard helpers for Vite build pipeline.
 */

/** @type {{ port: number }} */
const CONFIG_PLACEHOLDER = { port: 8080 };

/**
 * Validate that the application config is fully loaded (not the placeholder).
 * In production mode, a missing config is a fatal error because SEO plugins
 * depend on real values.  In development mode the placeholder is acceptable.
 *
 * @param {object} config - The resolved application config object.
 * @param {string} mode   - Vite build mode (e.g. 'production', 'development').
 * @returns {void}
 * @throws {Error} When mode is 'production' and config is still the placeholder.
 */
export const assertConfigLoaded = (config, mode) => {
  const safeConfig = config || CONFIG_PLACEHOLDER;
  const isPlaceholder =
    safeConfig === CONFIG_PLACEHOLDER || (Object.keys(safeConfig).length === 1 && safeConfig.port === 8080 && !safeConfig.host);
  if (mode === 'production' && isPlaceholder) {
    throw new Error(
      'Production build requires a valid config. Run `npm run config` to generate src/config/index.js before building.',
    );
  }
};

export { CONFIG_PLACEHOLDER };

export default { assertConfigLoaded, CONFIG_PLACEHOLDER };
