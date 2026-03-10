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
     * @desc Rebuild the navigation list based on current login state and CASL
     *       abilities.  Falls back to a simple `isLoggedIn` check when no
     *       ability rules are available (backward compatibility).
     * @param {boolean} isLoggedIn - Whether the current user is authenticated.
     * @returns {void}
     */
    refreshNav(isLoggedIn) {
      const hasAbilities = ability && ability.rules && ability.rules.length > 0;

      const nav = orderBy(
        pickBy(this.routes, (i) => {
          if (i.meta.display !== false) {
            // hidden item
            if (!('action' in i.meta)) return i; // no guard, always displayed
            if (isLoggedIn) {
              if (hasAbilities) {
                // Use CASL abilities when available
                if (ability.can(i.meta.action, i.meta.subject)) return i;
              } else {
                // Fallback: no abilities yet (backend not updated), allow if logged in
                return i;
              }
            }
          }
          return null;
        }),
        ['meta.action'],
        ['desc'],
      );

      this.nav = nav;
    },
  },
});

/**
 * Exports.
 */
export default useCoreStore;
