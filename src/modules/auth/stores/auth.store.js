/**
 * Getters: get state
 */
const getters = {
  isLoggedIn: (state) => !!state.cookieExpire,
  authStatus: (state) => state.status,
  auth: (state) => state.auth,
  mail: (state) => state.mail,
};

/**
 * Actions
 */
const actions = (app) => {
  const config = app.config.globalProperties.config;
  const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
  return {
    signin: async ({ commit, dispatch }, params) => {
      try {
        const res = await app.config.globalProperties.axios.post(`${api}/${config.api.endPoints.auth}/signin`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
        commit('auth_success', res.data);
        dispatch('refreshNav');
      } catch (err) {
        localStorage.removeItem('token');
        commit('auth_error', err);
      }
    },
    signup: async ({ commit, dispatch }, params) => {
      try {
        const res = await app.config.globalProperties.axios.post(`${api}/${config.api.endPoints.auth}/signup`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
        commit('auth_success', res.data);
        dispatch('refreshNav');
      } catch (err) {
        localStorage.removeItem('token');
        commit('auth_error', err);
      }
    },
    signout: ({ commit }) =>
      new Promise((resolve) => {
        commit('auth_logout');
        localStorage.removeItem(`${config.cookie.prefix}UserRoles`);
        localStorage.removeItem(`${config.cookie.prefix}CookieExpire`);
        resolve();
      }),
    token: async ({ commit, dispatch }) => {
      try {
        const res = await app.config.globalProperties.axios.get(`${api}/${config.api.endPoints.auth}/token`);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
        commit('auth_success', res.data);
        dispatch('refreshNav');
      } catch (err) {
        // localStorage.removeItem('token');
        commit('auth_error', err);
      }
    },
    forgot: async ({ commit }, params) => {
      try {
        const res = await app.config.globalProperties.axios.post(`${api}/${config.api.endPoints.auth}/forgot`, params);
        commit('forgot_success', res.data);
      } catch (err) {
        commit('auth_error', err);
      }
    },
    reset: async ({ commit, dispatch }, params) => {
      try {
        const res = await app.config.globalProperties.axios.post(`${api}/${config.api.endPoints.auth}/reset`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
        commit('auth_success', res.data);
        dispatch('refreshNav');
      } catch (err) {
        localStorage.removeItem('token');
        commit('auth_error', err);
      }
    },
  };
};

/**
 * Mutation: change state in a Vuex store is by committing a mutation
 */
const mutations = {
  auth_success(state, data) {
    state.auth = true;
    state.cookieExpire = data.tokenExpiresIn;
    state.user = data.user;
  },
  token_success(state, data) {
    console.log('token_success2', data);
  },
  auth_error(state, err) {
    console.log(err);
  },
  auth_logout(state) {
    state.auth = false;
    state.cookieExpire = 0;
  },
  forgot_success(state, data) {
    state.mail.status = data.data.status;
    state.mail.message = data.message;
  },
  reset_success(state, data) {
    console.log(data);
  },
};

/**
 * State
 */
const state = (app) => {
  return {
    cookieExpire: localStorage.getItem(`${app.config.globalProperties.config.cookie.prefix}CookieExpire`) || 0,
    auth: false,
    mail: {
      status: false,
      message: '',
    },
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
