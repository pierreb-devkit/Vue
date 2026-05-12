/**
 * Users module — English i18n strings.
 * These keys are referenced in user components via comments for future vue-i18n adoption.
 * Downstream projects may override these strings by merging into their i18n configuration.
 */
export const usersEn = {
  users: {
    tabs: {
      /** i18n key: users.tabs.profile */
      profile: 'Profile',
      /** i18n key: users.tabs.organizations */
      organizations: 'Organizations',
      /** i18n key: users.tabs.subscriptions */
      subscriptions: 'Subscriptions',
    },
    deleteAccount: {
      /** i18n key: users.deleteAccount.title */
      title: 'Delete account',
      /** i18n key: users.deleteAccount.warning */
      warning: 'Permanently delete your account, data, and organization ownership. This cannot be undone.',
      /** i18n key: users.deleteAccount.cta */
      cta: 'Delete account',
      /** i18n key: users.deleteAccount.confirmLabel */
      confirmLabel: 'Type DELETE to confirm',
    },
  },
};

/**
 * Exports.
 */
export default usersEn;
