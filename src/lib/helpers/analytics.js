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
 * @desc Capture a `$pageview` event for the given route.
 * @param {import('vue-router').RouteLocationNormalized} to - Target route.
 * @returns {void}
 */
function capturePageview(to) {
  capture('$pageview', {
    $current_url: to.fullPath,
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
export { isPosthogReady, capture, capturePageview, identify, reset };
export default { isPosthogReady, capture, capturePageview, identify, reset };
