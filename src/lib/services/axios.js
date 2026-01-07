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
 */
export function setupInterceptors(config, snackbar, onSignout) {
  instance.interceptors.response.use(
    (response) => {
      if (config.vuetify.theme.snackbar.status && response.config && config.vuetify.theme.snackbar.methods.indexOf(response.config.method) > -1) {
        snackbar.text = `${response.data.type}: ${response.data.message}`;
        snackbar.color = config.vuetify.theme.snackbar.sucessColor;
        snackbar.status = true;
      }
      return response;
    },
    (err) =>
      new Promise(() => {
        if (err && err.response && err.response.status === 401 && err.config && !err.config.__isRetryRequest) {
          onSignout();
          snackbar.text = 'Signin failed';
          snackbar.color = config.vuetify.theme.snackbar.errorColor;
          snackbar.status = true;
        }
        if (config.vuetify.theme.snackbar.status && err.response && err.response.data && err.response.data.description) {
          snackbar.text = err.response.data.description;
          snackbar.color = config.vuetify.theme.snackbar.errorColor;
          snackbar.status = true;
        }
        throw err;
      }),
  );
}

/**
 * Exports.
 */
export default instance;
