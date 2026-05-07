import { ref } from 'vue';

/**
 * Module-scope singleton store for footer extra sections.
 * Core footer reads `extras` and renders them after `config.footer.links`.
 * @type {import('vue').Ref<Array<{_id: string, title: string, items: Array}>>}
 */
const extras = ref([]);

/**
 * Module-agnostic registry for footer sections.
 * Modules call `register` on mount and `unregister` on unmount to inject
 * their content into the core footer without creating a hard import dependency.
 *
 * @returns {{
 *   extras: import('vue').Ref<Array<{_id: string, title: string, items: Array}>>,
 *   register: (id: string, section: {title: string, items: Array}) => void,
 *   unregister: (id: string) => void
 * }}
 */
export function useFooterExtras() {
  /**
   * Register (or replace) a footer section by id.
   * @param {string} id - Unique section identifier (e.g. 'legal')
   * @param {{title: string, items: Array}} section - Section data
   * @returns {void}
   */
  const register = (id, section) => {
    const idx = extras.value.findIndex((s) => s._id === id);
    if (idx >= 0) extras.value.splice(idx, 1, { ...section, _id: id });
    else extras.value.push({ ...section, _id: id });
  };

  /**
   * Unregister a footer section by id.
   * @param {string} id - Unique section identifier to remove
   * @returns {void}
   */
  const unregister = (id) => {
    extras.value = extras.value.filter((s) => s._id !== id);
  };

  return { extras, register, unregister };
}
