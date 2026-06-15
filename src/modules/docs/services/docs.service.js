/**
 * Docs HTTP service.
 *
 * Pure HTTP layer for the docs module — every function wraps an axios call and
 * returns the raw axios response. State mutation, error normalization, and
 * control-flow conventions all live in `docs.store.js` (Devkit Vue norm:
 * services = HTTP, stores = state).
 *
 * Backend contract (public, unauthenticated):
 *   GET /api/public/docs            → guide tree   `{ data: { categories: [...] } }`
 *   GET /api/public/docs/:slug.md   → article markdown (raw text/markdown body)
 *   GET /api/spec.json              → merged OpenAPI 3 spec (JSON)
 */
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';

/**
 * Resolve the fully-qualified API base URL from runtime config.
 * @returns {string} The `protocol://host:port/base` prefix (e.g. `http://localhost:3010/api`).
 */
const apiBaseUrl = () =>
  `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * Resolve the fully-qualified public docs base URL from runtime config.
 * @returns {string} The `protocol://host:port/base/public/{docs}` prefix.
 */
const docsBase = () => {
  const endpoint = config.api.endPoints?.docs || 'docs';
  return `${apiBaseUrl()}/public/${endpoint}`;
};

/**
 * Fetch the docs guide tree (categories → articles).
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getDocsTree = () => axios.get(`${docsBase()}/`);

/**
 * Fetch a single article's raw markdown by slug.
 * The backend serves `*.md` as a plain-text body; `responseType: 'text'` keeps
 * axios from JSON-parsing it (a markdown body starting with `{` would otherwise
 * be mis-handled).
 * @param {string} slug - The article slug.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getDocArticle = (slug) =>
  axios.get(`${docsBase()}/${encodeURIComponent(slug)}.md`, { responseType: 'text' });

/**
 * Fetch the merged OpenAPI 3 spec served by the backend.
 * Served at `${api.base}/spec.json` (sibling of `public/`, not under it) — the
 * same JSON the standalone Redoc UI (`/api/docs`) consumes.
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getSpec = () => axios.get(`${apiBaseUrl()}/spec.json`);

export default {
  getDocsTree,
  getDocArticle,
  getSpec,
};
