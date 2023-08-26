/**
 * Module dependencies.
 */
import { createApp } from 'vue';
import { createMetaManager, plugin as metaPlugin } from 'vue-meta';
import store from './modules/_app/app.store';
import router from './modules/_app/app.router';
import plugins from './lib/plugins';
import config from './config/index.cjs';
import App from './modules/_app/app.vue';

const app = createApp(App);

app.config.globalProperties.config = config;

app
  .use(store(app))
  .use(router(app))
  .use(createMetaManager())
  .use(metaPlugin)
  .use(plugins.aos)
  .use(plugins.axios)
  .use(plugins.images)
  .use(plugins.lodash)
  .use(plugins.markdown)
  .use(plugins.posthog)
  .use(plugins.moment)
  .use(plugins.vuetify)
  .use(plugins.gravatar)
  .mount('#app');
