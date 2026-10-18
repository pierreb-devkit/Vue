/**
 * referral.js
 * ===========
 * Shareable referral link capture (Vue#4754 / Node#4212).
 *
 * A visitor landing on any route with `?ref=<code>` has the code kept locally
 * (localStorage, short TTL) until they sign up with email/password; signup()
 * sends it as `ref` and clears it. The code is opaque here: the server decodes
 * and validates it, an unknown code never blocks a signup.
 */

/** localStorage key holding `{ code, at }`. */
export const REFERRAL_LS_KEY = 'referral_v1';

/** How long a captured code is kept before signup (7 days). */
export const REFERRAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Shape accepted client-side (server accepts up to 64 chars). */
const CODE_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * @desc Run a localStorage operation, swallowing storage errors (private mode, blocked storage).
 * @param {Function} fn - operation receiving the storage object
 * @returns {*} the operation result, or null when storage is unavailable
 */
function withStorage(fn) {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    return fn(localStorage);
  } catch {
    return null;
  }
}

/**
 * @desc Capture `?ref=` from the current URL into localStorage. A newer valid code
 * replaces an older one (last link clicked wins). No-op without a valid `ref`.
 * @returns {void}
 */
export function captureRef() {
  withStorage((storage) => {
    const code = new URLSearchParams(window.location.search).get('ref')?.trim();
    if (code && CODE_PATTERN.test(code)) storage.setItem(REFERRAL_LS_KEY, JSON.stringify({ code, at: Date.now() }));
    return null;
  });
}

/**
 * @desc Remove the stored referral code.
 * @returns {void}
 */
export function clearRef() {
  withStorage((storage) => storage.removeItem(REFERRAL_LS_KEY));
}

/**
 * @desc Read the stored referral code. An expired or malformed record is cleared.
 * @returns {string|null} the code, or null when absent, expired or unavailable
 */
export function getRef() {
  return withStorage((storage) => {
    const raw = storage.getItem(REFERRAL_LS_KEY);
    if (!raw) return null;
    try {
      const { code, at } = JSON.parse(raw);
      if (typeof code === 'string' && CODE_PATTERN.test(code) && Number.isFinite(at) && Date.now() - at < REFERRAL_TTL_MS) return code;
    } catch {
      // malformed record, cleared below
    }
    storage.removeItem(REFERRAL_LS_KEY);
    return null;
  });
}

/**
 * Exports.
 */
export default { captureRef, getRef, clearRef };
