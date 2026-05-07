/**
 * vue-i18n plugin — devkit baseline locale bundle.
 * Downstream projects extend this by calling i18n.global.mergeLocaleMessage()
 * with their own override objects after importing from here.
 *
 * Usage in downstream main.js:
 *   import i18n from '@devkit/lib/plugins/i18n'
 *   i18n.global.mergeLocaleMessage('en', myProjectEn)
 *   i18n.global.mergeLocaleMessage('fr', myProjectFr)
 *   app.use(i18n)
 */

/**
 * Module dependencies.
 */
import { createI18n } from 'vue-i18n';
import { billingEn } from '../../modules/billing/lang/en.js';
import { billingFr } from '../../modules/billing/lang/fr.js';
import { usersEn } from '../../modules/users/lang/en.js';
import { usersFr } from '../../modules/users/lang/fr.js';
import { legalEn } from '../../modules/legal/lang/en.js';
import { legalFr } from '../../modules/legal/lang/fr.js';

/**
 * i18n instance — Composition API mode (legacy: false) so both
 * Options-API components (this.$t) and Composition-API composables
 * (useI18n) work out of the box via globalInjection.
 */
const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: { ...billingEn, ...usersEn, ...legalEn },
    fr: { ...billingFr, ...usersFr, ...legalFr },
  },
});

/**
 * Exports.
 */
export default i18n;
