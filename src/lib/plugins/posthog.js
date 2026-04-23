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
   * tracking, feature flags, surveys, web vitals, pageleave) are opt-in via
   * config flags — all default to false.
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

    posthog.init(phConfig.key, {
      api_host: phConfig.host || 'https://us.i.posthog.com',

      autocapture: isEnabled(phConfig.autoCapture),
      capture_pageleave: isEnabled(phConfig.capturePageleave),

      disable_session_recording: !sessionReplayEnabled,
      ...(sessionReplayEnabled && {
        session_recording: { maskAllInputs: true },
      }),

      ...(!isEnabled(phConfig.featureFlags) && {
        bootstrap: { featureFlags: {} },
      }),

      disable_surveys: !isEnabled(phConfig.surveys),
      capture_performance: isEnabled(phConfig.webVitals),
    });

    app.config.globalProperties.$posthog = posthog;
  },
};
