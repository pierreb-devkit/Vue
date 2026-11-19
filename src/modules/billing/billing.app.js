/**
 * Billing module entry — eager-imported by `main.js` (`src/modules/*\/*.app.js`)
 * before the router is built and before Pinia is installed, so nothing here
 * touches a store at import time. Registers the module's shell parts and its
 * sign-in hook only while the module is active.
 */
import { isModuleActive } from '../../lib/helpers/modules';
import { useShellExtras } from '../../lib/composables/useShellExtras';
import { onSignin } from '../../lib/helpers/signinHooks';
import { useBillingStore } from './stores/billing.store';
import billingNavExtras from './components/billing.navExtras.component.vue';
import billingMeterAlert from './components/billing.meterAlert.component.vue';

/**
 * @desc Refresh the compute meter right after sign-in so the sidenav gauge
 * populates without waiting for mount/focus (only when meterMode is on).
 * Runs inside the auth store's signin action, so Pinia is active.
 * @param {{ serverConfig: object|null }} ctx - Session context from the auth store.
 * @returns {Promise<unknown>|undefined}
 */
export const refreshMeterOnSignin = ({ serverConfig }) => {
  if (serverConfig?.billing?.meterMode !== true) return undefined;
  // meter refresh is best-effort; do not log err (avoids leaking response internals to the console)
  return useBillingStore().fetchUsageMeter().catch(() => {});
};

/**
 * @desc Register the billing shell parts and sign-in hook when billing is active.
 * Idempotent: registries are keyed by id.
 * @returns {void}
 */
export const register = () => {
  if (!isModuleActive('billing')) return;
  const shell = useShellExtras();
  shell.register('billing-nav-extras', billingNavExtras);
  shell.register('billing-meter-alert', billingMeterAlert);
  onSignin('billing-meter-refresh', refreshMeterOnSignin);
};

register();
