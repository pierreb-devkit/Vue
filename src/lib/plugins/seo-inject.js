/**
 * Vite plugin — injects SEO meta tags from config into the static HTML at build time.
 * This ensures crawlers receive title, description, lang and social tags
 * before JavaScript executes.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {import('vite').Plugin}
 */
export function seoInjectPlugin(config) {
  const app = config?.app || {};
  const seo = app.seo || {};
  const og = seo.og || {};

  return {
    name: 'seo-inject',
    transformIndexHtml(html) {
      const tags = [];

      if (app.description)
        tags.push(`  <meta name="description" content="${app.description}">`);
      if (app.keywords)
        tags.push(`  <meta name="keywords" content="${app.keywords}">`);
      if (app.author)
        tags.push(`  <meta name="author" content="${app.author}">`);
      if (app.url)
        tags.push(`  <link rel="canonical" href="${app.url}">`);

      // Open Graph
      if (app.title)
        tags.push(`  <meta property="og:title" content="${app.title}">`);
      if (app.description)
        tags.push(`  <meta property="og:description" content="${app.description}">`);
      tags.push(`  <meta property="og:type" content="${og.type || 'website'}">`);
      if (app.url)
        tags.push(`  <meta property="og:url" content="${app.url}">`);
      if (og.image)
        tags.push(`  <meta property="og:image" content="${og.image}">`);

      // Twitter Card
      tags.push(`  <meta name="twitter:card" content="${og.twitterCard || 'summary'}">`);
      if (app.title)
        tags.push(`  <meta name="twitter:title" content="${app.title}">`);
      if (app.description)
        tags.push(`  <meta name="twitter:description" content="${app.description}">`);
      if (og.twitterSite)
        tags.push(`  <meta name="twitter:site" content="${og.twitterSite}">`);

      return html
        .replace('<html lang="en">', `<html lang="${app.lang || 'en'}">`)
        .replace('<title>DevKit</title>', `<title>${app.title || 'App'}</title>`)
        .replace('</head>', `${tags.join('\n')}\n  </head>`);
    },
  };
}
