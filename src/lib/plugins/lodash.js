/**
 * Module dependencies.
 */
import _ from 'lodash-es';

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    app.config.globalProperties.lodash = _;
  },
};
