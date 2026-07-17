import { createComponentRegistry } from './createComponentRegistry';

/**
 * Module-scope singleton registry for navigation-drawer "append" extras.
 * `core.navigation.component.vue` renders every registered entry above the
 * account row in the drawer's append slot (previously a hard `v-if="meterMode"`
 * import of the billing compute gauge). Optional modules call `register` when
 * their content should be shown and `unregister` when it should not, injecting
 * into the drawer without core creating a compile-time dependency on them.
 * Mirrors `useFooterExtras`'s singleton-ref shape.
 *
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, component: object}>>,
 *   register: (id: string, component: object) => void,
 *   unregister: (id: string) => void
 * }}
 */
const registry = createComponentRegistry();

export function useNavExtras() {
  return registry;
}
