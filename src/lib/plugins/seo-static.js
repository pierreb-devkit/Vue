/**
 * Vite plugin — generates static SEO assets (robots.txt, sitemap.xml, manifest.json)
 * into the build output directory. Files are only emitted during production builds
 * via the generateBundle hook, so they never pollute public/.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {import('vite').Plugin}
 */
export function seoStaticPlugin(config) {
  const app = config?.app || {};
  const seo = app.seo || {};
  const baseUrl = (app.url || '').replace(/\/+$/, '');

  return {
    name: 'seo-static',
    apply: 'build',

    generateBundle() {
      const robotsTxt = buildRobotsTxt(seo.robots, baseUrl);
      if (robotsTxt) {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt });
      }

      const sitemapXml = buildSitemapXml(seo.sitemap, baseUrl);
      if (sitemapXml) {
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml });
      }

      const manifestJson = buildManifestJson(seo.manifest, app);
      if (manifestJson) {
        this.emitFile({ type: 'asset', fileName: 'manifest.json', source: manifestJson });
      }
    },
  };
}

/**
 * Build robots.txt content from config.
 *
 * @param {object|undefined} robotsConfig - robots configuration object
 * @param {string} baseUrl - canonical base URL for sitemap reference
 * @returns {string|null} robots.txt content or null if disabled
 */
export function buildRobotsTxt(robotsConfig, baseUrl) {
  if (!robotsConfig?.enabled) return null;

  const rules = robotsConfig.rules || [];
  const lines = [];

  for (const rule of rules) {
    lines.push(`User-agent: ${rule.userAgent || '*'}`);
    if (rule.allow) lines.push(`Allow: ${rule.allow}`);
    if (rule.disallow) lines.push(`Disallow: ${rule.disallow}`);
    lines.push('');
  }

  if (baseUrl) {
    lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);
  }

  return lines.join('\n');
}

/**
 * Build sitemap.xml content from config.
 *
 * @param {object|undefined} sitemapConfig - sitemap configuration object
 * @param {string} baseUrl - canonical base URL for route URLs
 * @returns {string|null} sitemap.xml content or null if disabled
 */
export function buildSitemapXml(sitemapConfig, baseUrl) {
  if (!sitemapConfig?.enabled) return null;

  const routes = sitemapConfig.routes || [];
  const today = new Date().toISOString().split('T')[0];

  const urls = routes
    .map((route) => {
      const loc = `${baseUrl}${route.path || '/'}`;
      const parts = [`    <loc>${loc}</loc>`];
      if (route.changefreq) parts.push(`    <changefreq>${route.changefreq}</changefreq>`);
      if (route.priority != null) parts.push(`    <priority>${route.priority}</priority>`);
      parts.push(`    <lastmod>${today}</lastmod>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ].join('\n');
}

/**
 * Build manifest.json content from config.
 *
 * @param {object|undefined} manifestConfig - manifest configuration object
 * @param {object} app - app-level config (title, description, lang, etc.)
 * @returns {string|null} manifest.json content or null if disabled
 */
export function buildManifestJson(manifestConfig, app) {
  if (!manifestConfig?.enabled) return null;

  const manifest = {
    name: app.title || 'App',
    short_name: app.title || 'App',
    description: app.description || '',
    start_url: '/',
    display: manifestConfig.display || 'standalone',
    background_color: manifestConfig.backgroundColor || '#ffffff',
    theme_color: manifestConfig.themeColor || '#ffffff',
    lang: app.lang || 'en',
  };

  if (manifestConfig.icons) {
    manifest.icons = manifestConfig.icons;
  }

  return JSON.stringify(manifest, null, 2);
}
