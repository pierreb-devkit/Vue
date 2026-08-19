/**
 * Module dependencies.
 */
import { captureFirstTouch } from '../helpers/attribution';

/**
 * Plugin setup.
 */
export default {
  /**
   * Captures write-once first-touch attribution (referrer, landing path, UTM
   * params) as early as possible in the boot sequence — registered before the
   * router plugin so the true landing URL is captured before any router
   * redirect can run. Safe no-op when storage/window is unavailable (SSR,
   * private mode, unit tests).
   * @returns {void}
   */
  install() {
    captureFirstTouch();
  },
};
