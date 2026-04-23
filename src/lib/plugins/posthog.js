/**
 * Module dependencies.
 */
import posthog from 'posthog-js';

/**
 * Normalise a boolean-like value.
 * Accepts true (boolean) or 'true' (string from Docker ARG / env var).
 * @param {*} value
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

      // autocapture: opt-in (clicks, inputs, form submissions)
      autocapture: isEnabled(phConfig.autoCapture),

      // pageleave: opt-in
      capture_pageleave: isEnabled(phConfig.capturePageleave),

      // session replay: opt-in — when off, recording is disabled
      disable_session_recording: !sessionReplayEnabled,
      ...(sessionReplayEnabled && {
        session_recording: { maskAllInputs: true },
      }),

      // feature flags: when not opted-in, bootstrap with empty flags to
      // prevent the initial network fetch
      ...(!isEnabled(phConfig.featureFlags) && {
        bootstrap: { featureFlags: {} },
      }),

      loaded: (ph) => {
        // surveys: disable when not opted-in
        if (!isEnabled(phConfig.surveys)) {
          try { ph.config.disable_surveys = true; } catch (e) { /* best-effort config */ } // eslint-disable-line no-unused-vars
        }
        // web vitals: disable when not opted-in
        if (!isEnabled(phConfig.webVitals)) {
          try { ph.config.__add_tracing_headers = false; } catch (e) { /* best-effort config */ } // eslint-disable-line no-unused-vars
        }
      },
    });

    app.config.globalProperties.$posthog = posthog;
  },
};
