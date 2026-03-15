/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { pickBy, orderBy } from 'lodash-es';
import { isDark } from '../../../lib/helpers/theme';
import { ability } from '../../../lib/helpers/ability';
import config from '../../../lib/services/config';

// Variable globale pour stocker les routes
let routes = null;

/**
 * Store definition.
 */
export const useCoreStore = defineStore('core', {
  state: () => ({
    drawer: false,
    theme: 'light',
    mini: false,
    nav: [],
    navBottom: [],
    routes: [],
  }),

  actions: {
    init(appRoutes) {
      routes = appRoutes;
      this.theme = isDark(config.vuetify.theme.dark) ? 'dark' : 'light';
      this.routes = routes;
    },

    setDrawer(value) {
      this.drawer = value;
    },

    setMini(value) {
      this.mini = value;
    },

    /**
     * @desc Rebuild the navigation list based on current login state and CASL abilities.
     * @param {boolean} isLoggedIn - Whether the current user is authenticated.
     * @returns {void}
     */
    refreshNav(isLoggedIn) {
      const visible = pickBy(this.routes, (i) => {
        if (i.meta.display !== false) {
          if (!('action' in i.meta)) return i; // no guard, always displayed
          if (isLoggedIn && ability.can(i.meta.action, i.meta.subject)) return i;
        }
        return null;
      });

      this.nav = orderBy(
        pickBy(visible, (i) => i.meta.position !== 'bottom'),
        ['meta.action'],
        ['desc'],
      );
      this.navBottom = orderBy(
        pickBy(visible, (i) => i.meta.position === 'bottom'),
        ['meta.action'],
        ['desc'],
      );
    },
  },
});

/**
 * Exports.
 */
export default useCoreStore;
