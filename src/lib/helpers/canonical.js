/**
 * Canonical URL helper.
 */

/**
 * @desc Build a self-referential canonical (or og:url) URL for a given route path.
 * Joins a base origin with the route's pathname only — any query string or hash
 * is dropped, and slashes are normalised so every route yields a single, stable
 * absolute URL. Used at runtime by the app head so each prerendered page
 * canonicalises to itself rather than to the homepage.
 * @param {string} baseUrl - Absolute origin (e.g. 'https://example.com'); trailing slashes are stripped
 * @param {string} [path='/'] - Route path (e.g. '/docs/a'); query/hash are ignored
 * @returns {string} Absolute canonical URL, or '' when baseUrl is falsy
 */
export const buildCanonicalUrl = (baseUrl, path = '/') => {
  if (!baseUrl) return '';
  const base = String(baseUrl).replace(/\/+$/, '');
  const raw = String(path ?? '/').split(/[?#]/)[0];
  const cleanPath = `/${raw.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  // Root path → bare base (no trailing slash); otherwise append the normalised path.
  return cleanPath === '/' ? base : base + cleanPath;
};

/**
 * Exports.
 */
export default { buildCanonicalUrl };
