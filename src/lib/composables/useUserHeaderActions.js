import { createComponentRegistry } from './createComponentRegistry';

/**
 * Module-scope singleton registry for the account page header's `#actions`
 * slot. `user.view.vue` renders every registered entry in
 * `CorePageHeaderTabs`'s `#actions` slot (previously a hard import of the
 * organizations switcher component). Optional modules call `register` to
 * contribute a header action and `unregister` to remove it, without the
 * users module creating a compile-time dependency on them. Mirrors
 * `useFooterExtras`'s singleton-ref shape.
 *
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, component: object}>>,
 *   register: (id: string, component: object) => void,
 *   unregister: (id: string) => void
 * }}
 */
const registry = createComponentRegistry();

export function useUserHeaderActions() {
  return registry;
}
