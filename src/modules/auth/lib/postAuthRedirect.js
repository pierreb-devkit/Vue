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
 * Accepts only strings starting with a SINGLE `/`. Rejects: any ASCII control
 * character (tab/CR/LF smuggling, e.g. `/\t//evil.example.com`) or raw backslash;
 * a value that, once percent-decoded, starts with `//` or `/\` (e.g.
 * `/%2F%2Fevil.example.com`, `/%5C%5Cevil.example.com` — both browser-normalized
 * to a protocol-relative URL, i.e. an open redirect); and anything that isn't a
 * path (absolute URLs, non-strings, empty strings) — enforced by re-parsing
 * `value` against a placeholder origin and requiring that origin to survive.
 * @param {*} value - Candidate redirect target (typically `$route.query.redirect`).
 * @returns {boolean}
 */
export function isSafeRedirect(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (value[0] !== '/' || value[1] === '/') return false;
  // ASCII control chars are exactly the tab/CR/LF-smuggling open-redirect surface this check exists to reject.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(value) || value.includes('\\')) return false;

  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false; // Malformed percent-encoding — never a valid path.
  }
  if (decoded.startsWith('//') || decoded.startsWith('/\\')) return false;

  // A same-origin path can never change the origin when resolved against any base.
  return new URL(value, 'https://placeholder.invalid').origin === 'https://placeholder.invalid';
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
 * @desc Shared validation for a raw localStorage record: malformed JSON, a
 * missing/non-numeric `ts`, an expired `ts`, or a `path` that no longer passes
 * `isSafeRedirect` all resolve to `null`. Used by both `consumePostAuthRedirect`
 * (which additionally deletes the record) and `peekPostAuthRedirect` (which
 * never does) so the validity rule can't drift between the two readers.
 * @param {string|null} raw - The raw `localStorage.getItem` result.
 * @param {number} ttlMs - How long a record stays valid, in ms.
 * @returns {string|null}
 */
function readValidPath(raw, ttlMs) {
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
  return readValidPath(raw, ttlMs);
}

/**
 * @desc Read (but do NOT consume) the persisted redirect: same validity rule as
 * `consumePostAuthRedirect` (unexpired, still-safe), but never deletes the
 * record either way. Used by the app's OWN internal auth links (verifyEmail's
 * "Back to Sign In", token's OAuth-error "Sign In"/"Sign Up") so the guest's
 * original intent carries forward via `?redirect=` when navigating within the
 * app — the next view's `created()` re-saves it. A bare external visit to
 * `/signin` or `/signup` (no `?redirect=` query) still gets any record cleared
 * by that view's `created()` — peeking never prevents that.
 * @param {{ cookie: { prefix: string } }} config
 * @param {{ ttlMs?: number }} [options]
 * @returns {string|null}
 */
export function peekPostAuthRedirect(config, { ttlMs = POST_AUTH_REDIRECT_TTL_MS } = {}) {
  let raw;
  try {
    raw = localStorage.getItem(storageKey(config));
  } catch {
    return null;
  }
  return readValidPath(raw, ttlMs);
}

/**
 * @desc Clear the persisted redirect without reading it — used on signout, and on
 * every signup/signin mount whose `?redirect=` is absent or unsafe, so a record
 * planted by an attacker link (opened, then abandoned) never outlives its author
 * and hijacks the next unrelated person who authenticates on the same browser.
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
