/**
 * Module dependencies.
 */
import posthog from 'posthog-js';

/**
 * Normalise a boolean-like value.
 * Returns true only for boolean true or the string 'true' (from Docker ARG / env var).
 * All other values evaluate to false.
 * @param {*} value - Value to test for explicit enabled state
 * @returns {boolean}
 */
const isEnabled = (value) => value === true || value === 'true';

/**
 * Plugin setup.
 */
export default {
  /**
   * Installs PostHog analytics for the Vue application.
   *
   * Default-safe: with only `key` set, only pageviews and custom events are
   * captured. All advanced features (autocapture, session replay, error
   * tracking, feature flags, surveys, web vitals, pageleave, cookieless
   * mode) are opt-in via config flags — all default to false.
   *
   * String values ('true'/'false') from Docker build-args are normalised so
   * that downstream projects can pass flags as build-arg strings.
   *
   * @param {import('vue').App} app - The Vue application instance.
   * @returns {void}
   */
  install(app) {
    const phConfig = app.config.globalProperties.config?.analytics?.posthog;
    if (!phConfig?.key) return;

    const sessionReplayEnabled = isEnabled(phConfig.sessionReplay);
    const cookielessModeEnabled = isEnabled(phConfig.cookielessMode);

    posthog.init(phConfig.key, {
      api_host: phConfig.host || 'https://us.i.posthog.com',

      opt_out_capturing_by_default: true,
      persistence: 'memory',
      opt_in_site_apps: false,

      autocapture: isEnabled(phConfig.autoCapture),
      capture_pageleave: isEnabled(phConfig.capturePageleave),

      disable_session_recording: !sessionReplayEnabled,
      ...(sessionReplayEnabled && {
        session_recording: { maskAllInputs: true },
      }),

      advanced_disable_feature_flags: !isEnabled(phConfig.featureFlags),

      disable_surveys: !isEnabled(phConfig.surveys),
      capture_performance: isEnabled(phConfig.webVitals),

      // Requires cookieless mode enabled in the PostHog project dashboard —
      // otherwise cookieless events are silently ignored server-side.
      // 'on_reject': stay on standard cookie/localStorage capture while the
      // user is opted in; switch to the anonymous cookieless sentinel
      // identity (no cookie, no persistent identifier) once they reject.
      ...(cookielessModeEnabled && { cookieless_mode: 'on_reject' }),
    });

    app.config.globalProperties.$posthog = posthog;
  },
};
