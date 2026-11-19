/**
 * Shared display formats for dates, numbers and relative times.
 *
 * LOCALE POLICY: the app copy is English, so every format uses one fixed locale
 * (`LOCALE`, en-US) — never the browser's — and a page reads the same for every visitor.
 * Each helper only formats; empty or invalid inputs stay the caller's choice.
 */

/** @type {string} The one locale every display format uses. */
export const LOCALE = 'en-US';

/**
 * @desc Format a date (and time, if the options ask for it) with the app locale.
 * @param {string|number|Date} value - Date input accepted by `new Date()`.
 * @param {Intl.DateTimeFormatOptions} [options] - Intl options (e.g. `{ dateStyle: 'medium' }`).
 * @returns {string} Formatted date ("Invalid Date" when the input does not parse).
 */
export const formatDate = (value, options) => new Date(value).toLocaleString(LOCALE, options);

/**
 * @desc Format a number with the app locale (thousands separators); falsy counts as 0.
 * @param {number} n - Number to format.
 * @returns {string} Formatted number.
 */
export const formatNumber = (n) => Number(n || 0).toLocaleString(LOCALE);

/** Intl relative-time steps: [upper bound in seconds, unit, unit size in seconds]. */
const RELATIVE_STEPS = [
  [60, 'second', 1],
  [3600, 'minute', 60],
  [86400, 'hour', 3600],
  [604800, 'day', 86400],
  [Infinity, 'week', 604800],
];

/** Built once: Intl formatters are costly to construct and this one never changes. */
const RELATIVE_FORMAT = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'short' });

/**
 * @desc Relative time from now. Two styles:
 *  - `'short'` (default): Intl short style, e.g. "5 min. ago", "yesterday", "3 wk. ago";
 *    a future date reads as now.
 *  - `'compact'`: "just now", "5m ago", "3h ago", "2d ago", "4mo ago".
 * @param {string|number|Date} value - Date input accepted by `new Date()`.
 * @param {{ style?: 'short'|'compact' }} [options]
 * @returns {string} Relative time, or '' when the input does not parse.
 */
export const timeAgo = (value, { style = 'short' } = {}) => {
  const diffMs = Date.now() - new Date(value).getTime();
  if (Number.isNaN(diffMs)) return '';
  if (style === 'compact') {
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }
  const seconds = Math.max(0, diffMs / 1000);
  const [, unit, size] = RELATIVE_STEPS.find(([limit]) => seconds < limit);
  return RELATIVE_FORMAT.format(-Math.round(seconds / size), unit);
};
