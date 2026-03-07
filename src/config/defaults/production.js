import { merge } from 'lodash-es';
import defaultConfig from './development.js';

export default merge(defaultConfig, {
  app: {
    title: 'DevKit',
    status: 'Prod',
    url: '', // set via DEVKIT_VUE_app_url env var in production
  },
});
