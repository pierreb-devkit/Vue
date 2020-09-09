/**
 * Module dependencies.
 */
// import _ from 'lodash';
import Vue from 'vue';
import _ from 'lodash';
import theme from '@/lib/helpers/theme';
import config from '@/config';

/**
 * Getters: get state
 */
const getters = {
  drawer: (state) => state.drawer,
  mini: (state) => state.mini,
  theme: (state) => state.theme,
  nav: (state) => state.nav,
};

/**
 * Actions
 */
const actions = {
  refreshNav: ({ commit, rootGetters }) => {
    const userRoles = localStorage.getItem(`${config.cookie.prefix}UserRoles`)
      ? localStorage.getItem(`${config.cookie.prefix}UserRoles`).split(',')
      : [];
    const nav = _.orderBy(
      _.pickBy(Vue.prototype.$routes, (i) => {
        if (i.meta.display !== false) {
          // hidden item
          if (!('roles' in i.meta)) return i; // auth undefined, always displayed
          if (!i.meta.roles && !rootGetters.isLoggedIn) return i; // auth false, not logged
          if (
            i.meta.roles &&
            rootGetters.isLoggedIn &&
            i.meta.roles.some((r) => userRoles.includes(r))
          ) {
            return i; // auth true and loggedd
          }
        }
      }),
      ['meta.roles'],
      ['desc'],
    );
    commit('set_nav', nav);
  },
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
const state = {
  drawer: config.vuetify.drawer.model,
  mini: config.vuetify.drawer.mini,
  theme: theme.isDark(config.vuetify.theme.dark) ? 'dark' : 'light',
  nav: [],
};

/**
 * Export default
 */
export default {
  state,
  getters,
  actions,
  mutations,
};
