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

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        localStorage.removeItem('token');
        console.log(err);
      }
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
