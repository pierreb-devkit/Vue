/**
 * Billing module — French i18n strings.
 * These keys are referenced in billing components via comments for future vue-i18n adoption.
 * Downstream projects may override these strings by merging into their i18n configuration.
 */
export const billingFr = {
  billing: {
    usage: {
      /** i18n key: billing.usage.weekly */
      weekly: 'Compteur hebdo',
      /** i18n key: billing.usage.breakdown */
      breakdown: 'Répartition',
      /** i18n key: billing.usage.progress — interpolate {used} and {quota} */
      progress: '{used} sur {quota} unités utilisées',
      /** i18n key: billing.usage.exhausted */
      exhausted: 'Quota épuisé',
      /** i18n key: billing.usage.manageSubscription */
      manageSubscription: "Gérer l'abonnement",
      bucket: {
        /** i18n key: billing.usage.bucket.scrap */
        scrap: 'Scrape',
        /** i18n key: billing.usage.bucket.autofix */
        autofix: 'Autofix',
        /** i18n key: billing.usage.bucket.wizard */
        wizard: 'Assistant',
        /** i18n key: billing.usage.bucket.digest */
        digest: 'Résumé',
        /** i18n key: billing.usage.bucket.generate */
        generate: 'Génération',
        /** i18n key: billing.usage.bucket.chat */
        chat: 'Chat',
      },
    },
    extras: {
      /** i18n key: billing.extras.title */
      title: 'Unités supplémentaires',
      /** i18n key: billing.extras.balance — interpolate {units} */
      balance: '{units} unités restantes',
      /** i18n key: billing.extras.cta */
      cta: 'Acheter des unités',
      /** i18n key: billing.extras.purchaseSuccess */
      purchaseSuccess: 'Pack crédité sur votre solde',
    },
    alerts: {
      /** i18n key: billing.alerts.threshold80 */
      threshold80: 'Vous avez utilisé 80 % de votre quota hebdomadaire',
      /** i18n key: billing.alerts.threshold100 */
      threshold100: 'Quota atteint — extras consommés',
      /** i18n key: billing.alerts.extrasConsumed */
      extrasConsumed: 'Le solde des extras est épuisé',
    },
    equivalences: {
      /** i18n key: billing.equivalences.scrapRun */
      scrapRun: 'opérations / semaine',
    },
    subscriptions: {
      /** i18n key: billing.subscriptions.title */
      title: 'Abonnements',
      /** i18n key: billing.subscriptions.empty */
      empty: 'Aucun abonnement actif.',
      /** i18n key: billing.subscriptions.portal */
      portal: "Gérer l'abonnement",
      plan: {
        /** i18n key: billing.subscriptions.plan.current */
        current: 'Plan actuel',
      },
      meter: {
        /** i18n key: billing.subscriptions.meter.label */
        label: 'Compteur hebdo',
      },
      extras: {
        /** i18n key: billing.subscriptions.extras.balance */
        balance: 'Unités supplémentaires',
        /** i18n key: billing.subscriptions.extras.ledger */
        ledger: 'Historique des transactions',
      },
      cta: {
        /** i18n key: billing.subscriptions.cta.upgrade */
        upgrade: 'Passer à un plan supérieur',
      },
      error: {
        /** i18n key: billing.subscription.error.fetchFailed */
        fetchFailed: 'Impossible de charger les détails de votre abonnement. Veuillez réessayer.',
        /** i18n key: billing.subscription.error.retry */
        retry: 'Réessayer',
      },
    },
    checkout: {
      success: {
        /** i18n key: billing.checkout.success.processing */
        processing: 'Traitement de votre paiement...',
        /** i18n key: billing.checkout.success.synced */
        synced: 'Abonnement activé avec succès. Merci !',
        /** i18n key: billing.checkout.success.timeout */
        timeout: 'Paiement reçu, votre abonnement est en cours de synchronisation. Veuillez rafraîchir dans quelques secondes.',
        /** i18n key: billing.checkout.success.refresh */
        refresh: 'Rafraîchir',
      },
      error: {
        alreadyActive: {
          /** i18n key: billing.checkout.error.alreadyActive.title */
          title: 'Abonnement déjà actif',
          /** i18n key: billing.checkout.error.alreadyActive.message */
          message: 'Vous avez déjà un abonnement actif. Gérez-le via le Portail client.',
          /** i18n key: billing.checkout.error.alreadyActive.cta */
          cta: 'Ouvrir le portail client',
        },
      },
    },
    pricing: {
      tabs: {
        /** i18n key: billing.pricing.tabs.plans */
        plans: 'Plans',
        /** i18n key: billing.pricing.tabs.units */
        units: 'Unités',
      },
    },
    packs: {
      /** i18n key: billing.packs.title */
      title: "Packs d'unités",
      /** i18n key: billing.packs.cta */
      cta: 'Acheter des unités',
      /** i18n key: billing.packs.purchase — interpolate {label} */
      purchase: 'Acheter {label}',
      /** i18n key: billing.packs.units — interpolate {amount} */
      units: '+{amount} unités',
    },
  },
};

/**
 * Exports.
 */
export default billingFr;
