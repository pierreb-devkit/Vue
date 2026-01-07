/**
 * Module dependencies.
 */
import _ from 'lodash';

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    app.config.globalProperties._ = _;
  },
};
