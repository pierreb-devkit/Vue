/**
 * Billing module — English i18n strings.
 * Downstream projects may override these strings by merging into their i18n configuration:
 *   import i18n from '@devkit/lib/plugins/i18n'
 *   i18n.global.mergeLocaleMessage('en', { billing: { ... } })
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
      /** i18n key: billing.usage.weeklyUsage */
      weeklyUsage: 'Weekly usage',
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
    period: {
      /** i18n key: billing.period.month */
      month: '/month',
      /** i18n key: billing.period.year */
      year: '/year',
    },
    meter: {
      error: {
        /** i18n key: billing.meter.error.refreshFailed */
        refreshFailed: 'Could not refresh usage. Counters may be out of date. Retrying automatically.',
      },
    },
    extras: {
      /** i18n key: billing.extras.title */
      title: 'Extra units',
      /** i18n key: billing.extras.balance — interpolate {units}, pluralized via $t(key, count, namedVars) — vue-i18n v10 Composition API */
      balance: 'no units remaining | {units} unit remaining | {units} units remaining',
      /** i18n key: billing.extras.cta */
      cta: 'Buy units',
      /** i18n key: billing.extras.purchaseSuccess */
      purchaseSuccess: 'Pack credited to your balance',
      modal: {
        /** i18n key: billing.extras.modal.title */
        title: 'Buy extra units',
        /** i18n key: billing.extras.modal.noPacksAvailable */
        noPacksAvailable: 'No packs available at this time.',
        /** i18n key: billing.extras.modal.cancel */
        cancel: 'Cancel',
      },
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
    extrasLedger: {
      empty: {
        /** i18n key: billing.extrasLedger.empty.noEntries */
        noEntries: 'No ledger entries yet',
      },
      headers: {
        /** i18n key: billing.extrasLedger.headers.date */
        date: 'Date',
        /** i18n key: billing.extrasLedger.headers.kind */
        kind: 'Kind',
        /** i18n key: billing.extrasLedger.headers.amount */
        amount: 'Amount',
        /** i18n key: billing.extrasLedger.headers.refHistory */
        refHistory: 'Ref / History',
        /** i18n key: billing.extrasLedger.headers.stripeSession */
        stripeSession: 'Stripe session',
      },
    },
    meterProgress: {
      /** i18n key: billing.meterProgress.over — interpolate {count} */
      over: '+{count} over',
      /** i18n key: billing.meterProgress.remaining — interpolate {count}, pluralized via $t(key, count, namedVars) — vue-i18n v10 Composition API */
      remaining: '(no remaining) | ({count} remaining) | ({count} remaining)',
      /** i18n key: billing.meterProgress.extras — interpolate {count} */
      extras: '+{count} extras',
      /** i18n key: billing.meterProgress.ariaOver — interpolate {base}, {used}, {quota}, {overage} */
      ariaOver: '{base}{used} of {quota} used, {overage} over quota',
      /** i18n key: billing.meterProgress.ariaUsed — interpolate {base}, {used}, {quota}, {percent} */
      ariaUsed: '{base}{used} of {quota} used ({percent}%)',
    },
    usageBar: {
      /** i18n key: billing.usageBar.adminLabel — used next to ∞ Admin display */
      adminLabel: 'Admin',
      /** i18n key: billing.usageBar.compute — unit label for free-tier display */
      compute: 'compute',
      /** i18n key: billing.usageBar.unlimited — legacy mode unlimited label */
      unlimited: 'Unlimited',
      /** i18n key: billing.usageBar.remaining — interpolate {count}, pluralized via $t(key, count, namedVars) — vue-i18n v10 Composition API */
      remaining: '(no remaining) | ({count} remaining) | ({count} remaining)',
    },
    subscriptions: {
      /** i18n key: billing.subscriptions.title */
      title: 'Subscriptions',
      /** i18n key: billing.subscriptions.empty */
      empty: 'No active subscription.',
      /** i18n key: billing.subscriptions.portal */
      portal: 'Manage Subscription',
      /** i18n key: billing.subscriptions.unavailable */
      unavailable: 'Subscription unavailable',
      /** i18n key: billing.subscriptions.changePlan */
      changePlan: 'Change Plan',
      plan: {
        /** i18n key: billing.subscriptions.plan.current */
        current: 'Current Plan',
        /** i18n key: billing.subscriptions.plan.status */
        status: 'Status:',
        /** i18n key: billing.subscriptions.plan.nextBilling — interpolate {date} */
        nextBilling: 'Next billing date: {date}',
        free: {
          /** i18n key: billing.subscriptions.plan.free.description */
          description: "You're on the free plan. Upgrade to unlock more projects, team members, and advanced features.",
        },
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
        /** i18n key: billing.subscriptions.error.portalFailed */
        portalFailed: 'Unable to open the billing portal. Please try again.',
      },
      status: {
        /** i18n key: billing.subscriptions.status.updatePayment */
        updatePayment: 'Update payment method',
        /** i18n key: billing.subscriptions.status.reactivate */
        reactivate: 'Reactivate',
        /** i18n key: billing.subscriptions.status.completePayment */
        completePayment: 'Complete payment',
        /** i18n key: billing.subscriptions.status.paused */
        paused: 'Paused',
        /** i18n key: billing.subscriptions.status.unpaid */
        unpaid: 'Unpaid',
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
          /** i18n key: billing.checkout.error.alreadyActive.close */
          close: 'Close',
        },
      },
    },
    pricing: {
      /** i18n key: billing.pricing.title */
      title: 'Pricing',
      /** i18n key: billing.pricing.subtitle */
      subtitle: 'Choose the plan that fits your needs.',
      cancel: {
        /** i18n key: billing.pricing.cancel.message */
        message: 'Checkout was canceled. You can try again whenever you are ready.',
      },
      error: {
        /** i18n key: billing.pricing.error.retry */
        retry: 'Retry',
        /** i18n key: billing.pricing.error.pricingUnavailable */
        pricingUnavailable: 'Pricing unavailable',
        /** i18n key: billing.pricing.error.pricingTemporarilyUnavailable */
        pricingTemporarilyUnavailable: 'Pricing temporarily unavailable',
        /** i18n key: billing.pricing.error.loadFailed */
        loadFailed: 'Failed to load pricing. Please try again.',
        /** i18n key: billing.pricing.error.checkoutFailed */
        checkoutFailed: 'Failed to start checkout. Please try again.',
      },
      tabs: {
        /** i18n key: billing.pricing.tabs.plans */
        plans: 'Plans',
        /** i18n key: billing.pricing.tabs.units */
        units: 'Units',
      },
      downgrade: {
        /** i18n key: billing.pricing.downgrade.title */
        title: 'Confirm plan change',
        /** i18n key: billing.pricing.downgrade.message — interpolate {from} and {to} */
        message: "You're switching from {from} to {to}. Stripe will pro-rate the difference. Quota will reset at next billing cycle.",
        /** i18n key: billing.pricing.downgrade.cancel */
        cancel: 'Cancel',
        /** i18n key: billing.pricing.downgrade.confirm */
        confirm: 'Continue to checkout',
      },
    },
    pricingCard: {
      /** i18n key: billing.pricingCard.free */
      free: 'Free',
      /** i18n key: billing.pricingCard.currentPlan */
      currentPlan: 'Current Plan',
    },
    pricingFeatureSection: {
      /** i18n key: billing.pricingFeatureSection.everythingIn — interpolate {plan} */
      everythingIn: 'Everything in {plan}, plus',
    },
    pricingToggle: {
      /** i18n key: billing.pricingToggle.monthly */
      monthly: 'Monthly',
      /** i18n key: billing.pricingToggle.annual */
      annual: 'Annual',
      /** i18n key: billing.pricingToggle.save */
      save: 'Save 20%',
      /** i18n key: billing.pricingToggle.saveAnnually */
      saveAnnually: 'Save 20% annually',
      /** i18n key: billing.pricingToggle.saveUpTo — interpolate {pct} */
      saveUpTo: 'Save up to {pct}%',
      /** i18n key: billing.pricingToggle.saveAnnuallyDynamic — interpolate {pct} */
      saveAnnuallyDynamic: 'Switch to annual and save up to {pct}%',
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
      /** i18n key: billing.packs.noUnitsAvailable */
      noUnitsAvailable: 'No unit packs available at this time.',
    },
    upgradePrompt: {
      /** i18n key: billing.upgradePrompt.usageInfo — interpolate {current}, {limit}, {label} */
      usageInfo: "You've used {current} of {limit} {label}.",
      /** i18n key: billing.upgradePrompt.requirePlan — interpolate {plan} */
      requirePlan: 'This feature requires the {plan} plan.',
      /** i18n key: billing.upgradePrompt.buyUnits */
      buyUnits: 'Buy units',
      /** i18n key: billing.upgradePrompt.upgrade */
      upgrade: 'Upgrade',
    },
  },
};

/**
 * Exports.
 */
export default billingEn;
