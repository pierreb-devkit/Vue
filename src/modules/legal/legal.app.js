/**
 * Legal module entry — eager-imported by `main.js` (`src/modules/*\/*.app.js`)
 * before Pinia is installed. Registers the cookie banner and the footer legal
 * links at the app shell only while the module is active.
 */
import { isModuleActive } from '../../lib/helpers/modules';
import { useShellExtras } from '../../lib/composables/useShellExtras';
import legalCookieBanner from './components/legal.cookieBanner.component.vue';
import legalFooterSection from './components/legal.footerSection.component.vue';

/**
 * @desc Register the legal shell parts when the module is active. Idempotent.
 * @returns {void}
 */
export const register = () => {
  if (!isModuleActive('legal')) return;
  const shell = useShellExtras();
  shell.register('legal-cookie-banner', legalCookieBanner);
  shell.register('legal-footer-section', legalFooterSection);
};

register();
