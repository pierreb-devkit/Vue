import { toValue } from 'vue';
import { useHead } from '@unhead/vue';
import config from '../../config/index.js';

/**
 * @desc Turn a markdown snippet into plain text for a meta tag: removes paired and
 * structural markers only (bold, italic, inline code, links, images, heading /
 * quote / list signs at a line start), then collapses whitespace. A marker that is
 * not paired stays, so `snake_case`, `2 * 3`, `#4844` and apostrophes are kept.
 * @param {string} text - The text, possibly holding markdown
 * @returns {string} The plain text
 */
export const stripMarkdown = (text) =>
  String(text ?? '')
    .replace(/^[ \t]*(?:#{1,6}|>|[-*+])[ \t]+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '$1')
    .replace(/(?<!\w)__(?=\S)(.+?)(?<=\S)__(?!\w)/g, '$1')
    .replace(/(?<!\w)\*(?=[^\s*])([^*]+?)(?<=\S)\*(?!\w)/g, '$1')
    .replace(/(?<!\w)_(?=[^\s_])([^_]+?)(?<=\S)_(?!\w)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * @desc Build the head tags of one page: its own `<title>` (suffixed with the app
 * name from `config.app.title`) and its own description (markdown stripped), mirrored on the Open Graph
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
  const description = stripMarkdown(page?.description || '');
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
