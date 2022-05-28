/**
 * Module dependencies.
 */
import _ from 'lodash';

/**
 * Plugin Setup
 */
export default {
  install: (app) => {
    app.config.globalProperties._ = _;
  },
};
