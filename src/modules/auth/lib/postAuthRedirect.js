/**
 * Post-auth redirect persistence.
 *
 * A guest arriving on signup/signin with `?redirect=/some/path` expects to land back
 * there after authenticating. That works for free within a single tab (the query
 * param survives the form submit), but two flows leave the tab entirely:
 *  - Email verification: the link opens in a NEW TAB, so `sessionStorage` (scoped to
 *    the tab that wrote it) is empty when the link is opened. `localStorage` is the
 *    only browser storage visible from a fresh tab.
 *  - OAuth (Google/Apple): the provider round-trip drops the original `?redirect=`
 *    query entirely — the callback view (token.view.vue) never sees it.
 *
 * This module centralises the save/read/clear of that one record so every consumer
 * (signup, signin, verifyEmail, token, signout) shares the same key, TTL and
 * open-redirect guard instead of re-deriving `startsWith('/')` inline.
 */

/**
 * @type {number} How long a persisted redirect stays valid (24 hours).
 */
export const POST_AUTH_REDIRECT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @desc Build the localStorage key for the current project (config-driven prefix,
 * matches the sibling keys in auth.store.js: `${prefix}CookieExpire`, etc.).
 * @param {{ cookie: { prefix: string } }} config - App config (`this.config` in views).
 * @returns {string}
 */
function storageKey(config) {
  return `${config.cookie.prefix}PostAuthRedirect`;
}

/**
 * @desc Whether a value is safe to redirect to after auth: a same-origin path.
 * Accepts only strings starting with a SINGLE `/` — rejects `//host` and `/\host`
 * (both browser-normalized to a protocol-relative URL, i.e. an open redirect) and
 * anything that isn't a path (absolute URLs, non-strings, empty strings).
 * @param {*} value - Candidate redirect target (typically `$route.query.redirect`).
 * @returns {boolean}
 */
export function isSafeRedirect(value) {
  return typeof value === 'string' && value.length > 0 && value[0] === '/' && value[1] !== '/' && value[1] !== '\\';
}

/**
 * @desc Persist a safe redirect path so it survives a new-tab or OAuth round-trip.
 * A no-op when `path` isn't a safe same-origin path — never stores an open-redirect
 * target. Storage failures (private browsing, disabled storage) are swallowed: a
 * lost redirect just falls back to `config.sign.route` later, never a hard error.
 * @param {{ cookie: { prefix: string } }} config
 * @param {*} path - Candidate redirect target.
 * @returns {void}
 */
export function savePostAuthRedirect(config, path) {
  if (!isSafeRedirect(path)) return;
  try {
    localStorage.setItem(storageKey(config), JSON.stringify({ path, ts: Date.now() }));
  } catch {
    // Storage unavailable — the redirect is best-effort, not required.
  }
}

/**
 * @desc Read and CONSUME (single-use) the persisted redirect: valid, unexpired,
 * still-safe record → its path; anything else (absent, malformed, expired, or a
 * path that no longer passes `isSafeRedirect`) → `null`. Always clears the record
 * so a stale or already-honoured redirect never resurfaces on a later auth event.
 * @param {{ cookie: { prefix: string } }} config
 * @param {{ ttlMs?: number }} [options]
 * @returns {string|null}
 */
export function consumePostAuthRedirect(config, { ttlMs = POST_AUTH_REDIRECT_TTL_MS } = {}) {
  const key = storageKey(config);
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Best-effort cleanup — a failed removeItem still returns whatever was read.
  }
  if (!raw) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.ts !== 'number' || !isSafeRedirect(parsed.path)) return null;
  if (Date.now() - parsed.ts > ttlMs) return null;
  return parsed.path;
}

/**
 * @desc Clear the persisted redirect without reading it — used on signout so a
 * guest's abandoned redirect never resurfaces for the next, unrelated session.
 * @param {{ cookie: { prefix: string } }} config
 * @returns {void}
 */
export function clearPostAuthRedirect(config) {
  try {
    localStorage.removeItem(storageKey(config));
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}

/**
 * @desc Resolve the post-auth destination shared by signup.view.vue's
 * `pushAfterAuth` and signin.view.vue's `validate()`: prefer the live
 * `?redirect=` query (same-tab form submit), else fall back to the persisted
 * record (the only source left once a step away from the tab dropped the
 * query string). ALWAYS consumes the persisted record — even when the query
 * wins — so an honored query never leaves a stale one behind for a later,
 * unrelated auth event.
 * @param {{ cookie: { prefix: string } }} config
 * @param {*} queryRedirect - `$route.query.redirect`, typically.
 * @returns {string|null} A safe path, or `null` when neither source has one
 *   (caller falls back to `config.sign.route`).
 */
export function resolvePostAuthRedirect(config, queryRedirect) {
  const stored = consumePostAuthRedirect(config);
  return isSafeRedirect(queryRedirect) ? queryRedirect : stored;
}

/**
 * @desc Build a `router-link` `:to` target that forwards the current
 * `?redirect=` when it's safe — used by the signup ↔ signin cross-links so a
 * guest who takes the "other" link doesn't lose the intended destination.
 * @param {string} path - Cross-link target, e.g. '/signin'.
 * @param {*} queryRedirect - `$route.query.redirect`, typically.
 * @returns {{ path: string, query: Object }}
 */
export function withRedirectQuery(path, queryRedirect) {
  return { path, query: isSafeRedirect(queryRedirect) ? { redirect: queryRedirect } : {} };
}
