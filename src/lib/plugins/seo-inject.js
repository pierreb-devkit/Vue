/**
 * Vite plugin — injects SEO meta tags from config into the static HTML at build time.
 * This ensures crawlers receive title, description, lang and social tags
 * before JavaScript executes.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {import('vite').Plugin}
 */

import { buildSeoConfig } from '../helpers/seo.js';

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[char]));

export function seoInjectPlugin(config) {
  return {
    name: 'seo-inject',
    transformIndexHtml(html) {
      const { title, lang, meta, link } = buildSeoConfig(config);

      const tags = [
        ...meta.map((m) =>
          m.property
            ? `  <meta property="${escapeHtml(m.property)}" content="${escapeHtml(m.content)}">`
            : `  <meta name="${escapeHtml(m.name)}" content="${escapeHtml(m.content)}">`,
        ),
        ...link.map((l) => `  <link rel="${escapeHtml(l.rel)}" href="${escapeHtml(l.href)}">`),
      ];

      // Robustly update lang attribute on <html> tag
      let result = html.replace(/<html([^>]*)>/i, (match, attrs) => {
        const escapedLang = escapeHtml(lang);
        const updatedAttrs = /lang="/i.test(attrs)
          ? attrs.replace(/lang="[^"]*"/i, `lang="${escapedLang}"`)
          : `${attrs} lang="${escapedLang}"`;
        return `<html${updatedAttrs}>`;
      });

      // Replace existing <title> tag
      const documentTitle = escapeHtml(title || 'App');
      if (/<title>.*<\/title>/i.test(result)) {
        result = result.replace(/<title>.*<\/title>/i, `<title>${documentTitle}</title>`);
      }

      // Inject tags before </head>
      result = result.replace(/<\/head>/i, `${tags.join('\n')}\n  </head>`);

      return result;
    },
  };
}
