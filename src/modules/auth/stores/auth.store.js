/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { useCoreStore } from '../../core/stores/core.store';

/**
 * Store definition.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    cookieExpire: 0,
    auth: false,
    user: null,
    mail: {
      status: false,
      message: '',
    },
    serverConfig: null,
    lockout: {
      locked: false,
      retryAfter: 0,
    },
  }),

  getters: {
    isLoggedIn: (state) => !!state.cookieExpire,
    authStatus: (state) => state.status,
  },

  actions: {
    // Initialize from localStorage
    initFromStorage() {
      this.cookieExpire = localStorage.getItem(`${config.cookie.prefix}CookieExpire`) || 0;
    },

    /**
     * @desc Fetch public auth config flags from the API
     * @returns {Object|null} Server auth config or null on failure
     */
    async fetchServerConfig() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      try {
        const res = await axios.get(`${api}/${config.api.endPoints.auth}/config`);
        const data = res.data.data;
        if (data && typeof data.sign === 'object' && typeof data.sign.in === 'boolean' && typeof data.sign.up === 'boolean') {
          this.serverConfig = data;
        } else {
          this.serverConfig = null;
        }
        return this.serverConfig;
      } catch {
        this.serverConfig = null;
        return null;
      }
    },

    /**
     * @desc Sign in with email/password; handles 423 lockout separately.
     * @param {Object} params - Credentials ({ email, password }).
     * @returns {Promise<void>}
     */
    async signin(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/signin`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;
        this.lockout = { locked: false, retryAfter: 0 };

        if (res.data.user.lastLoginAt) {
          localStorage.setItem(`${config.cookie.prefix}LastLoginAt`, res.data.user.lastLoginAt);
        }

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        if (err.response && err.response.status === 423) {
          const retryAfter = err.response.data?.retryAfter || 0;
          this.lockout = { locked: true, retryAfter };
          return;
        }
        localStorage.removeItem('token');
        console.log(err);
      }
    },

    /**
     * @desc Clear the lockout state after the countdown expires.
     * @returns {void}
     */
    clearLockout() {
      this.lockout = { locked: false, retryAfter: 0 };
    },

    async signup(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/signup`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        localStorage.removeItem('token');
        console.log(err);
      }
    },

    async signout() {
      this.auth = false;
      this.cookieExpire = 0;
      this.user = null;

      localStorage.removeItem(`${config.cookie.prefix}UserRoles`);
      localStorage.removeItem(`${config.cookie.prefix}CookieExpire`);
      localStorage.removeItem(`${config.cookie.prefix}LastLoginAt`);
    },

    async token() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      try {
        const res = await axios.get(`${api}/${config.api.endPoints.auth}/token`);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;

        if (res.data.user.lastLoginAt) {
          localStorage.setItem(`${config.cookie.prefix}LastLoginAt`, res.data.user.lastLoginAt);
        }

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        console.log(err);
      }
    },

    async forgot(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/forgot`, params);
        this.mail.status = res.data.data.status;
        this.mail.message = res.data.message;
      } catch (err) {
        console.log(err);
      }
    },

    async reset(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/reset`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        localStorage.removeItem('token');
        console.log(err);
      }
    },
  },
});

/**
 * Exports.
 */
export default useAuthStore;
