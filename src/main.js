/**
 * Module dependencies.
 */
import { createApp } from 'vue';
import { createHead } from '@unhead/vue/client';
import { createPinia } from 'pinia';
import { abilitiesPlugin } from '@casl/vue';
import initializeStores from './modules/app/app.store';
import router from './modules/app/app.router';
import plugins from './lib/plugins';
import config from './config/index.js';
import { ability } from './lib/helpers/ability';
import { captureException } from './lib/helpers/errorTracker.js';
import { initPostHog } from './lib/services/posthog.js';
import App from './modules/app/app.vue';

const app = createApp(App);
const head = createHead();
const pinia = createPinia();

const appRouter = router();
const routes = appRouter.options.routes;
app.config.globalProperties.config = config;
app.config.globalProperties.routes = routes;

app
  .use(head)
  .use(pinia)
  .use(plugins.sentry, { router: appRouter })
  .use(appRouter)
  .use(abilitiesPlugin, ability)
  .use(plugins.aos)
  .use(plugins.images)
  .use(plugins.lodash)
  .use(plugins.markdown)
  .use(plugins.posthog)
  .use(plugins.dayjs)
  .use(plugins.vuetify)
  .use(plugins.i18n)

// Initialize stores after all plugins are loaded
initializeStores(routes);

// Bootstrap PostHog service (idempotent: no-op if plugin already initialized via config key)
initPostHog({ enabled: import.meta.env.PROD });

// Wire global error handlers — fan-out to active trackers (Sentry / PostHog)
// Must be set after plugins so Sentry is already initialised
app.config.errorHandler = (err, instance, info) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const componentName = instance?.$?.type?.name || instance?.$?.type?.__name || instance?.$options?.name;
  const route = appRouter.currentRoute?.value;
  captureException(error, {
    vueInfo: info,
    componentName,
    route: route ? { name: route.name, path: route.path } : undefined,
  });
};

app.mount('#app');

// Window-level safety net — Sentry's native onerror/onunhandledrejection are
// disabled (see plugins/sentry.js) so our fan-out is the single capture path.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    captureException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unhandled rejection')),
    );
  });

  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error
      ? event.error
      : new Error(event.message || 'Uncaught error');
    captureException(error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}
