/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { pickBy, orderBy } from 'lodash-es';
import { isDark } from '../../../lib/helpers/theme';
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

    refreshNav(isLoggedIn) {
      const userRoles = localStorage.getItem(`${config.cookie.prefix}UserRoles`)
        ? localStorage.getItem(`${config.cookie.prefix}UserRoles`).split(',')
        : [];

      const nav = orderBy(
        pickBy(this.routes, (i) => {
          if (i.meta.display !== false) {
            // hidden item
            if (!('roles' in i.meta)) return i; // auth undefined, always displayed
            if (!i.meta.roles && !isLoggedIn) return i; // auth false, not logged
            if (i.meta.roles && isLoggedIn && i.meta.roles.some((r) => userRoles.includes(r))) {
              return i; // auth true and logged
            }
          }
          return null;
        }),
        ['meta.roles'],
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
