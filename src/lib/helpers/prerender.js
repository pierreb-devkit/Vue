/**
 * Prerender crawl detection helper.
 */

/**
 * @desc Detects a headless-Chrome SEO prerender crawl via UA sniffing.
 * @returns {boolean} True when the current UA matches a HeadlessChrome crawl, false otherwise.
 */
// UA-based detection is used instead of `navigator.webdriver`, which JSDOM/happy-dom
// also set on the test `navigator` and would otherwise break unit tests. SSR-safe:
// returns false when `navigator` is undefined.
export const isPrerenderCrawl = () => typeof navigator !== 'undefined' && /HeadlessChrome/.test(navigator.userAgent || '');

/**
 * Exports.
 */
export default { isPrerenderCrawl };
