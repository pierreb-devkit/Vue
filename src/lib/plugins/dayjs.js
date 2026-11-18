/**
 * Module dependencies.
 */
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

/**
 * Extend dayjs with plugins.
 */
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    app.config.globalProperties.dayjs = dayjs;
  },
};
