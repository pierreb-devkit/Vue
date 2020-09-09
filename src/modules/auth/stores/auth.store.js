/**
 * Module dependencies.
 */
import Vue from 'vue';
import config from '@/config';

const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * Getters: get state
 */
const getters = {
  isLoggedIn: (state) => !!state.cookieExpire,
  authStatus: (state) => state.status,
};

/**
 * Actions
 */
const actions = {
  signin: async ({ commit, dispatch }, params) => {
    try {
      const res = await Vue.prototype.axios({
        url: `${api}/${config.api.endPoints.auth}/signin`,
        data: params,
        method: 'POST',
      });
      localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
      localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
      commit('auth_success', res.data);
      dispatch('refreshNav');
    } catch (err) {
      localStorage.removeItem('token');
      commit('auth_error');
    }
  },
  signup: async ({ commit, dispatch }, params) => {
    try {
      const res = await Vue.prototype.axios({
        url: `${api}/${config.api.endPoints.auth}/signup`,
        data: params,
        method: 'POST',
      });
      localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
      localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
      commit('auth_success', res.data);
      dispatch('refreshNav');
    } catch (err) {
      localStorage.removeItem('token');
      commit('auth_error');
    }
  },
  signout({ commit }) {
    return new Promise((resolve) => {
      commit('auth_logout');
      localStorage.removeItem(`${config.cookie.prefix}UserRoles`);
      localStorage.removeItem(`${config.cookie.prefix}CookieExpire`);
      resolve();
    });
  },
};

/**
 * Mutation: change state in a Vuex store is by committing a mutation
 */
const mutations = {
  auth_request(state) {
    state.status = 'loading';
  },
  auth_success(state, data) {
    state.status = 'success';
    state.cookieExpire = data.tokenExpiresIn;
    state.user = data.user;
  },
  auth_error(state) {
    state.status = 'error';
  },
  auth_logout(state) {
    state.status = '';
    state.cookieExpire = 0;
  },
};

/**
 * State
 */
const state = {
  status: '',
  cookieExpire: localStorage.getItem(`${config.cookie.prefix}CookieExpire`) || 0,
  user: {},
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
