/**
 * Module dependencies.
 */
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

/**
 * Extend dayjs with plugins.
 */
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Plugin setup.
 */
export default {
  install: (app) => {
    app.config.globalProperties.dayjs = dayjs;
  },
};
