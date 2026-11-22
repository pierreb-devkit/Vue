/**
 * Module dependencies.
 */
import posthog from 'posthog-js';

/**
 * @desc Check whether PostHog has been initialized and is ready to capture.
 * @returns {boolean} True when the PostHog SDK instance is loaded.
 */
function isPosthogReady() {
  return !!(posthog && posthog.__loaded);
}

/**
 * @desc Capture an analytics event, guarded by PostHog readiness.
 * @param {string} event - The event name (e.g. 'signup_completed').
 * @param {Object} [properties={}] - Optional properties to attach.
 * @returns {void}
 */
function capture(event, properties = {}) {
  if (!isPosthogReady()) return;
  posthog.capture(event, properties);
}

/**
 * Query params that carry a credential or a one-time secret (an OAuth signed
 * request, authorization code or state). They never reach analytics.
 */
const SENSITIVE_QUERY_PARAMS = ['req', 'code', 'state'];

const PLACEHOLDER_ORIGIN = 'https://placeholder.invalid';

/**
 * @desc Drop the sensitive query params from a route path or a full URL,
 * including inside a `redirect` param that carries another path (the sign-in
 * round trip). A full URL keeps its origin.
 * @param {string} value - Route path or URL, with its query and hash.
 * @returns {string} The same path or URL without the sensitive params.
 */
function stripSensitiveParams(value) {
  if (typeof value !== 'string' || !value.includes('?')) return value;
  let url;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return value;
  }
  // mailto:, capacitor: and the like are not rebuilt (origin would be "null").
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return value;
  let changed = false;
  SENSITIVE_QUERY_PARAMS.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });
  const redirect = url.searchParams.get('redirect');
  const cleanRedirect = redirect && redirect.startsWith('/') ? stripSensitiveParams(redirect) : redirect;
  if (cleanRedirect !== redirect) {
    url.searchParams.set('redirect', cleanRedirect);
    changed = true;
  }
  // Untouched values go out as they came (re-serializing would re-encode them).
  if (!changed) return value;
  const origin = url.origin === PLACEHOLDER_ORIGIN ? '' : url.origin;
  return `${origin}${url.pathname}${url.search}${url.hash}`;
}

/**
 * Event properties the PostHog SDK fills with the page URL or the referrer.
 */
const URL_PROPERTIES = ['$current_url', '$session_entry_url', '$referrer', '$session_entry_referrer', '$initial_current_url', '$initial_referrer', '$external_click_url'];

/**
 * @desc PostHog `before_send` hook: strips the sensitive query params from
 * every URL an event carries (autocapture, pageleave and `$set_once` included,
 * and the clicked links' `href` in autocapture elements),
 * not only from the pageviews sent by `capturePageview`.
 * @param {Object|null} event - The event about to be sent.
 * @returns {Object|null} The same event, its URLs cleaned.
 */
function stripSensitiveEventUrls(event) {
  [event?.properties, event?.$set_once].forEach((props) => {
    if (!props) return;
    URL_PROPERTIES.forEach((key) => {
      if (typeof props[key] === 'string') props[key] = stripSensitiveParams(props[key]);
    });
    // Autocapture click events carry the clicked link's href (a sign-in link can hold `?redirect=/connect?req=…`).
    if (Array.isArray(props.$elements)) {
      props.$elements.forEach((el) => {
        if (el && typeof el.attr__href === 'string') el.attr__href = stripSensitiveParams(el.attr__href);
      });
    }
    // Heatmap data is keyed by the page URL.
    const heatmap = props.$heatmap_data;
    if (heatmap && typeof heatmap === 'object' && !Array.isArray(heatmap)) {
      const clean = {};
      Object.keys(heatmap).forEach((key) => {
        const next = stripSensitiveParams(key);
        const value = heatmap[key];
        clean[next] = Array.isArray(clean[next]) && Array.isArray(value) ? [...clean[next], ...value] : value;
      });
      props.$heatmap_data = clean;
    }
    if (typeof props.$elements_chain === 'string') {
      props.$elements_chain = props.$elements_chain.replace(/href="([^"]*)"/g, (_m, href) => `href="${stripSensitiveParams(href)}"`);
    }
  });
  return event;
}

/**
 * @desc Capture a `$pageview` event for the given route.
 * The URL sent is stripped of credential query params (`stripSensitiveParams`).
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @returns {void}
 */
function capturePageview(to) {
  capture('$pageview', {
    $current_url: stripSensitiveParams(to.fullPath),
    title: to.meta?.title || to.name,
  });
}

/**
 * @desc Associate the current session with a distinct user identity.
 * @param {string | null | undefined} distinctId - Unique user identifier (e.g. user._id). Falsy values are ignored (no-op).
 * @param {Object} [properties={}] - Optional user properties (email, plan, etc.).
 * @returns {void}
 */
function identify(distinctId, properties = {}) {
  if (!isPosthogReady()) return;
  if (!distinctId) return;
  posthog.identify(distinctId, properties);
}

/**
 * @desc Reset the PostHog session (on signout). Clears the current distinct ID.
 * @returns {void}
 */
function reset() {
  if (!isPosthogReady()) return;
  posthog.reset();
}

/**
 * Exports.
 */
export { isPosthogReady, capture, capturePageview, identify, reset, stripSensitiveParams, stripSensitiveEventUrls };
export default { isPosthogReady, capture, capturePageview, identify, reset, stripSensitiveParams, stripSensitiveEventUrls };
