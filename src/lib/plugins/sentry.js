/**
 * Module dependencies.
 */
import * as Sentry from '@sentry/vue';

/**
 * Plugin setup.
 */
export default {
  /**
   * Installs Sentry error tracking and performance monitoring for the Vue application.
   *
   * @param {import('vue').App} app - The Vue application instance to enhance with Sentry.
   * @param {Object} [options={}] - Plugin options.
   * @param {import('vue-router').Router} [options.router] - Vue Router instance for browser tracing integration.
   * @returns {void}
   */
  install(app, { router } = {}) {
    const sentryConfig = app.config.globalProperties.config.analytics.sentry;
    if (
      sentryConfig
      && sentryConfig.dsn
      && sentryConfig.enabled !== false
    ) {
      const integrations = [];
      if (router) {
        integrations.push(Sentry.browserTracingIntegration({ router }));
      }
      Sentry.init({
        app,
        dsn: sentryConfig.dsn,
        environment: sentryConfig.environment || 'development',
        integrations,
        tracesSampleRate: sentryConfig.tracesSampleRate ?? 0.1,
      });
    }
  },
};
