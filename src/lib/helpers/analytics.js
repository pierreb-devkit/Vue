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
 * Exports.
 */
export { isPosthogReady, capture, capturePageview };
export default { isPosthogReady, capture, capturePageview };
