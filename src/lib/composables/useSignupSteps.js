import { createComponentRegistry } from './createComponentRegistry';

/**
 * Module-scope singleton registry for extra sign-up steps, keyed by step id
 * (e.g. `'organizationSetup'`). `signup.view.vue` renders the registered
 * component for the current step instead of importing an optional module;
 * when no component is registered for a step the view skips it.
 *
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, component: object}>>,
 *   register: (id: string, component: object) => void,
 *   unregister: (id: string) => void
 * }}
 */
const registry = createComponentRegistry();

export function useSignupSteps() {
  return registry;
}
