/**
 * Docs module development config.
 *
 * Auto-discovered by `scripts/generateConfig.js` (Layer 1 — module defaults,
 * loaded for every environment) via the `.development.config.js` suffix. Keeps
 * the docs module's defaults co-located with the module while staying merged
 * into the generated config; mirrors `legal/config/legal.development.config.js`.
 *
 * Re-exports the canonical `docs.config.js` so there is a single source of
 * truth for the module's client-side defaults.
 */
export { default } from './docs.config.js';
