/**
 * Shared SEO configuration builder.
 * Used by both the build-time Vite plugin (seo-inject.js) and the runtime
 * Vue component (app.vue) to ensure consistent meta tags in both contexts.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {{ title: string, lang: string, meta: object[], link: object[], schema: object|null }}
 */
export function buildSeoConfig(config) {
  const app = config?.app || {};
  const seo = app.seo || {};
  const og = seo.og || {};
  const schema = seo.schema || {};

  const meta = [
    app.description && { name: 'description', content: app.description },
    app.keywords && { name: 'keywords', content: app.keywords },
    app.author && { name: 'author', content: app.author },
    // Open Graph
    { property: 'og:type', content: og.type || 'website' },
    app.title && { property: 'og:title', content: app.title },
    app.description && { property: 'og:description', content: app.description },
    app.url && { property: 'og:url', content: app.url },
    og.image && { property: 'og:image', content: og.image },
    // Twitter Card
    { name: 'twitter:card', content: og.twitterCard || 'summary' },
    app.title && { name: 'twitter:title', content: app.title },
    app.description && { name: 'twitter:description', content: app.description },
    og.twitterSite && { name: 'twitter:site', content: og.twitterSite },
    og.image && { name: 'twitter:image', content: og.image },
  ].filter(Boolean);

  const link = app.url ? [{ rel: 'canonical', href: app.url }] : [];

  const schemaData =
    schema.enabled && schema.name
      ? {
          '@context': 'https://schema.org',
          '@type': schema.type || 'Person',
          name: schema.name,
          url: app.url || undefined,
          sameAs: schema.sameAs?.length ? schema.sameAs : undefined,
        }
      : null;

  return {
    title: app.title,
    lang: app.lang || 'en',
    meta,
    link,
    schema: schemaData,
  };
}
