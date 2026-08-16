/**
 * attribution.js
 * ==============
 * Write-once first-touch attribution capture (issue #4520).
 *
 * Captures referrer / landing path / UTM params from the very first page a
 * visitor lands on, so signup() can send them along with the payload. Uses
 * sessionStorage ONLY — never cookies, never localStorage, no persistent
 * identifier. First-touch wins: once a record exists for the session, later
 * navigations never overwrite it.
 */

/** sessionStorage key used to persist the first-touch attribution record. */
export const ATTRIBUTION_SS_KEY = 'attribution_v1';

/** Max length enforced on `referrer` / `landingPath`. */
const URL_FIELD_MAX_LENGTH = 2048;
/** Max length enforced on each individual UTM field. */
const UTM_FIELD_MAX_LENGTH = 256;

/** Maps URL query param names to their camelCase wire field name. */
const UTM_PARAM_MAP = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_term: 'utmTerm',
  utm_content: 'utmContent',
};

/** Whitelist of the 7 known wire keys, mapped to their max length. Any other key is dropped. */
const KNOWN_FIELDS = {
  referrer: URL_FIELD_MAX_LENGTH,
  landingPath: URL_FIELD_MAX_LENGTH,
  utmSource: UTM_FIELD_MAX_LENGTH,
  utmMedium: UTM_FIELD_MAX_LENGTH,
  utmCampaign: UTM_FIELD_MAX_LENGTH,
  utmTerm: UTM_FIELD_MAX_LENGTH,
  utmContent: UTM_FIELD_MAX_LENGTH,
};

/**
 * @desc Returns true when running in a browser environment with sessionStorage available.
 * @returns {boolean}
 */
function isBrowser() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

/**
 * @desc Trim a value and cap it to maxLength. Non-string / empty-after-trim input yields undefined.
 * @param {*} value - Raw value to normalise.
 * @param {number} maxLength - Maximum length to keep.
 * @returns {string|undefined}
 */
function trimAndCap(value, maxLength) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

/**
 * @desc Determine whether a referrer URL shares the current page's origin.
 * @param {string} referrer - `document.referrer` value.
 * @returns {boolean}
 */
function isSameOrigin(referrer) {
  try {
    return new URL(referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * @desc Build the first-touch attribution record from the current document/location.
 * @returns {object|null} The record, or null when there is nothing to capture.
 */
function buildAttribution() {
  const record = {};

  const referrer = document.referrer;
  if (referrer && !isSameOrigin(referrer)) {
    const capped = trimAndCap(referrer, URL_FIELD_MAX_LENGTH);
    if (capped) record.referrer = capped;
  }

  const landingPath = trimAndCap(`${window.location.pathname}${window.location.search}`, URL_FIELD_MAX_LENGTH);
  if (landingPath) record.landingPath = landingPath;

  const params = new URLSearchParams(window.location.search);
  Object.entries(UTM_PARAM_MAP).forEach(([queryKey, field]) => {
    const capped = trimAndCap(params.get(queryKey), UTM_FIELD_MAX_LENGTH);
    if (capped) record[field] = capped;
  });

  return Object.keys(record).length > 0 ? record : null;
}

/**
 * @desc Sanitize a raw parsed attribution record read back from sessionStorage: whitelist
 * to the 7 known wire keys, drop any other key, drop non-string values, re-apply trim +
 * length caps. Guards against a tampered/extension-injected key reaching the strict Zod
 * signup endpoint (an unexpected key would 422 the whole payload).
 * @param {object} parsed - Raw parsed JSON object.
 * @returns {object|null} Sanitized record, or null when nothing valid remains.
 */
function sanitizeAttribution(parsed) {
  const record = {};
  Object.entries(KNOWN_FIELDS).forEach(([key, maxLength]) => {
    const capped = trimAndCap(parsed[key], maxLength);
    if (capped) record[key] = capped;
  });
  return Object.keys(record).length > 0 ? record : null;
}

/**
 * @desc Capture first-touch attribution (referrer, landing path, UTM params) into
 * sessionStorage. Write-once: if a record already exists for this session, does
 * nothing. Never uses cookies or localStorage, never stores a persistent identifier.
 * Safe no-op when storage/window is unavailable (private mode, SSR, unit tests).
 * @returns {void}
 */
export function captureFirstTouch() {
  if (!isBrowser()) return;
  try {
    if (sessionStorage.getItem(ATTRIBUTION_SS_KEY) !== null) return;
    const record = buildAttribution();
    if (record) sessionStorage.setItem(ATTRIBUTION_SS_KEY, JSON.stringify(record));
  } catch {
    // sessionStorage unavailable (private mode / sandboxed) — silent no-op
  }
}

/**
 * @desc Returns the stored first-touch attribution record.
 * @returns {object|null} The record, or null when absent, unavailable, or malformed.
 */
export function getAttribution() {
  if (!isBrowser()) return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_SS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return sanitizeAttribution(parsed);
  } catch {
    return null;
  }
}

/**
 * Exports.
 */
export default { captureFirstTouch, getAttribution };
