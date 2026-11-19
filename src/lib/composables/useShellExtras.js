import { ref, markRaw } from 'vue';

/**
 * Module-scope singleton registry for the app shell. `app.vue` renders every
 * registered entry once, at the shell root (banners, toasts and invisible
 * registrars that must live independently of the active page). Optional
 * modules register their parts from their `<module>.app.js` entry, gated by
 * `isModuleActive`, so the shell imports no optional module and a module
 * switched off with `activated: false` mounts nothing.
 *
 * Each entry names where it mounts and its rank there, so the DOM order does
 * not depend on the order the module entries are imported in:
 * - `placement: 'beforeNav'` mounts before the navigation drawer;
 * - `placement: 'afterBanners'` (default) mounts after the auth banners.
 * Within a placement, entries are sorted by `order` (ascending, default 100),
 * then by registration order.
 */

/** @type {import('vue').Ref<Array<{_id: string, component: object, placement: string, order: number}>>} */
const extras = ref([]);

/**
 * Register (or replace) a shell part by id.
 * @param {string} id - Unique entry identifier (e.g. 'legal-cookie-banner')
 * @param {object} component - Vue component to render at the shell root
 * @param {{ placement?: 'beforeNav'|'afterBanners', order?: number }} [options] - Where and in which rank it mounts
 * @returns {void}
 */
const register = (id, component, { placement = 'afterBanners', order = 100 } = {}) => {
  const entry = { _id: id, component: markRaw(component), placement, order };
  const next = extras.value.filter((e) => e._id !== id);
  const idx = extras.value.findIndex((e) => e._id === id);
  if (idx >= 0) next.splice(idx, 0, entry);
  else next.push(entry);
  // Array.prototype.sort is stable: equal `order` keeps registration order.
  extras.value = next.sort((a, b) => a.order - b.order);
};

/**
 * Unregister a shell part by id.
 * @param {string} id - Unique entry identifier to remove
 * @returns {void}
 */
const unregister = (id) => {
  extras.value = extras.value.filter((e) => e._id !== id);
};

/**
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, component: object, placement: string, order: number}>>,
 *   register: (id: string, component: object, options?: { placement?: string, order?: number }) => void,
 *   unregister: (id: string) => void
 * }}
 */
export function useShellExtras() {
  return { extras, register, unregister };
}
