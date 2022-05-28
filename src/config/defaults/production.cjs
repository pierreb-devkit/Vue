const _ = require('lodash');
const defaultConfig = require('./development.cjs');

module.exports = _.merge(defaultConfig, {
  app: {
    title: 'WAOS',
    status: 'Prod',
  },
});
