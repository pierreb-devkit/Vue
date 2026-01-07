import { merge } from 'lodash-es';
import defaultConfig from './development.js';

export default merge(defaultConfig, {
  app: {
    title: 'WAOS',
    status: 'Prod',
  },
});
