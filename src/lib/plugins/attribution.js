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
   *
   * Gated on the same `config.analytics.posthog` key as the `posthog` plugin
   * (mirrors its pattern): the feature only exists to enrich analytics, so a
   * downstream that hasn't configured PostHog gets no capture. With nothing
   * ever written to sessionStorage, `getAttribution()` (consumed by
   * `auth.store.signup()`) has no record to read and the `attribution` key
   * is never attached to the signup payload — inert end-to-end when
   * analytics is unconfigured.
   *
   * @param {import('vue').App} app - The Vue application instance.
   * @returns {void}
   */
  install(app) {
    const phConfig = app.config.globalProperties.config?.analytics?.posthog;
    if (!phConfig?.key) return;

    captureFirstTouch();
  },
};
