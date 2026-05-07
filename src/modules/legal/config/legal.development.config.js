export default {
  legal: {
    cookieConsent: {
      enabled: false,
      privacyPolicyPath: '/legal/privacy',
    },
    pages: {
      enabled: false,
      routePrefix: '/legal',
      items: {
        terms:       { enabled: true,  slug: 'terms',        title: 'Terms of Service',          markdownPath: '/src/modules/legal/assets/templates/terms.template.md' },
        privacy:     { enabled: true,  slug: 'privacy',      title: 'Privacy Policy',            markdownPath: '/src/modules/legal/assets/templates/privacy.template.md' },
        refund:      { enabled: true,  slug: 'refund',       title: 'Refund Policy',             markdownPath: '/src/modules/legal/assets/templates/refund.template.md' },
        legalNotice: { enabled: true,  slug: 'legal-notice', title: 'Legal Notice',              markdownPath: '/src/modules/legal/assets/templates/legal-notice.template.md' },
        dpa:         { enabled: true,  slug: 'dpa',          title: 'Data Processing Agreement', markdownPath: '/src/modules/legal/assets/templates/dpa.template.md' },
        aup:         { enabled: false, slug: 'aup',          title: 'Acceptable Use Policy',     markdownPath: '/src/modules/legal/assets/templates/aup.template.md' },
      },
      entity: {
        name: null, legalForm: null, address: null, country: null,
        registrationId: null, contactEmail: null, dpoEmail: null,
        hostingProvider: null, hostingAddress: null,
      },
    },
  },
};
