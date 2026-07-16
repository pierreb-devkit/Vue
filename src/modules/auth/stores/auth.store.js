/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { useCoreStore } from '../../core/stores/core.store';
import { useBillingStore } from '../../billing/stores/billing.store';
import { updateAbilities } from '../../../lib/helpers/ability';
import { capture, identify, reset as analyticsReset } from '../../../lib/helpers/analytics';

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
 * Monotonically-increasing generation counter shared by token()/
 * refreshAbilities() and signout() (module scope, mirrors the
 * isRefreshingAbilities dedup flag in lib/services/axios.js). token() and
 * refreshAbilities() capture the generation before their network await;
 * signout() bumps it synchronously before doing anything else. If either
 * soft-refresh resolves after a concurrent signout() already bumped the
 * generation, the captured value no longer matches and the continuation
 * drops its state writes instead of resurrecting auth=true/user/
 * localStorage right after the user signed out.
 */
let _authGeneration = 0;

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
    /** @type {{ orgId: string, orgName: string } | null} */
    suggestedJoin: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.cookieExpire,
    authStatus: (state) => state.status,
    // Beta capacity from the public auth config: cap/remaining are null when uncapped; betaCapped is true only when a numeric cap is set.
    signupCap: (state) => state.serverConfig?.sign?.cap ?? null,
    seatsRemaining: (state) => state.serverConfig?.sign?.remaining ?? null,
    betaCapped: (state) => state.serverConfig?.sign?.cap != null,
  },

  actions: {
    // Initialize from localStorage
    initFromStorage() {
      this.cookieExpire = localStorage.getItem(`${config.cookie.prefix}CookieExpire`) || 0;
      const rawSuggestedJoin = localStorage.getItem(`${config.cookie.prefix}SuggestedJoin`);
      try {
        const parsed = rawSuggestedJoin ? JSON.parse(rawSuggestedJoin) : null;
        const isValid = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.orgId === 'string' && parsed.orgId && typeof parsed.orgName === 'string' && parsed.orgName;
        this.suggestedJoin = isValid ? parsed : null;
        if (rawSuggestedJoin && !isValid) localStorage.removeItem(`${config.cookie.prefix}SuggestedJoin`);
      } catch {
        this.suggestedJoin = null;
        localStorage.removeItem(`${config.cookie.prefix}SuggestedJoin`);
      }
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
        this.pendingRequests = res.data.pendingRequests || [];

        coreStore.refreshNav(this.isLoggedIn);

        // Refresh compute meter immediately on login so the sidenav gauge
        // populates without waiting for mount/focus (guard: only when meterMode is on).
        if (this.serverConfig?.billing?.meterMode === true) {
          const billingStore = useBillingStore();
          billingStore.fetchUsageMeter().catch(() => { /* meter refresh is best-effort; do not log err (avoids leaking response internals to the console) */ });
        }

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
        // Do not log `err`: on a failed signin it carries the submitted
        // credentials (request payload) and would leak them to the browser
        // console / any console-forwarding error tracker. The axios response
        // interceptor already surfaces a user-facing failure message.
        localStorage.removeItem('token');
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
     * @desc Set the suggestedJoin state and persist client-side.
     * @param {{ orgId: string, orgName: string }} payload
     * @returns {void}
     */
    setSuggestedJoin(payload) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload) || typeof payload.orgId !== 'string' || !payload.orgId || typeof payload.orgName !== 'string' || !payload.orgName) return;
      this.suggestedJoin = payload;
      localStorage.setItem(`${config.cookie.prefix}SuggestedJoin`, JSON.stringify(payload));
    },

    /**
     * @desc Dismiss the suggested-join banner: clear state and persistence.
     * @returns {void}
     */
    dismissSuggestedJoin() {
      this.suggestedJoin = null;
      localStorage.removeItem(`${config.cookie.prefix}SuggestedJoin`);
    },

    /**
     * @desc Clear suggestedJoin if the user just joined the suggested org.
     * @param {string} orgId - The org the user became a member of.
     * @returns {void}
     */
    clearSuggestedJoinIfMember(orgId) {
      if (this.suggestedJoin?.orgId === orgId) {
        this.dismissSuggestedJoin();
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

      const { inviteToken, ...payload } = params;

      // Deduce firstName/lastName from email if not explicitly provided
      if (!payload.firstName && !payload.lastName) {
        const deduced = deduceNamesFromEmail(payload.email);
        if (deduced.firstName) { payload.firstName = deduced.firstName; }
        if (deduced.lastName) { payload.lastName = deduced.lastName; }
      }

      const signupUrl = `${api}/${config.api.endPoints.auth}/signup${inviteToken ? `?inviteToken=${encodeURIComponent(inviteToken)}` : ''}`;

      try {
        const res = await axios.post(signupUrl, payload);
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;

        if (res.data.suggestedJoin) {
          this.setSuggestedJoin(res.data.suggestedJoin);
        }

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
     * @param {boolean} [silent=false] - When true, suppress the success snackbar for the
     *   /signout request. Pass true only from the 401 side-effect path (session expiry)
     *   where the signout is an automatic consequence, not a deliberate user action.
     *   Explicit user logouts (nav / profile / org screens) leave this false so the
     *   "success: Signed out" toast is shown normally.
     * @returns {Promise<void>}
     */
    async signout(silent = false) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();

      // Bump the generation FIRST (synchronously, before any await) so any
      // token()/refreshAbilities() already in flight is invalidated the
      // moment signout begins, regardless of when its network call settles.
      _authGeneration += 1;

      // Call backend first so the server can clear the httpOnly TOKEN cookie.
      // Swallow any error (older backends may not expose this endpoint, or the
      // server may be unreachable) — the local reset below must still run.
      // `__isRetryRequest: true` flags this request so the 401 interceptor does
      // not re-enter signout() and recurse. `__silent: true` is set only when
      // `silent` is true (401 side-effect path) so the success interceptor skips
      // its snackbar for that case; explicit user logouts preserve the toast.
      // (see src/lib/services/axios.js, #4305).
      try {
        await axios.post(`${api}/${config.api.endPoints.auth}/signout`, null, {
          __isRetryRequest: true,
          ...(silent ? { __silent: true } : {}),
        });
      } catch {
        // Never trap the user logged-in on backend failure.
      }

      this.auth = false;
      this.cookieExpire = 0;
      this.user = null;
      this.pendingRequests = [];
      this.suggestedJoin = null;

      updateAbilities([]);

      // PostHog reset on signout
      analyticsReset();

      localStorage.removeItem(`${config.cookie.prefix}UserRoles`);
      localStorage.removeItem(`${config.cookie.prefix}CookieExpire`);
      localStorage.removeItem(`${config.cookie.prefix}LastLoginAt`);
      localStorage.removeItem(`${config.cookie.prefix}SuggestedJoin`);

      coreStore.refreshNav(false);
    },

    async refreshAbilities() {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      const coreStore = useCoreStore();
      // Capture the generation BEFORE the network await — if a concurrent
      // signout() bumps it while this request is in flight, the response
      // below is a stale continuation and must not resurrect state.
      const generation = _authGeneration;
      try {
        const res = await axios.get(`${api}/${config.api.endPoints.auth}/token`);
        if (generation !== _authGeneration) return; // signout() won the race
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
      // Capture the generation BEFORE the network await — see refreshAbilities()
      // for the shared rationale (a soft-refresh continuation resolving after
      // signout() must not re-populate auth=true/user/localStorage).
      const generation = _authGeneration;

      try {
        const res = await axios.get(`${api}/${config.api.endPoints.auth}/token`);
        if (generation !== _authGeneration) return; // signout() won the race
        localStorage.setItem(`${config.cookie.prefix}UserRoles`, res.data.user.roles);
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);

        this.auth = true;
        this.cookieExpire = res.data.tokenExpiresIn;
        this.user = res.data.user;
        // Soft-refresh must carry pendingRequests too, so the org-required wall's
        // join banner + duplicate-request guard stay accurate after a token()
        // soft-refresh (mirrors refreshAbilities()). /token already returns it.
        this.pendingRequests = res.data.pendingRequests || [];

        if (res.data.abilities) updateAbilities(res.data.abilities);
        if (res.data.user.lastLoginAt) {
          localStorage.setItem(`${config.cookie.prefix}LastLoginAt`, res.data.user.lastLoginAt);
        }

        coreStore.refreshNav(this.isLoggedIn);
      } catch {
        // Token refresh failed (expired/invalid session). Swallow silently:
        // the axios interceptor handles the user-facing 401, and logging `err`
        // would expose request/response internals to the console.
      }
    },

    async forgot(params) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

      try {
        const res = await axios.post(`${api}/${config.api.endPoints.auth}/forgot`, params);
        this.mail.status = res.data.data.status;
        this.mail.message = res.data.message;
      } catch {
        // Swallow silently: `err` carries the submitted email (request payload).
        // The axios interceptor surfaces the user-facing failure message.
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
      } catch {
        // Swallow silently: `err` carries the submitted reset token + new
        // password (request payload). The axios interceptor surfaces the
        // user-facing failure message.
        localStorage.removeItem('token');
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

    /**
     * @desc Verify a signup invite token (public). Used by the signup page to
     * reveal the form + prefill the invited email when public signup is closed.
     * Canonical mount (modules/invitations); the legacy /auth/invitations alias
     * is removed post-P9.
     * @param {string} token
     * @returns {Promise<{valid: boolean, email: string|null}>}
     */
    async verifyInvite(token) {
      const api = `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;
      try {
        const res = await axios.get(`${api}/invitations/verify/${encodeURIComponent(token)}`);
        return res.data.data;
      } catch {
        return { valid: false, email: null };
      }
    },
  },
});

/**
 * Exports.
 */
export { deduceNamesFromEmail };
export default useAuthStore;
