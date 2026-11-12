import { toValue } from 'vue';
import { useHead } from '@unhead/vue';
import config from '../../config/index.js';

/**
 * @desc Build the head tags of one page: its own `<title>` (suffixed with the app
 * name from `config.app.title`) and its own description, mirrored on the Open Graph
 * and Twitter tags that `app.vue` sets globally. Unhead dedupes meta by name /
 * property and a later entry wins, so a view's entry overrides the app defaults
 * while the view is mounted and the defaults come back on unmount. A missing
 * description leaves the app-wide one in place.
 * @param {{ title?: string, description?: string }} page - The page's own title and description
 * @param {string} [appTitle] - The app name (defaults to `config.app.title`)
 * @returns {{ title: string, meta: Array<object> }} unhead input
 */
export const buildPageHead = (page, appTitle = config?.app?.title || '') => {
  const title = (page?.title || '').trim();
  const description = (page?.description || '').trim();
  const fullTitle = title && title !== appTitle ? [title, appTitle].filter(Boolean).join(' | ') : appTitle;
  return {
    title: fullTitle,
    meta: [
      { property: 'og:title', content: fullTitle },
      { name: 'twitter:title', content: fullTitle },
      ...(description
        ? [
            { name: 'description', content: description },
            { property: 'og:description', content: description },
            { name: 'twitter:description', content: description },
          ]
        : []),
    ],
  };
};

/**
 * @desc Give the calling view its own title and description in the document head.
 * Call it from `setup()`; the entry is removed when the view unmounts.
 * @param {{ title?: string, description?: string } | (() => { title?: string, description?: string }) | import('vue').Ref} page
 *   The page's title and description — a getter or ref when they load asynchronously
 * @returns {object} the unhead entry
 */
export const usePageHead = (page) => useHead(() => buildPageHead(toValue(page)));

export default usePageHead;
