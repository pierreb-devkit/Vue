/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { useCoreStore } from '../../core/stores/core.store';
import { updateAbilities } from '../../../lib/helpers/ability';
import { capture, identify, reset } from '../../../lib/helpers/analytics';

/**
 * @desc Deduce firstName and lastName from an email address.
 * - "firstname.lastname@domain" → capitalize both parts
 * - "firstname@domain" (no dot) → use as firstName, leave lastName empty
 * @param {string} email - The user's email address.
 * @returns {{ firstName: string, lastName: string }}
 */
function deduceNamesFromEmail(email) {
  const local = (email || '').split('@')[0] || '';
  if (!local) return { firstName: '', lastName: '' };

  const parts = local.split(/[._-]/).filter((p) => /^[a-zA-Z]+$/.test(p));
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  if (parts.length >= 2) {
    return {
      firstName: capitalize(parts[0]),
      lastName: capitalize(parts[1]),
    };
  }

  if (parts.length === 1) {
    return { firstName: capitalize(parts[0]), lastName: '' };
  }

  // No valid name parts found
  return { firstName: '', lastName: '' };
}

/**
 * Store definition.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    cookieExpire: 0,
    auth: false,
    user: null,
    pendingRequests: [],
    mail: {
      status: false,
      message: '',
    },
    serverConfig: null,
    status: null,
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

        if (res.data.abilities) updateAbilities(res.data.abilities);
        if (res.data.pendingRequests) this.pendingRequests = res.data.pendingRequests;

        coreStore.refreshNav(this.isLoggedIn);

        // PostHog identify on signin
        const u = res.data.user;
        let name = [u.firstName, u.lastName].filter(Boolean).join(' ');
        if (!name && u.email) {
          const deduced = deduceNamesFromEmail(u.email);
          name = [deduced.firstName, deduced.lastName].filter(Boolean).join(' ');
        }
        const identifyProps = { email: u.email };
        if (name) identifyProps.name = name;
        identify(u.id || u._id, identifyProps);
      } catch (err) {
        if (err.response && err.response.status === 423) {
          const retryAfter = Number(err.response.data?.retryAfter) || 0;
          if (retryAfter > 0) {
            this.lockout = { locked: true, retryAfter };
            return;
          }
          this.clearLockout();
          return;
        }
        localStorage.removeItem('token');
        console.error(err);
      }
    },

    /**
     * @desc Clear the lockout state after the countdown expires.
     * @returns {void}
     */
    clearLockout() {
      this.lockout = { locked: false, retryAfter: 0 };
    },

    /**
     * @desc Sign up a new user and update auth state.
     * @param {Object} params - Signup payload (email, password, firstName, lastName)
     * @returns {Promise<Object|undefined>} Signup response data containing user, and optionally organization or organizationSetupRequired
     */
    async signup(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      // Deduce firstName/lastName from email if not explicitly provided
      if (!params.firstName && !params.lastName) {
        const deduced = deduceNamesFromEmail(params.email);
        if (deduced.firstName) params.firstName = deduced.firstName;
        if (deduced.lastName) params.lastName = deduced.lastName;
      }

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/signup`, params);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;

        coreStore.refreshNav(this.isLoggedIn);
        capture('signup_completed', { email: res.data.user.email });
        identify(res.data.user.id || res.data.user._id, { email: res.data.user.email, plan: res.data.user.plan });
        return res.data;
      } catch (err) {
        localStorage.removeItem('token');
        throw err;
      }
    },

    /**
     * @desc Sign out the current user: call backend to clear the httpOnly TOKEN cookie,
     * then reset auth state, abilities, and localStorage. Backend failures never trap the
     * user as logged-in on the client — local reset always runs.
     * @returns {Promise<void>}
     */
    async signout() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      // Call backend first so the server can clear the httpOnly TOKEN cookie.
      // Swallow any error (older backends may not expose this endpoint, or the
      // server may be unreachable) — the local reset below must still run.
      // `__isRetryRequest: true` flags this request so the 401 interceptor does
      // not re-enter signout() and recurse (see src/lib/services/axios.js).
      try {
        await axios.post(`${api}/${config.api.endPoints.auth}/signout`, null, {
          __isRetryRequest: true,
        });
      } catch {
        // Never trap the user logged-in on backend failure.
      }

      this.auth = false;
      this.cookieExpire = 0;
      this.user = null;
      this.pendingRequests = [];

      updateAbilities([]);

      // PostHog reset on signout
      reset();

      localStorage.removeItem(`${config.cookie.prefix}UserRoles`);
      localStorage.removeItem(`${config.cookie.prefix}CookieExpire`);
      localStorage.removeItem(`${config.cookie.prefix}LastLoginAt`);

      coreStore.refreshNav(false);
    },

    async refreshAbilities() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();
      try {
        const res = await axios.get(`${api}/${config.api.endPoints.auth}/token`);
        if (res.data.abilities) {
          updateAbilities(res.data.abilities);
        }
        if (res.data.user) {
          this.user = res.data.user;
        }
        this.pendingRequests = res.data.pendingRequests || [];
        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        // If token refresh fails, sign out and propagate to caller
        await this.signout();
        throw err;
      }
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
        if (res.data.user.lastLoginAt) {
          localStorage.setItem(`${config.cookie.prefix}LastLoginAt`, res.data.user.lastLoginAt);
        }

        coreStore.refreshNav(this.isLoggedIn);
      } catch (err) {
        console.error(err);
      }
    },

    async forgot(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/forgot`, params);
        this.mail.status = res.data.data.status;
        this.mail.message = res.data.message;
      } catch (err) {
        console.error(err);
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
        console.error(err);
      }
    },

    /**
     * @desc Verify an email address using the token from the verification link.
     * @param {string} token - Email verification token from URL params.
     * @returns {Promise<Object>} Resolved API response data on success.
     */
    async verifyEmail(token) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      const encodedToken = encodeURIComponent(token);
      const res = await axios.post(`${api}/${config.api.endPoints.auth}/verify-email/${encodedToken}`);
      return res.data;
    },

    /**
     * @desc Resend the verification email for the currently authenticated user.
     * @returns {Promise<Object>} Resolved API response data on success.
     */
    async resendVerification() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      const res = await axios.post(`${api}/${config.api.endPoints.auth}/resend-verification`);
      return res.data;
    },
  },
});

/**
 * Exports.
 */
export { deduceNamesFromEmail };
export default useAuthStore;
