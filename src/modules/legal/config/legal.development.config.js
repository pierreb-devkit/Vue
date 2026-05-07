export default {
  legal: {
    // ============================================================
    // COOKIE CONSENT — RGPD/GDPR analytics gating
    // ============================================================
    // Activates a Vuetify v-snackbar (bottom-right) shown to the user
    // on first visit. Only Accept persists posthog cookies.
    //
    // Prerequisites:
    // - PostHog MUST be configured (analytics.posthog.key set, e.g.
    //   via DEVKIT_VUE_analytics_posthog_key build-arg). When the
    //   key is empty, the banner auto-hides and a console.warn is
    //   emitted at init time. Enabling cookieConsent without posthog
    //   is a no-op and should stay disabled.
    //
    // Defaults: disabled. Override per project.
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
