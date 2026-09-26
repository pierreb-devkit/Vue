/**
 * Configuration service.
 * Exports application configuration for use in stores and services.
 */
import config from '../../config/index.js';
import { formatApiUrl } from './apiUrl.js';

/**
 * Build the fully-qualified API base URL from runtime config.
 * Single source for the `protocol://host:port/base` prefix — every store/service/view
 * that talks to the API derives its URL from this instead of inlining the expression.
 * @returns {string} The `protocol://host:port/base` prefix (e.g. `http://localhost:3000/api`).
 */
export const apiBase = () => formatApiUrl(config.api);

/**
 * Exports.
 */
export default config;
