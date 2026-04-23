/**
 * Module dependencies.
 */
import * as Sentry from '@sentry/vue';
import posthog from 'posthog-js';
import config from '../../config/index.js';

/**
 * Normalise a boolean-like value.
 * Accepts true (boolean), 'true' (string from Docker ARG / env var), or
 * any other truthy value that is strictly === true.
 * @param {*} value
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
  } catch (e) { /* tracker must never break caller */ } // eslint-disable-line no-unused-vars

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
  } catch (e) { /* tracker must never break caller */ } // eslint-disable-line no-unused-vars
};

export { captureException };
export default { captureException };
