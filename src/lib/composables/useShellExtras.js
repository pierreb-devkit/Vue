import { createComponentRegistry } from './createComponentRegistry';

/**
 * Module-scope singleton registry for the app shell. `app.vue` renders every
 * registered entry once, at the shell root (banners, toasts and invisible
 * registrars that must live independently of the active page). Optional
 * modules register their parts from their `<module>.app.js` entry, gated by
 * `isModuleActive`, so the shell imports no optional module and a module
 * switched off with `activated: false` mounts nothing.
 *
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, component: object}>>,
 *   register: (id: string, component: object) => void,
 *   unregister: (id: string) => void
 * }}
 */
const registry = createComponentRegistry();

export function useShellExtras() {
  return registry;
}
