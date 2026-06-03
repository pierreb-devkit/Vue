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
     *
     * Sort order: `meta.order` ascending (lower first), then `meta.action` desc as tiebreaker.
     * Routes without `meta.order` fall to the end (treated as `+Infinity`), preserving the
     * legacy ordering for backward compat. Use increments of 10 (10, 20, 30...) so downstream
     * projects can slot routes between stack ones without renumbering.
     * @param {boolean} isLoggedIn - Whether the current user is authenticated.
     * @returns {void}
     */
    refreshNav(isLoggedIn) {
      const visible = pickBy(this.routes, (i) => {
        const moduleDisplay = config.modules?.[i.name]?.display;
        if (moduleDisplay !== false && i.meta.display !== false && i.meta.icon) {
          if (!('action' in i.meta)) return i; // no guard, always displayed
          if (isLoggedIn && ability.can(i.meta.action, i.meta.subject)) return i;
        }
        return null;
      });

      this.nav = orderBy(
        pickBy(visible, (i) => i.meta.position !== 'bottom'),
        [(i) => i.meta.order ?? Number.POSITIVE_INFINITY, 'meta.action'],
        ['asc', 'desc'],
      );
      this.navBottom = orderBy(
        pickBy(visible, (i) => i.meta.position === 'bottom'),
        [(i) => i.meta.order ?? Number.POSITIVE_INFINITY, 'meta.action'],
        ['asc', 'desc'],
      );
    },
  },
});

/**
 * Exports.
 */
export default useCoreStore;
