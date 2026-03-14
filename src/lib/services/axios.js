/**
 * Module dependencies.
 */
import axios from 'axios';

/**
 * Axios instance configuration.
 */
const instance = axios.create({
  withCredentials: true,
});

/**
 * Setup axios interceptors.
 * @param {Object} config - Application configuration
 * @param {Object} snackbar - Reactive snackbar object for notifications
 * @param {Function} onSignout - Callback to call on 401 error
 * @param {Function} onRefreshAbilities - Callback to call on 403 error to refresh abilities
 */
let isRefreshingAbilities = false;
let refreshAbilitiesPromise = null;

export function setupInterceptors(config, snackbar, onSignout, onRefreshAbilities) {
  instance.interceptors.response.use(
    (response) => {
      if (config.vuetify.theme.snackbar.status && response.config && config.vuetify.theme.snackbar.methods.indexOf(response.config.method) > -1) {
        snackbar.text = `${response.data.type}: ${response.data.message}`;
        snackbar.color = config.vuetify.theme.snackbar.successColor
          ?? config.vuetify.theme.snackbar.sucessColor;
        snackbar.status = true;
      }
      return response;
    },
    async (err) => {
      if (err && err.response && err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
        onSignout();
        snackbar.text = 'Signin failed';
        snackbar.color = config.vuetify.theme.snackbar.errorColor;
        snackbar.status = true;
      }
      if (err?.response?.status === 403 && !err.config?.__isAbilityRetry && onRefreshAbilities) {
        try {
          if (!isRefreshingAbilities) {
            isRefreshingAbilities = true;
            refreshAbilitiesPromise = onRefreshAbilities();
          }
          await refreshAbilitiesPromise;
          if (err.config) {
            const retryConfig = { ...err.config, __isAbilityRetry: true };
            return instance.request(retryConfig);
          }
        } catch (refreshErr) {
          // Queued requests may await an already-rejected promise; swallow gracefully
          console.error('Axios 403 interceptor: ability refresh failed', refreshErr);
        } finally {
          isRefreshingAbilities = false;
          refreshAbilitiesPromise = null;
        }
      }
      if (config.vuetify.theme.snackbar.status && err.response && err.response.data && err.response.data.description) {
        snackbar.text = err.response.data.description;
        snackbar.color = config.vuetify.theme.snackbar.errorColor;
        snackbar.status = true;
      }
      throw err;
    },
  );
}

/**
 * Reset the refreshing abilities flag (exported for testing).
 */
export function resetRefreshingAbilitiesFlag() {
  isRefreshingAbilities = false;
  refreshAbilitiesPromise = null;
}

/**
 * Exports.
 */
export default instance;
