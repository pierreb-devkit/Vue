/**
 * Pay-right helper: only organization owners and admins can start a plan checkout,
 * buy extras or open the Stripe portal. The server sends these rights as CASL abilities.
 */
import { ability } from '../../../lib/helpers/ability';

/**
 * @desc Whether a signed-in user with a current organization lacks the right to pay
 * for it. Guests and users without an organization are never "blocked" here — their
 * CTAs route to signup / organization setup. Abilities not loaded yet (empty rule
 * set) never block either: the server still enforces the right.
 * @param {{ isLoggedIn: boolean, user: ?Object }} authStore - auth store (or its state)
 * @param {string} subjectType - CASL subject: 'BillingCheckout' | 'BillingExtrasCheckout' | 'BillingPortal'
 * @returns {boolean} True when the pay action must be hidden or disabled.
 */
export function lacksPayRight(authStore, subjectType) {
  if (!authStore?.isLoggedIn || !authStore.user?.currentOrganization) return false;
  // can() first: it is the reactive read that lets a computed re-run once abilities load.
  const allowed = ability.can('create', subjectType);
  if (!ability.rules?.length) return false;
  return !allowed;
}
