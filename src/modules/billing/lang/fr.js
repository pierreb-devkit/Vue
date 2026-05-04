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
      breakdown: 'Répartition',
      /** i18n key: billing.usage.progress — interpolate {used} and {quota} */
      progress: '{used} sur {quota} unités utilisées',
      /** i18n key: billing.usage.exhausted */
      exhausted: 'Quota épuisé',
      /** i18n key: billing.usage.manageSubscription */
      manageSubscription: "Gérer l'abonnement",
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
        digest: 'Résumé',
        /** i18n key: billing.usage.bucket.generate */
        generate: 'Génération',
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
      title: 'Unités supplémentaires',
      /** i18n key: billing.extras.balance — interpolate {units}, pluralized via $t(key, count, namedVars) — vue-i18n v10 Composition API */
      balance: 'aucune unité restante | {units} unité restante | {units} unités restantes',
      /** i18n key: billing.extras.cta */
      cta: 'Acheter des unités',
      /** i18n key: billing.extras.purchaseSuccess */
      purchaseSuccess: 'Pack crédité sur votre solde',
      modal: {
        /** i18n key: billing.extras.modal.title */
        title: 'Acheter des unités supplémentaires',
        /** i18n key: billing.extras.modal.noPacksAvailable */
        noPacksAvailable: 'Aucun pack disponible pour le moment.',
        /** i18n key: billing.extras.modal.cancel */
        cancel: 'Annuler',
      },
    },
    alerts: {
      /** i18n key: billing.alerts.threshold80 */
      threshold80: 'Vous avez utilisé 80 % de votre quota hebdomadaire',
      /** i18n key: billing.alerts.threshold100 */
      threshold100: 'Quota atteint - extras consommés',
      /** i18n key: billing.alerts.extrasConsumed */
      extrasConsumed: 'Le solde des extras est épuisé',
    },
    equivalences: {
      /** i18n key: billing.equivalences.scrapRun */
      scrapRun: 'opérations / semaine',
    },
    extrasLedger: {
      empty: {
        /** i18n key: billing.extrasLedger.empty.noEntries */
        noEntries: 'Aucune entrée dans le journal',
      },
      headers: {
        /** i18n key: billing.extrasLedger.headers.date */
        date: 'Date',
        /** i18n key: billing.extrasLedger.headers.kind */
        kind: 'Type',
        /** i18n key: billing.extrasLedger.headers.amount */
        amount: 'Montant',
        /** i18n key: billing.extrasLedger.headers.refHistory */
        refHistory: 'Ref / Historique',
        /** i18n key: billing.extrasLedger.headers.stripeSession */
        stripeSession: 'Session Stripe',
      },
    },
    meterProgress: {
      /** i18n key: billing.meterProgress.over — interpolate {count} */
      over: '+{count} dépassement',
      /** i18n key: billing.meterProgress.remaining — interpolate {count}, pluralized via $t(key, count, namedVars) — vue-i18n v10 Composition API */
      remaining: '(aucun restant) | ({count} restant) | ({count} restants)',
      /** i18n key: billing.meterProgress.extras — interpolate {count} */
      extras: '+{count} extras',
      /** i18n key: billing.meterProgress.ariaOver — interpolate {base}, {used}, {quota}, {overage} */
      ariaOver: '{base}{used} sur {quota} utilisés, {overage} de dépassement',
      /** i18n key: billing.meterProgress.ariaUsed — interpolate {base}, {used}, {quota}, {percent} */
      ariaUsed: '{base}{used} sur {quota} utilisés ({percent}%)',
    },
    usageBar: {
      /** i18n key: billing.usageBar.adminLabel — used next to ∞ Admin display */
      adminLabel: 'Admin',
      /** i18n key: billing.usageBar.compute — unit label for free-tier display */
      compute: 'compute',
      /** i18n key: billing.usageBar.unlimited — legacy mode unlimited label */
      unlimited: 'Illimité',
      /** i18n key: billing.usageBar.remaining — interpolate {count}, pluralized via $t(key, count, namedVars) — vue-i18n v10 Composition API */
      remaining: '(aucun restant) | ({count} restant) | ({count} restants)',
    },
    subscriptions: {
      /** i18n key: billing.subscriptions.title */
      title: 'Abonnements',
      /** i18n key: billing.subscriptions.empty */
      empty: 'Aucun abonnement actif.',
      /** i18n key: billing.subscriptions.portal */
      portal: "Gérer l'abonnement",
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
          description: "Vous êtes sur le plan gratuit. Passez à un plan supérieur pour débloquer plus de projets, membres d'équipe et fonctionnalités avancées.",
        },
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
        /** i18n key: billing.subscriptions.error.fetchFailed */
        fetchFailed: 'Impossible de charger les détails de votre abonnement. Veuillez réessayer.',
        /** i18n key: billing.subscriptions.error.retry */
        retry: 'Réessayer',
        /** i18n key: billing.subscriptions.error.portalFailed */
        portalFailed: "Impossible d'ouvrir le portail de facturation. Veuillez réessayer.",
      },
      status: {
        /** i18n key: billing.subscriptions.status.updatePayment */
        updatePayment: 'Mettre à jour le moyen de paiement',
        /** i18n key: billing.subscriptions.status.reactivate */
        reactivate: 'Réactiver',
        /** i18n key: billing.subscriptions.status.completePayment */
        completePayment: 'Finaliser le paiement',
        /** i18n key: billing.subscriptions.status.paused */
        paused: 'En pause',
        /** i18n key: billing.subscriptions.status.unpaid */
        unpaid: 'Impayé',
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
          /** i18n key: billing.checkout.error.alreadyActive.close */
          close: 'Fermer',
        },
      },
    },
    pricing: {
      /** i18n key: billing.pricing.title */
      title: 'Tarifs',
      /** i18n key: billing.pricing.subtitle */
      subtitle: 'Choisissez le plan qui correspond à vos besoins.',
      cancel: {
        /** i18n key: billing.pricing.cancel.message */
        message: 'Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.',
      },
      error: {
        /** i18n key: billing.pricing.error.retry */
        retry: 'Réessayer',
        /** i18n key: billing.pricing.error.pricingUnavailable */
        pricingUnavailable: 'Tarif indisponible',
        /** i18n key: billing.pricing.error.pricingTemporarilyUnavailable */
        pricingTemporarilyUnavailable: 'Tarif temporairement indisponible',
        /** i18n key: billing.pricing.error.loadFailed */
        loadFailed: 'Impossible de charger les tarifs. Veuillez réessayer.',
        /** i18n key: billing.pricing.error.checkoutFailed */
        checkoutFailed: 'Impossible de démarrer le paiement. Veuillez réessayer.',
      },
      tabs: {
        /** i18n key: billing.pricing.tabs.plans */
        plans: 'Plans',
        /** i18n key: billing.pricing.tabs.units */
        units: 'Unités',
      },
      downgrade: {
        /** i18n key: billing.pricing.downgrade.title */
        title: 'Confirmer le changement de plan',
        /** i18n key: billing.pricing.downgrade.message — interpolate {from} and {to} */
        message: 'Vous passez de {from} à {to}. Stripe calculera le montant au prorata. Le quota sera réinitialisé à la prochaine période de facturation.',
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
      save: 'Économisez 20 %',
      /** i18n key: billing.pricingToggle.saveAnnually */
      saveAnnually: 'Économisez 20 % par an',
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
      /** i18n key: billing.packs.noUnitsAvailable */
      noUnitsAvailable: 'Aucun pack disponible pour le moment.',
    },
    upgradePrompt: {
      /** i18n key: billing.upgradePrompt.usageInfo — interpolate {current}, {limit}, {label} */
      usageInfo: 'Vous avez utilisé {current} sur {limit} {label}.',
      /** i18n key: billing.upgradePrompt.requirePlan — interpolate {plan} */
      requirePlan: 'Cette fonctionnalité nécessite le plan {plan}.',
      /** i18n key: billing.upgradePrompt.buyUnits */
      buyUnits: 'Acheter des unités',
      /** i18n key: billing.upgradePrompt.upgrade */
      upgrade: 'Passer à un plan supérieur',
    },
  },
};

/**
 * Exports.
 */
export default billingFr;
