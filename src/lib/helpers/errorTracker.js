/**
 * Module dependencies.
 */
import * as Sentry from '@sentry/vue';
import posthog from 'posthog-js';
import config from '../../config/index.js';

/**
 * Normalise a boolean-like value.
 * Returns true only for boolean true or the string 'true' (from Docker ARG / env var).
 * All other values evaluate to false.
 * @param {*} value - Value to test for explicit enabled state
 * @returns {boolean}
 */
const isEnabled = (value) => value === true || value === 'true';

/**
 * Capture an exception, fanning out to all active trackers.
 *
 * - Sentry  : active when `config.analytics.sentry.dsn` is set and
 *             `enabled !== false`
 * - PostHog : active when `config.analytics.posthog.key` is set AND
 *             `config.analytics.posthog.errorTracking === true`
 *
 * Silent no-op when neither tracker is configured.
 * Never throws — tracker errors must never break the calling code.
 *
 * @param {Error} err - Error to capture
 * @param {Object} [ctx] - Optional extra context attached to the event
 * @returns {void}
 */
const captureException = (err, ctx = {}) => {
  // Sentry fan-out
  try {
    const sentryConfig = config?.analytics?.sentry;
    if (sentryConfig?.dsn && sentryConfig?.enabled !== false) {
      Sentry.captureException(err, { extra: ctx });
    }
  } catch { /* tracker must never break caller */ }

  // PostHog fan-out — only when errorTracking is explicitly opted-in
  try {
    const phConfig = config?.analytics?.posthog;
    if (phConfig?.key && isEnabled(phConfig?.errorTracking)) {
      posthog.capture('$exception', {
        $exception_message: err?.message,
        $exception_type: err?.name,
        $exception_stack: err?.stack,
        ...ctx,
      });
    }
  } catch { /* tracker must never break caller */ }
};

export { captureException };
export default { captureException };
