import { ref, markRaw } from 'vue';

/**
 * @desc Factory for a module-scope singleton component registry: an ordered,
 * id-keyed list of Vue component references that a host component renders
 * (via `<component :is>`) and that optional modules populate at runtime
 * instead of being hard-imported by the host. Shares the register/unregister
 * bookkeeping shape used by `useFooterExtras` (which stores plain section
 * data rather than component references, so it is not built on this factory)
 * so every module-decoupling seam in the app follows the same pattern.
 *
 * Each call returns a fresh, independent registry — callers (e.g.
 * `useNavExtras`, `useUserHeaderActions`) create ONE module-scope instance
 * and export a `use*` accessor for it, mirroring `useFooterExtras`'s
 * singleton-ref shape.
 *
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, component: object}>>,
 *   register: (id: string, component: object) => void,
 *   unregister: (id: string) => void
 * }}
 */
export function createComponentRegistry() {
  /** @type {import('vue').Ref<Array<{_id: string, component: object}>>} */
  const extras = ref([]);

  /**
   * Register (or replace) a component by id.
   * @param {string} id - Unique entry identifier (e.g. 'billing-nav-compute-gauge')
   * @param {object} component - Vue component definition/reference to render
   * @returns {void}
   */
  const register = (id, component) => {
    const entry = { _id: id, component: markRaw(component) };
    const idx = extras.value.findIndex((e) => e._id === id);
    if (idx >= 0) extras.value.splice(idx, 1, entry);
    else extras.value.push(entry);
  };

  /**
   * Unregister a component by id.
   * @param {string} id - Unique entry identifier to remove
   * @returns {void}
   */
  const unregister = (id) => {
    extras.value = extras.value.filter((e) => e._id !== id);
  };

  return { extras, register, unregister };
}
