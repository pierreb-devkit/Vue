/**
 * Organizations module entry — eager-imported by `main.js`
 * (`src/modules/*\/*.app.js`) before Pinia is installed. Registers the
 * module's shell parts and its sign-up step only while the module is active.
 */
import { isModuleActive } from '../../lib/helpers/modules';
import { useShellExtras } from '../../lib/composables/useShellExtras';
import { useSignupSteps } from '../../lib/composables/useSignupSteps';
import organizationsAdminPendingBanner from './components/organizations.adminPendingBanner.component.vue';
import organizationsLoginNotices from './components/organizations.loginNotices.component.vue';
import organizationsHeaderAction from './components/organizations.headerAction.component.vue';
import organizationsSignupSetup from './components/organizations.signupSetup.component.vue';

/**
 * @desc Register the organizations shell parts and the sign-up setup step
 * when the module is active. Idempotent.
 * @returns {void}
 */
export const register = () => {
  if (!isModuleActive('organizations')) return;
  const shell = useShellExtras();
  shell.register('organizations-admin-pending-banner', organizationsAdminPendingBanner);
  shell.register('organizations-login-notices', organizationsLoginNotices);
  shell.register('organizations-header-action', organizationsHeaderAction);
  useSignupSteps().register('organizationSetup', organizationsSignupSetup);
};

register();
