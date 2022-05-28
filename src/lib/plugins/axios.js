/**
 * Module dependencies.
 */
import axios from 'axios';

/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    app.config.globalProperties.axios = axios.create({
      withCredentials: true,
    });
  },
};
