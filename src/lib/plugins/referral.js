/**
 * Module dependencies.
 */
import { captureRef } from '../helpers/referral';

/**
 * Plugin setup.
 */
export default {
  /**
   * Keeps a `?ref=` referral code from the landing URL until signup. Registered
   * before the router plugin so the true landing URL is read before any redirect.
   * Safe no-op when storage/window is unavailable.
   * @returns {void}
   */
  install() {
    captureRef();
  },
};
