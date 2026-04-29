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
  },
};

/**
 * Exports.
 */
export default billingFr;
