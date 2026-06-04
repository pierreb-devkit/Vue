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
const { core: coreStore } = initializeStores(routes);

// Re-apply OS theme on client after hydration so prerendered light markup
// is corrected for users with dark="auto" and a dark system preference.
// The prerender Puppeteer process resolves matchMedia to false (no OS), baking
// a v-theme--light class; this call corrects the Pinia state immediately on
// client bootstrap so Vuetify syncs the right class before first paint.
if (typeof window !== 'undefined' && config.vuetify?.theme?.dark === 'auto') {
  coreStore.syncOsTheme();
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (mql) {
    /**
     * Syncs the theme with OS preference changes.
     * @returns {void}
     */
    const handleOsThemeChange = () => {
      coreStore.syncOsTheme();
    };
    mql.addEventListener('change', handleOsThemeChange);
  }
}

// Wire global error handlers — fan-out to PostHog Error Tracking
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

// Window-level safety net — PostHog is the single capture path for global errors.
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
