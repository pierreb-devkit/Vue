/**
 * Vite plugin — injects SEO meta tags from config into the static HTML at build time.
 * This ensures crawlers receive title, description, lang and social tags
 * before JavaScript executes.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {import('vite').Plugin}
 */

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[char]));

export function seoInjectPlugin(config) {
  const app = config?.app || {};
  const seo = app.seo || {};
  const og = seo.og || {};

  return {
    name: 'seo-inject',
    transformIndexHtml(html) {
      const tags = [];

      if (app.description)
        tags.push(`  <meta name="description" content="${escapeHtml(app.description)}">`);
      if (app.keywords)
        tags.push(`  <meta name="keywords" content="${escapeHtml(app.keywords)}">`);
      if (app.author)
        tags.push(`  <meta name="author" content="${escapeHtml(app.author)}">`);
      if (app.url)
        tags.push(`  <link rel="canonical" href="${escapeHtml(app.url)}">`);

      // Open Graph
      if (app.title)
        tags.push(`  <meta property="og:title" content="${escapeHtml(app.title)}">`);
      if (app.description)
        tags.push(`  <meta property="og:description" content="${escapeHtml(app.description)}">`);
      tags.push(`  <meta property="og:type" content="${escapeHtml(og.type || 'website')}">`);
      if (app.url)
        tags.push(`  <meta property="og:url" content="${escapeHtml(app.url)}">`);
      if (og.image)
        tags.push(`  <meta property="og:image" content="${escapeHtml(og.image)}">`);

      // Twitter Card
      tags.push(`  <meta name="twitter:card" content="${escapeHtml(og.twitterCard || 'summary')}">`);
      if (app.title)
        tags.push(`  <meta name="twitter:title" content="${escapeHtml(app.title)}">`);
      if (app.description)
        tags.push(`  <meta name="twitter:description" content="${escapeHtml(app.description)}">`);
      if (og.twitterSite)
        tags.push(`  <meta name="twitter:site" content="${escapeHtml(og.twitterSite)}">`);
      if (og.image)
        tags.push(`  <meta name="twitter:image" content="${escapeHtml(og.image)}">`);

      // Robustly update lang attribute on <html> tag
      let result = html.replace(/<html([^>]*)>/i, (match, attrs) => {
        const lang = escapeHtml(app.lang || 'en');
        const updatedAttrs = /lang="/i.test(attrs)
          ? attrs.replace(/lang="[^"]*"/i, `lang="${lang}"`)
          : `${attrs} lang="${lang}"`;
        return `<html${updatedAttrs}>`;
      });

      // Replace existing <title> tag
      const documentTitle = escapeHtml(app.title || 'App');
      if (/<title>.*<\/title>/i.test(result)) {
        result = result.replace(/<title>.*<\/title>/i, `<title>${documentTitle}</title>`);
      }

      // Inject tags before </head> (replace only the first occurrence)
      result = result.replace(/<\/head>/i, `${tags.join('\n')}\n  </head>`);

      return result;
    },
  };
}
