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
      /** i18n key: billing.usage.manageSubscription */
      manageSubscription: 'Manage subscription',
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
    subscriptions: {
      /** i18n key: billing.subscriptions.title */
      title: 'Subscriptions',
      /** i18n key: billing.subscriptions.empty */
      empty: 'No active subscription.',
      /** i18n key: billing.subscriptions.portal */
      portal: 'Manage Subscription',
      plan: {
        /** i18n key: billing.subscriptions.plan.current */
        current: 'Current Plan',
      },
      meter: {
        /** i18n key: billing.subscriptions.meter.label */
        label: 'Weekly meter',
      },
      extras: {
        /** i18n key: billing.subscriptions.extras.balance */
        balance: 'Extra units',
        /** i18n key: billing.subscriptions.extras.ledger */
        ledger: 'Transaction history',
      },
      cta: {
        /** i18n key: billing.subscriptions.cta.upgrade */
        upgrade: 'Upgrade',
      },
      error: {
        /** i18n key: billing.subscriptions.error.fetchFailed */
        fetchFailed: 'Unable to load your subscription details. Please try again.',
        /** i18n key: billing.subscriptions.error.retry */
        retry: 'Retry',
      },
    },
    checkout: {
      success: {
        /** i18n key: billing.checkout.success.processing */
        processing: 'Processing your payment...',
        /** i18n key: billing.checkout.success.synced */
        synced: 'Subscription activated successfully. Thank you!',
        /** i18n key: billing.checkout.success.timeout */
        timeout: 'Payment received, your subscription is being synced. Please refresh in a few seconds.',
        /** i18n key: billing.checkout.success.refresh */
        refresh: 'Refresh',
      },
      error: {
        alreadyActive: {
          /** i18n key: billing.checkout.error.alreadyActive.title */
          title: 'Subscription already active',
          /** i18n key: billing.checkout.error.alreadyActive.message */
          message: 'You already have an active subscription. Manage it via the Customer Portal.',
          /** i18n key: billing.checkout.error.alreadyActive.cta */
          cta: 'Open Customer Portal',
        },
      },
    },
    pricing: {
      tabs: {
        /** i18n key: billing.pricing.tabs.plans */
        plans: 'Plans',
        /** i18n key: billing.pricing.tabs.units */
        units: 'Units',
      },
    },
    packs: {
      /** i18n key: billing.packs.title */
      title: 'Unit packs',
      /** i18n key: billing.packs.cta */
      cta: 'Buy units',
      /** i18n key: billing.packs.purchase — interpolate {label} */
      purchase: 'Buy {label}',
      /** i18n key: billing.packs.units — interpolate {amount} */
      units: '+{amount} units',
    },
  },
};

/**
 * Exports.
 */
export default billingEn;
