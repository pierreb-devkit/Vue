/**
 * Module dependencies.
 */
import Vue from 'vue';
import VueMatomo from 'vue-matomo';

if (Vue.prototype.config.analytics.matomo && Vue.prototype.config.analytics.matomo.host) {
  Vue.use(VueMatomo, Vue.prototype.config.analytics.matomo);
}
