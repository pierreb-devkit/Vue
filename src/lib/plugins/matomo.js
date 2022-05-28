/**
 * Module dependencies.
 */
import VueMatomo from 'vue-matomo';

/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    if (app.config.globalProperties.config.analytics.matomo && app.config.globalProperties.config.analytics.matomo.host) {
      app.use(VueMatomo, app.config.globalProperties.config.analytics.matomo);
    }
  },
};
