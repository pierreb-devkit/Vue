/**
 * Module dependencies.
 */
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
 * Capture an exception via PostHog Error Tracking.
 *
 * Active when `config.analytics.posthog.key` is set AND
 * `config.analytics.posthog.errorTracking === true`.
 *
 * Silent no-op when PostHog is not configured or errorTracking is not opted-in.
 * Never throws — tracker errors must never break the calling code.
 *
 * @param {Error} err - Error to capture
 * @param {Object} [ctx] - Optional extra context attached to the event
 * @returns {void}
 */
const captureException = (err, ctx = {}) => {
  // PostHog Error Tracking — only when errorTracking is explicitly opted-in
  try {
    const phConfig = config?.analytics?.posthog;
    if (phConfig?.key && isEnabled(phConfig?.errorTracking)) {
      const isError = err instanceof Error;
      posthog.capture('$exception', {
        $exception_message: isError ? err.message : String(err ?? 'Unknown error'),
        $exception_type: isError ? err.name : typeof err === 'object' ? 'Non-Error' : typeof err,
        $exception_stack: isError ? err.stack : undefined,
        ...ctx,
      });
    }
  } catch { /* tracker must never break caller */ }
};

export { captureException };
export default { captureException };
