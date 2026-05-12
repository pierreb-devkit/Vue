/**
 * Users module — French i18n strings.
 * These keys are referenced in user components via comments for future vue-i18n adoption.
 * Downstream projects may override these strings by merging into their i18n configuration.
 */
export const usersFr = {
  users: {
    tabs: {
      /** i18n key: users.tabs.profile */
      profile: 'Profil',
      /** i18n key: users.tabs.organizations */
      organizations: 'Organisations',
      /** i18n key: users.tabs.subscriptions */
      subscriptions: 'Abonnements',
    },
    deleteAccount: {
      /** i18n key: users.deleteAccount.title */
      title: 'Supprimer le compte',
      /** i18n key: users.deleteAccount.warning */
      warning: 'Supprimez définitivement votre compte, vos données et la propriété de votre organisation. Cette action est irréversible.',
      /** i18n key: users.deleteAccount.cta */
      cta: 'Supprimer le compte',
      /** i18n key: users.deleteAccount.confirmLabel */
      confirmLabel: 'Tapez DELETE pour confirmer',
    },
  },
};

/**
 * Exports.
 */
export default usersFr;
