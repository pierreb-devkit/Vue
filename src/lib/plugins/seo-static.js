/**
 * Vite plugin — generates robots.txt, sitemap.xml and manifest.json at build time.
 * Files are emitted directly into the build output directory so they never
 * conflict with upstream merges via public/.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {import('vite').Plugin}
 */

/**
 * Build robots.txt content from config rules.
 *
 * @param {Array<{userAgent: string, allow?: string, disallow?: string}>} rules - robots rules
 * @param {string} baseUrl - canonical site URL for the Sitemap directive
 * @returns {string} robots.txt file content
 */
function buildRobotsTxt(rules, baseUrl) {
  const lines = [];
  for (const rule of rules) {
    lines.push(`User-agent: ${rule.userAgent}`);
    if (rule.allow) lines.push(`Allow: ${rule.allow}`);
    if (rule.disallow) lines.push(`Disallow: ${rule.disallow}`);
    lines.push('');
  }
  if (baseUrl) lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  return lines.join('\n');
}

/**
 * Build sitemap.xml content from config routes.
 *
 * @param {Array<{path: string, priority?: number, changefreq?: string}>} routes - sitemap routes
 * @param {string} baseUrl - canonical site URL
 * @returns {string} sitemap.xml file content
 */
function buildSitemapXml(routes, baseUrl) {
  const urls = routes
    .map(
      (route) =>
        `  <url>\n    <loc>${baseUrl}${route.path}</loc>\n    <priority>${route.priority ?? 0.5}</priority>\n    <changefreq>${route.changefreq ?? 'monthly'}</changefreq>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * Build manifest.json content from config.
 *
 * @param {object} app - app config section (config.app)
 * @param {object} manifestConfig - seo.manifest config section
 * @param {object} vuetifyTheme - vuetify theme config (config.vuetify.theme)
 * @returns {string} manifest.json file content
 */
function buildManifestJson(app, manifestConfig, vuetifyTheme) {
  const lightColors = vuetifyTheme?.themes?.light?.colors || {};
  const manifest = {
    name: app.title || '',
    short_name: app.title || '',
    description: app.description || '',
    start_url: '/',
    display: manifestConfig.display || 'standalone',
    theme_color: lightColors.primary || '#000000',
    background_color: lightColors.background || '#ffffff',
    icons: [],
  };
  return JSON.stringify(manifest, null, 2);
}

export function seoStaticPlugin(config) {
  const app = config?.app || {};
  const seo = app.seo || {};
  const vuetifyTheme = config?.vuetify?.theme || {};

  return {
    name: 'seo-static',
    generateBundle() {
      if (seo.robots?.enabled) {
        const rules = seo.robots.rules || [{ userAgent: '*', allow: '/' }];
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: buildRobotsTxt(rules, app.url || ''),
        });
      }

      if (seo.sitemap?.enabled) {
        const routes = seo.sitemap.routes || [{ path: '/', priority: 1.0, changefreq: 'weekly' }];
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: buildSitemapXml(routes, app.url || ''),
        });
      }

      if (seo.manifest?.enabled) {
        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: buildManifestJson(app, seo.manifest, vuetifyTheme),
        });
      }
    },
  };
}

export { buildRobotsTxt, buildSitemapXml, buildManifestJson };
