/**
 * Billing module — English i18n strings.
 * These keys are referenced in billing components via comments for future vue-i18n adoption.
 * Downstream projects may override these strings by merging into their i18n configuration.
 */
export const billingEn = {
  billing: {
    usage: {
      /** i18n key: billing.usage.weekly */
      weekly: 'Weekly meter',
      /** i18n key: billing.usage.breakdown */
      breakdown: 'Breakdown',
      /** i18n key: billing.usage.progress — interpolate {used} and {quota} */
      progress: '{used} of {quota} units used',
      /** i18n key: billing.usage.exhausted */
      exhausted: 'Quota exhausted',
      bucket: {
        /** i18n key: billing.usage.bucket.scrap */
        scrap: 'Scrape',
        /** i18n key: billing.usage.bucket.autofix */
        autofix: 'Autofix',
        /** i18n key: billing.usage.bucket.wizard */
        wizard: 'Wizard',
        /** i18n key: billing.usage.bucket.digest */
        digest: 'Digest',
        /** i18n key: billing.usage.bucket.generate */
        generate: 'Generate',
        /** i18n key: billing.usage.bucket.chat */
        chat: 'Chat',
      },
    },
    extras: {
      /** i18n key: billing.extras.title */
      title: 'Extra units',
      /** i18n key: billing.extras.balance — interpolate {units} */
      balance: '{units} units remaining',
      /** i18n key: billing.extras.cta */
      cta: 'Buy units',
      /** i18n key: billing.extras.purchaseSuccess */
      purchaseSuccess: 'Pack credited to your balance',
    },
    alerts: {
      /** i18n key: billing.alerts.threshold80 */
      threshold80: "You've used 80% of your weekly quota",
      /** i18n key: billing.alerts.threshold100 */
      threshold100: 'Quota reached — extras consumed',
      /** i18n key: billing.alerts.extrasConsumed */
      extrasConsumed: 'Extras balance is empty',
    },
    equivalences: {
      /** i18n key: billing.equivalences.scrapRun */
      scrapRun: 'operations / week',
    },
  },
};

/**
 * Exports.
 */
export default billingEn;
