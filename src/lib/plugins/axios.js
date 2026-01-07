/**
 * Module dependencies.
 */
import axios from '../services/axios';

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    // Expose axios on globalProperties for Vue components compatibility
    app.config.globalProperties.axios = axios;
  },
};
