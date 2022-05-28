/**
 * Module dependencies.
 */
// import _ from 'lodash';
import _ from 'lodash';
import * as theme from '../../../lib/helpers/theme';
import config from '../../../config/index.cjs';

/**
 * Getters: get state
 */
const getters = {
  drawer: (state) => state.drawer,
  theme: (state) => state.theme,
  nav: (state) => state.nav,
};

/**
 * Actions
 */
const actions = (app) => {
  return {
    refreshNav: ({ commit, rootGetters }) => {
      const userRoles = localStorage.getItem(`${config.cookie.prefix}UserRoles`)
        ? localStorage.getItem(`${config.cookie.prefix}UserRoles`).split(',')
        : [];
      const nav = _.orderBy(
        _.pickBy(app.config.globalProperties.routes, (i) => {
          if (i.meta.display !== false) {
            // hidden item
            if (!('roles' in i.meta)) return i; // auth undefined, always displayed
            if (!i.meta.roles && !rootGetters.isLoggedIn) return i; // auth false, not logged
            if (i.meta.roles && rootGetters.isLoggedIn && i.meta.roles.some((r) => userRoles.includes(r))) {
              return i; // auth true and loggedd
            }
          }
          return null;
        }),
        ['meta.roles'],
        ['desc'],
      );
      commit('set_nav', nav);
    },
  };
};

/**
 * Mutation:change state in a Vuex store is by committing a mutation
 */
const mutations = {
  set_drawer(state, data) {
    state.drawer = data;
  },
  set_mini(state, data) {
    state.mini = data;
  },
  set_nav(state, data) {
    state.nav = data;
  },
};

/**
 * State
 */
const state = (app) => {
  return {
    drawer: app.config.globalProperties.config.vuetify.theme.navigation.drawer.model,
    theme: theme.isDark(app.config.globalProperties.config.vuetify.theme.dark) ? 'dark' : 'light',
    nav: [],
  };
};

/**
 * Export default
 */
export default (app) => {
  return {
    state: state(app),
    getters,
    actions: actions(app),
    mutations,
  };
};
