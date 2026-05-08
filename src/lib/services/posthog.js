/**
 * Module dependencies.
 */
import posthog from 'posthog-js';

// ---------------------------------------------------------------------------
// Module-scope initialization flag — prevents double-init across callers.
// ---------------------------------------------------------------------------
let _initialized = false;

/**
 * Test-only helper to reset the module-scope `_initialized` flag between test cases.
 * NOT for production use.
 * @internal
 * @returns {void}
 */
export function __resetPostHogServiceForTests() {
  _initialized = false;
}

/**
 * @desc Initialize PostHog with GDPR-safe defaults.
 *
 * Idempotent: a second call is a no-op when PostHog is already loaded.
 * Returns null when `enabled` is false or the project key is missing,
 * so callers can check initialization without importing posthog-js directly.
 *
 * Key is read from `import.meta.env.DEVKIT_VUE_POSTHOG_KEY` (public-by-design,
 * injected at build time). Host falls back to the EU PostHog cloud endpoint.
 *
 * GDPR gating: `opt_out_capturing_by_default: true` ensures no event is sent
 * until the user explicitly accepts cookies via `optInTracking()`.
 *
 * @param {{ enabled?: boolean }} [options]
 * @param {boolean} [options.enabled=true] - Pass false to skip initialization
 *   (e.g. in development or when the feature is toggled off).
 * @returns {object|null} The posthog singleton or null when not initialized.
 */
function initPostHog({ enabled = true } = {}) {
  if (!enabled) return null;

  const key = import.meta.env.DEVKIT_VUE_POSTHOG_KEY;
  if (!key) return null;

  // Already initialized (idempotency guard)
  if (posthog.__loaded || _initialized) return posthog;

  const host = import.meta.env.DEVKIT_VUE_POSTHOG_HOST || 'https://eu.i.posthog.com';

  posthog.init(key, {
    api_host: host,

    // GDPR: no data until user explicitly opts in
    opt_out_capturing_by_default: true,
    persistence: 'localStorage+cookie',
    // Only create profiles for identified users — avoids anonymous profile quota waste
    person_profiles: 'identified_only',

    // Pageview / pageleave tracking
    capture_pageview: true,
    capture_pageleave: true,

    // Autocapture on (standard click/input events)
    autocapture: true,

    // Session recordings disabled by default; projects opt-in per downstream config
    disable_session_recording: true,
  });

  _initialized = true;
  return posthog;
}

/**
 * @desc Check whether PostHog has been initialized and is ready to capture.
 * @returns {boolean}
 */
function isReady() {
  return !!(posthog && posthog.__loaded);
}

/**
 * @desc Opt the current visitor into analytics capturing.
 * No-op when PostHog is not initialized.
 * Call this after the user accepts the cookie consent banner.
 * @returns {void}
 */
function optInTracking() {
  if (!isReady()) return;
  posthog.opt_in_capturing();
}

/**
 * @desc Opt the current visitor out of analytics capturing.
 * No-op when PostHog is not initialized.
 * Call this when the user declines or withdraws cookie consent.
 * @returns {void}
 */
function optOutTracking() {
  if (!isReady()) return;
  posthog.opt_out_capturing();
}

/**
 * @desc Associate subsequent events with a known user identity.
 * No-op when PostHog is not initialized.
 * Call after a successful sign-in.
 *
 * @param {string} distinctId - Unique user identifier (e.g. user._id from the API).
 * @param {Object} [properties={}] - Optional user properties (email, plan, etc.).
 * @returns {void}
 */
function identify(distinctId, properties = {}) {
  if (!isReady()) return;
  posthog.identify(distinctId, properties);
}

/**
 * @desc Reset the PostHog session, generating a new anonymous distinct ID.
 * No-op when PostHog is not initialized.
 * Call on user sign-out so future events are not linked to the previous identity.
 * @returns {void}
 */
function reset() {
  if (!isReady()) return;
  posthog.reset();
}

/**
 * @desc Capture an explicit business event.
 * No-op when PostHog is not initialized.
 *
 * @param {string} event - Event name (e.g. 'signup_completed').
 * @param {Object} [properties={}] - Optional event properties.
 * @returns {void}
 */
function capture(event, properties = {}) {
  if (!isReady()) return;
  posthog.capture(event, properties);
}

/**
 * Exports.
 */
export { initPostHog, isReady, optInTracking, optOutTracking, identify, reset, capture };
export default { initPostHog, isReady, optInTracking, optOutTracking, identify, reset, capture };
