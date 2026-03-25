/**
 * @desc Shared E2E config loader — reads ports and API settings from the
 *       generated project config (`src/config/index.js`) with safe fallbacks.
 *       This is the single source of truth for all E2E test URLs.
 */

let _config;

try {
  const mod = await import('../../../config/index.js');
  _config = mod.default;
} catch {
  _config = null;
}

const port = _config?.port || 8080;
const apiProtocol = _config?.api?.protocol || 'http';
const apiHost = _config?.api?.host || 'localhost';
const apiPort = _config?.api?.port || '3000';
const apiBase = _config?.api?.base || 'api';

/** @type {string} Vue dev-server base URL, e.g. `http://localhost:8080` */
export const BASE_URL = `http://localhost:${port}`;

/** @type {string} API base URL with path, e.g. `http://localhost:3000/api` */
export const API_URL = `${apiProtocol}://${apiHost}:${apiPort}/${apiBase}`;

/** @type {string} API origin without path, e.g. `http://localhost:3000` */
export const API_ORIGIN = `${apiProtocol}://${apiHost}:${apiPort}`;

/** @type {number} Vue dev-server port */
export { port };
