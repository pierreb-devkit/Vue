/**
 * Module dependencies.
 */
import * as Sentry from '@sentry/vue';

/**
 * Plugin setup.
 */
export default {
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
