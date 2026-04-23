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

// Initialize stores after all plugins are loaded
initializeStores(routes);

// Wire global error handlers — fan-out to active trackers (Sentry / PostHog)
// Must be set after plugins so Sentry is already initialised
app.config.errorHandler = (err) => {
  captureException(err instanceof Error ? err : new Error(String(err)));
};

app.mount('#app');

// Unhandled promise rejections — browser-level safety net
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    captureException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason ?? 'Unhandled rejection')),
    );
  });
}
