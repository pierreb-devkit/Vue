/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { useCoreStore } from '../../core/stores/core.store';
import { updateAbilities } from '../../../lib/helpers/ability';

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

        if (res.data.abilities) updateAbilities(res.data.abilities);

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        localStorage.removeItem('token');
        console.log(err);
      }
    },

    /**
     * @desc Sign up a new user and update auth state.
     * @param {Object} params - Signup payload (email, password, firstName, lastName)
     * @returns {Promise<Object|undefined>} Signup response data containing user, and optionally organization or organizationSetupRequired
     */
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
        return res.data;
      } catch (err) {
        localStorage.removeItem('token');
        console.log(err);
      }
    },

    async signout() {
      this.auth = false;
      this.cookieExpire = 0;
      this.user = null;

      updateAbilities([]);

      localStorage.removeItem(`${config.cookie.prefix}UserRoles`);
      localStorage.removeItem(`${config.cookie.prefix}CookieExpire`);
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

        if (res.data.abilities) updateAbilities(res.data.abilities);

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
