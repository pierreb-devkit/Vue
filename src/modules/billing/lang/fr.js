/**
 * Billing module — French i18n strings.
 * Downstream projects may override these strings by merging into their i18n configuration:
 *   import i18n from '@devkit/lib/plugins/i18n'
 *   i18n.global.mergeLocaleMessage('fr', { billing: { ... } })
 */
export const billingFr = {
  billing: {
    usage: {
      /** i18n key: billing.usage.weekly */
      weekly: 'Compteur hebdo',
      /** i18n key: billing.usage.breakdown */
      breakdown: 'Repartition',
      /** i18n key: billing.usage.progress — interpolate {used} and {quota} */
      progress: '{used} sur {quota} unites utilisees',
      /** i18n key: billing.usage.exhausted */
      exhausted: 'Quota epuise',
      /** i18n key: billing.usage.manageSubscription */
      manageSubscription: "Gerer l'abonnement",
      /** i18n key: billing.usage.weeklyUsage */
      weeklyUsage: 'Usage hebdo',
      bucket: {
        /** i18n key: billing.usage.bucket.scrap */
        scrap: 'Scrape',
        /** i18n key: billing.usage.bucket.autofix */
        autofix: 'Autofix',
        /** i18n key: billing.usage.bucket.wizard */
        wizard: 'Assistant',
        /** i18n key: billing.usage.bucket.digest */
        digest: 'Resume',
        /** i18n key: billing.usage.bucket.generate */
        generate: 'Generation',
        /** i18n key: billing.usage.bucket.chat */
        chat: 'Chat',
      },
    },
    period: {
      /** i18n key: billing.period.month */
      month: '/mois',
      /** i18n key: billing.period.year */
      year: '/an',
    },
    extras: {
      /** i18n key: billing.extras.title */
      title: 'Unites supplementaires',
      /** i18n key: billing.extras.balance — interpolate {units} */
      balance: '{units} unites restantes',
      /** i18n key: billing.extras.cta */
      cta: 'Acheter des unites',
      /** i18n key: billing.extras.purchaseSuccess */
      purchaseSuccess: 'Pack credite sur votre solde',
      modal: {
        /** i18n key: billing.extras.modal.title */
        title: 'Acheter des unites supplementaires',
        /** i18n key: billing.extras.modal.noPacksAvailable */
        noPacksAvailable: 'Aucun pack disponible pour le moment.',
        /** i18n key: billing.extras.modal.cancel */
        cancel: 'Annuler',
      },
    },
    alerts: {
      /** i18n key: billing.alerts.threshold80 */
      threshold80: 'Vous avez utilise 80 % de votre quota hebdomadaire',
      /** i18n key: billing.alerts.threshold100 */
      threshold100: 'Quota atteint - extras consommes',
      /** i18n key: billing.alerts.extrasConsumed */
      extrasConsumed: 'Le solde des extras est epuise',
    },
    equivalences: {
      /** i18n key: billing.equivalences.scrapRun */
      scrapRun: 'operations / semaine',
    },
    subscriptions: {
      /** i18n key: billing.subscriptions.title */
      title: 'Abonnements',
      /** i18n key: billing.subscriptions.empty */
      empty: 'Aucun abonnement actif.',
      /** i18n key: billing.subscriptions.portal */
      portal: "Gerer l'abonnement",
      /** i18n key: billing.subscriptions.unavailable */
      unavailable: 'Abonnement indisponible',
      /** i18n key: billing.subscriptions.changePlan */
      changePlan: 'Changer de plan',
      plan: {
        /** i18n key: billing.subscriptions.plan.current */
        current: 'Plan actuel',
        /** i18n key: billing.subscriptions.plan.status */
        status: 'Statut :',
        /** i18n key: billing.subscriptions.plan.nextBilling — interpolate {date} */
        nextBilling: 'Prochaine facturation : {date}',
        free: {
          /** i18n key: billing.subscriptions.plan.free.description */
          description: "Vous etes sur le plan gratuit. Passez a un plan superieur pour debloquer plus de projets, membres d'equipe et fonctionnalites avancees.",
        },
      },
      meter: {
        /** i18n key: billing.subscriptions.meter.label */
        label: 'Compteur hebdo',
      },
      extras: {
        /** i18n key: billing.subscriptions.extras.balance */
        balance: 'Unites supplementaires',
        /** i18n key: billing.subscriptions.extras.ledger */
        ledger: 'Historique des transactions',
      },
      cta: {
        /** i18n key: billing.subscriptions.cta.upgrade */
        upgrade: 'Passer a un plan superieur',
      },
      error: {
        /** i18n key: billing.subscriptions.error.fetchFailed */
        fetchFailed: 'Impossible de charger les details de votre abonnement. Veuillez reessayer.',
        /** i18n key: billing.subscriptions.error.retry */
        retry: 'Reessayer',
        /** i18n key: billing.subscriptions.error.portalFailed */
        portalFailed: 'Impossible d\'ouvrir le portail de facturation. Veuillez reessayer.',
      },
      status: {
        /** i18n key: billing.subscriptions.status.updatePayment */
        updatePayment: 'Mettre a jour le moyen de paiement',
        /** i18n key: billing.subscriptions.status.reactivate */
        reactivate: 'Reactiver',
        /** i18n key: billing.subscriptions.status.completePayment */
        completePayment: 'Finaliser le paiement',
      },
    },
    checkout: {
      success: {
        /** i18n key: billing.checkout.success.processing */
        processing: 'Traitement de votre paiement...',
        /** i18n key: billing.checkout.success.synced */
        synced: 'Abonnement active avec succes. Merci !',
        /** i18n key: billing.checkout.success.timeout */
        timeout: 'Paiement recu, votre abonnement est en cours de synchronisation. Veuillez rafraichir dans quelques secondes.',
        /** i18n key: billing.checkout.success.refresh */
        refresh: 'Rafraichir',
      },
      error: {
        alreadyActive: {
          /** i18n key: billing.checkout.error.alreadyActive.title */
          title: 'Abonnement deja actif',
          /** i18n key: billing.checkout.error.alreadyActive.message */
          message: 'Vous avez deja un abonnement actif. Gerez-le via le Portail client.',
          /** i18n key: billing.checkout.error.alreadyActive.cta */
          cta: 'Ouvrir le portail client',
          /** i18n key: billing.checkout.error.alreadyActive.close */
          close: 'Fermer',
        },
      },
    },
    pricing: {
      /** i18n key: billing.pricing.title */
      title: 'Tarifs',
      /** i18n key: billing.pricing.subtitle */
      subtitle: 'Choisissez le plan qui correspond a vos besoins.',
      cancel: {
        /** i18n key: billing.pricing.cancel.message */
        message: 'Paiement annule. Vous pouvez reessayer quand vous le souhaitez.',
      },
      error: {
        /** i18n key: billing.pricing.error.retry */
        retry: 'Reessayer',
        /** i18n key: billing.pricing.error.pricingUnavailable */
        pricingUnavailable: 'Tarif indisponible',
        /** i18n key: billing.pricing.error.pricingTemporarilyUnavailable */
        pricingTemporarilyUnavailable: 'Tarif temporairement indisponible',
        /** i18n key: billing.pricing.error.loadFailed */
        loadFailed: 'Impossible de charger les tarifs. Veuillez reessayer.',
        /** i18n key: billing.pricing.error.checkoutFailed */
        checkoutFailed: 'Impossible de demarrer le paiement. Veuillez reessayer.',
      },
      tabs: {
        /** i18n key: billing.pricing.tabs.plans */
        plans: 'Plans',
        /** i18n key: billing.pricing.tabs.units */
        units: 'Unites',
      },
      downgrade: {
        /** i18n key: billing.pricing.downgrade.title */
        title: 'Confirmer le changement de plan',
        /** i18n key: billing.pricing.downgrade.message — interpolate {from} and {to} */
        message: 'Vous passez de {from} a {to}. Stripe calculera le montant au prorata. Le quota sera reinitialise a la prochaine periode de facturation.',
        /** i18n key: billing.pricing.downgrade.cancel */
        cancel: 'Annuler',
        /** i18n key: billing.pricing.downgrade.confirm */
        confirm: 'Continuer vers le paiement',
      },
    },
    pricingCard: {
      /** i18n key: billing.pricingCard.free */
      free: 'Gratuit',
      /** i18n key: billing.pricingCard.currentPlan */
      currentPlan: 'Plan actuel',
    },
    pricingToggle: {
      /** i18n key: billing.pricingToggle.monthly */
      monthly: 'Mensuel',
      /** i18n key: billing.pricingToggle.annual */
      annual: 'Annuel',
      /** i18n key: billing.pricingToggle.save */
      save: 'Economisez 20 %',
      /** i18n key: billing.pricingToggle.saveAnnually */
      saveAnnually: 'Economisez 20 % par an',
    },
    packs: {
      /** i18n key: billing.packs.title */
      title: "Packs d'unites",
      /** i18n key: billing.packs.cta */
      cta: 'Acheter des unites',
      /** i18n key: billing.packs.purchase — interpolate {label} */
      purchase: 'Acheter {label}',
      /** i18n key: billing.packs.units — interpolate {amount} */
      units: '+{amount} unites',
      /** i18n key: billing.packs.noUnitsAvailable */
      noUnitsAvailable: 'Aucun pack disponible pour le moment.',
    },
    upgradePrompt: {
      /** i18n key: billing.upgradePrompt.usageInfo — interpolate {current}, {limit}, {label} */
      usageInfo: 'Vous avez utilise {current} sur {limit} {label}.',
      /** i18n key: billing.upgradePrompt.requirePlan — interpolate {plan} */
      requirePlan: 'Cette fonctionnalite necessite le plan {plan}.',
      /** i18n key: billing.upgradePrompt.buyUnits */
      buyUnits: "Acheter des unites",
      /** i18n key: billing.upgradePrompt.upgrade */
      upgrade: 'Passer a un plan superieur',
    },
  },
};

/**
 * Exports.
 */
export default billingFr;
