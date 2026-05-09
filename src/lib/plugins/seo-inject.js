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

/**
 * Derive the primary theme color from config's Vuetify theme definition.
 *
 * @param {object} config - full app config object
 * @returns {string|null} hex color string or null when unavailable
 */
function getPrimaryColor(config) {
  return config?.vuetify?.theme?.themes?.light?.colors?.primary || null;
}

/**
 * Check whether a URL uses a safe protocol (http or https only).
 *
 * @param {string} url - URL string to validate
 * @returns {boolean} true when the URL starts with http:// or https://
 */
function isSafeUrl(url) {
  return /^https?:\/\//i.test(url);
}

/**
 * Build preconnect and dns-prefetch link tags for the supplied URLs.
 * Only URLs with http or https protocols are accepted; unsafe schemes
 * (e.g. javascript:) are silently skipped.
 *
 * @param {string[]} urls - origins to preconnect to
 * @returns {string[]} array of HTML tag strings
 */
function buildPreconnectTags(urls) {
  const tags = [];
  for (const url of urls) {
    if (!isSafeUrl(url)) continue;
    tags.push(`  <link rel="preconnect" href="${escapeHtml(url)}">`);
    tags.push(`  <link rel="dns-prefetch" href="${escapeHtml(url)}">`);
  }
  return tags;
}

/**
 * Build a noscript fallback block with the app title and description.
 * Tags are only emitted when their value is non-empty to avoid
 * semantically incorrect empty elements (e.g. empty h1).
 *
 * @param {string} title - page title (will be escaped)
 * @param {string} description - page description (will be escaped)
 * @returns {string} noscript HTML string, or an empty string when both values are empty
 */
function buildNoscriptBlock(title, description) {
  let innerHtml = '';
  if (title) innerHtml += `<h1>${escapeHtml(title)}</h1>`;
  if (description) innerHtml += `<p>${escapeHtml(description)}</p>`;
  if (!innerHtml) return '';
  return `<noscript>${innerHtml}</noscript>`;
}

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

      // Theme color — explicit override wins over Vuetify primary
      const themeColor = seo.themeColor || getPrimaryColor(config);
      if (themeColor)
        tags.push(`  <meta name="theme-color" content="${escapeHtml(themeColor)}">`);

      // Preconnect hints
      const preconnectUrls = seo.preconnect || [];
      if (preconnectUrls.length)
        tags.push(...buildPreconnectTags(preconnectUrls));

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

      // JSON-LD structured data — supports both legacy single-schema and new multi-schema array
      const buildJsonLd = (entry) => {
        if (!entry || !entry.type) return null;
        const base = {
          '@context': 'https://schema.org',
          '@type': entry.type,
          name: entry.name || app.title,
          url: entry.url || app.url,
          description: entry.description || app.description,
          ...(entry.jobTitle && { jobTitle: entry.jobTitle }),
          ...(entry.sameAs?.length && { sameAs: entry.sameAs }),
          ...((entry.image || og.image) && { image: entry.image || og.image }),
        };

        // Rich SoftwareApplication-style fields (#4092). Emit when present regardless of @type
        // to avoid hard-coding a type allow-list that lags schema.org evolution.
        if (entry.applicationCategory) base.applicationCategory = entry.applicationCategory;
        if (entry.operatingSystem) base.operatingSystem = entry.operatingSystem;
        if (entry.softwareVersion) base.softwareVersion = entry.softwareVersion;
        if (entry.screenshot) base.screenshot = entry.screenshot;

        if (Array.isArray(entry.offers) && entry.offers.length) {
          base.offers = entry.offers.map((offer) => ({
            '@type': offer.type || 'Offer',
            ...(offer.price !== undefined && { price: offer.price }),
            ...(offer.priceCurrency && { priceCurrency: offer.priceCurrency }),
            ...(offer.name && { name: offer.name }),
            ...(offer.priceValidUntil && { priceValidUntil: offer.priceValidUntil }),
            ...(offer.url && { url: offer.url }),
          }));
        }

        if (entry.aggregateRating && typeof entry.aggregateRating === 'object') {
          base.aggregateRating = {
            '@type': 'AggregateRating',
            ...(entry.aggregateRating.ratingValue !== undefined && { ratingValue: entry.aggregateRating.ratingValue }),
            ...(entry.aggregateRating.ratingCount !== undefined && { ratingCount: entry.aggregateRating.ratingCount }),
            ...(entry.aggregateRating.bestRating !== undefined && { bestRating: entry.aggregateRating.bestRating }),
            ...(entry.aggregateRating.worstRating !== undefined && { worstRating: entry.aggregateRating.worstRating }),
          };
        }

        return base;
      };

      const ldEntries = [];
      // Legacy single-schema path (back-compat)
      const legacy = seo.schema || {};
      if (legacy.enabled && legacy.type) {
        const built = buildJsonLd(legacy);
        if (built) ldEntries.push(built);
      }
      // New multi-schema path
      if (Array.isArray(seo.schemas)) {
        for (const entry of seo.schemas) {
          const built = buildJsonLd(entry);
          if (built) ldEntries.push(built);
        }
      }
      for (const ld of ldEntries) {
        const safeJson = JSON.stringify(ld).replace(/</g, '\\u003c');
        tags.push(`  <script type="application/ld+json">${safeJson}</script>`);
      }

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

      // Noscript fallback before </body>
      if (app.title || app.description) {
        const noscript = buildNoscriptBlock(app.title || '', app.description || '');
        result = result.replace(/<\/body>/i, `${noscript}\n</body>`);
      }

      return result;
    },
  };
}
