/**
 * Module dependencies.
 */
import moment from 'moment';

/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    app.config.globalProperties.moment = moment;
  },
};
