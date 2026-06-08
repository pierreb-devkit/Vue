import { describe, it, expect, vi } from 'vitest';
import { seoStaticPlugin, buildRobotsTxt, buildSitemapXml, buildManifestJson, buildLlmsTxt } from '../seo-static.js';
import testConfig from '../../../config/defaults/test.config.js';

describe('seoStaticPlugin', () => {
  it('returns a vite plugin with correct name', () => {
    const plugin = seoStaticPlugin({});
    expect(plugin.name).toBe('seo-static');
    expect(typeof plugin.generateBundle).toBe('function');
  });

  it('applies only to production builds', () => {
    const plugin = seoStaticPlugin({});
    expect(typeof plugin.apply).toBe('function');
    expect(plugin.apply({}, { command: 'build', mode: 'production' })).toBe(true);
    expect(plugin.apply({}, { command: 'build', mode: 'development' })).toBe(false);
    expect(plugin.apply({}, { command: 'serve', mode: 'production' })).toBe(false);
  });

  it('emits all four files when all are enabled', () => {
    const plugin = seoStaticPlugin(testConfig);
    const emitFile = vi.fn();
    plugin.generateBundle.call({ emitFile });

    expect(emitFile).toHaveBeenCalledTimes(4);
    const fileNames = emitFile.mock.calls.map((c) => c[0].fileName);
    expect(fileNames).toContain('robots.txt');
    expect(fileNames).toContain('sitemap.xml');
    expect(fileNames).toContain('manifest.json');
    expect(fileNames).toContain('llms.txt');
  });

  it('emits nothing when config is empty', () => {
    const plugin = seoStaticPlugin({});
    const emitFile = vi.fn();
    plugin.generateBundle.call({ emitFile });
    expect(emitFile).not.toHaveBeenCalled();
  });

  it('does not throw when config is null', () => {
    const plugin = seoStaticPlugin(null);
    const emitFile = vi.fn();
    expect(() => plugin.generateBundle.call({ emitFile })).not.toThrow();
  });

  it('does not throw when config is undefined', () => {
    const plugin = seoStaticPlugin(undefined);
    const emitFile = vi.fn();
    expect(() => plugin.generateBundle.call({ emitFile })).not.toThrow();
  });
});

describe('buildRobotsTxt', () => {
  it('returns null when disabled', () => {
    expect(buildRobotsTxt({ enabled: false }, '')).toBeNull();
  });

  it('returns null when config is undefined', () => {
    expect(buildRobotsTxt(undefined, '')).toBeNull();
  });

  it('generates correct User-agent and Allow directives', () => {
    const result = buildRobotsTxt(testConfig.app.seo.robots, 'https://example.com');
    expect(result).toContain('User-agent: *');
    expect(result).toContain('Allow: /');
  });

  it('includes Sitemap reference when baseUrl is provided', () => {
    const result = buildRobotsTxt(testConfig.app.seo.robots, 'https://example.com');
    expect(result).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('omits Sitemap line when baseUrl is empty', () => {
    const result = buildRobotsTxt({ enabled: true, rules: [{ userAgent: '*', allow: '/' }] }, '');
    expect(result).not.toContain('Sitemap:');
  });

  it('supports Disallow directive', () => {
    const robotsConfig = {
      enabled: true,
      rules: [{ userAgent: 'Googlebot', disallow: '/private' }],
    };
    const result = buildRobotsTxt(robotsConfig, '');
    expect(result).toContain('User-agent: Googlebot');
    expect(result).toContain('Disallow: /private');
  });

  it('supports multiple rules', () => {
    const robotsConfig = {
      enabled: true,
      rules: [
        { userAgent: '*', allow: '/' },
        { userAgent: 'Googlebot', disallow: '/admin' },
      ],
    };
    const result = buildRobotsTxt(robotsConfig, '');
    expect(result).toContain('User-agent: *');
    expect(result).toContain('User-agent: Googlebot');
  });

  it('defaults userAgent to * when not specified', () => {
    const result = buildRobotsTxt({ enabled: true, rules: [{ allow: '/' }] }, '');
    expect(result).toContain('User-agent: *');
  });
});

describe('buildSitemapXml', () => {
  it('returns null when disabled', () => {
    expect(buildSitemapXml({ enabled: false }, '')).toBeNull();
  });

  it('returns null when config is undefined', () => {
    expect(buildSitemapXml(undefined, '')).toBeNull();
  });

  it('returns null when enabled but baseUrl is empty', () => {
    const sitemapConfig = { enabled: true, routes: [{ path: '/' }] };
    expect(buildSitemapXml(sitemapConfig, '')).toBeNull();
  });

  it('returns null when enabled but baseUrl is undefined', () => {
    const sitemapConfig = { enabled: true, routes: [{ path: '/' }] };
    expect(buildSitemapXml(sitemapConfig, undefined)).toBeNull();
  });

  it('generates valid XML structure', () => {
    const result = buildSitemapXml(testConfig.app.seo.sitemap, 'https://example.com');
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(result).toContain('</urlset>');
  });

  it('includes all configured routes', () => {
    const result = buildSitemapXml(testConfig.app.seo.sitemap, 'https://example.com');
    expect(result).toContain('<loc>https://example.com/</loc>');
    expect(result).toContain('<loc>https://example.com/about</loc>');
  });

  it('includes priority when specified', () => {
    const result = buildSitemapXml(testConfig.app.seo.sitemap, 'https://example.com');
    expect(result).toContain('<priority>1</priority>');
    expect(result).toContain('<priority>0.8</priority>');
  });

  it('includes changefreq when specified', () => {
    const result = buildSitemapXml(testConfig.app.seo.sitemap, 'https://example.com');
    expect(result).toContain('<changefreq>weekly</changefreq>');
    expect(result).toContain('<changefreq>monthly</changefreq>');
  });

  it('includes lastmod with today date', () => {
    vi.useFakeTimers();
    try {
      const fixedDate = new Date('2023-01-01T12:00:00Z');
      vi.setSystemTime(fixedDate);
      const today = fixedDate.toISOString().split('T')[0];
      const result = buildSitemapXml(testConfig.app.seo.sitemap, 'https://example.com');
      expect(result).toContain(`<lastmod>${today}</lastmod>`);
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles routes without optional fields', () => {
    const sitemapConfig = { enabled: true, routes: [{ path: '/simple' }] };
    const result = buildSitemapXml(sitemapConfig, 'https://example.com');
    expect(result).toContain('<loc>https://example.com/simple</loc>');
    expect(result).not.toContain('<changefreq>');
    expect(result).not.toContain('<priority>');
  });

  it('handles empty routes array', () => {
    const result = buildSitemapXml({ enabled: true, routes: [] }, 'https://example.com');
    expect(result).toContain('<urlset');
    expect(result).toContain('</urlset>');
  });

  it('XML-escapes special characters in URLs', () => {
    const sitemapConfig = { enabled: true, routes: [{ path: '/search?q=a&b=c' }] };
    const result = buildSitemapXml(sitemapConfig, 'https://example.com');
    expect(result).toContain('&amp;');
    expect(result).not.toMatch(/<loc>[^<]*&[^a][^<]*<\/loc>/);
  });
});

describe('buildManifestJson', () => {
  it('returns null when disabled', () => {
    expect(buildManifestJson({ enabled: false }, {})).toBeNull();
  });

  it('returns null when config is undefined', () => {
    expect(buildManifestJson(undefined, {})).toBeNull();
  });

  it('generates valid JSON with app properties', () => {
    const result = buildManifestJson(testConfig.app.seo.manifest, testConfig.app);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('Test App');
    expect(parsed.short_name).toBe('Test App');
    expect(parsed.description).toBe('Test description');
    expect(parsed.display).toBe('standalone');
    expect(parsed.start_url).toBe('/');
  });

  it('uses app.lang for lang field', () => {
    const result = buildManifestJson(testConfig.app.seo.manifest, testConfig.app);
    const parsed = JSON.parse(result);
    expect(parsed.lang).toBe('fr');
  });

  it('provides defaults when app fields are missing', () => {
    const result = buildManifestJson({ enabled: true }, {});
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe('App');
    expect(parsed.short_name).toBe('App');
    expect(parsed.description).toBe('');
    expect(parsed.display).toBe('standalone');
    expect(parsed.lang).toBe('en');
    expect(parsed.background_color).toBe('#ffffff');
    expect(parsed.theme_color).toBe('#ffffff');
  });

  it('includes icons when provided', () => {
    const manifestConfig = {
      enabled: true,
      icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    };
    const result = buildManifestJson(manifestConfig, {});
    const parsed = JSON.parse(result);
    expect(parsed.icons).toHaveLength(1);
    expect(parsed.icons[0].src).toBe('/icon-192.png');
  });

  it('omits icons when not provided', () => {
    const result = buildManifestJson({ enabled: true }, {});
    const parsed = JSON.parse(result);
    expect(parsed.icons).toBeUndefined();
  });

  it('supports custom backgroundColor and themeColor', () => {
    const manifestConfig = {
      enabled: true,
      backgroundColor: '#000000',
      themeColor: '#ff0000',
    };
    const result = buildManifestJson(manifestConfig, {});
    const parsed = JSON.parse(result);
    expect(parsed.background_color).toBe('#000000');
    expect(parsed.theme_color).toBe('#ff0000');
  });
});

describe('buildLlmsTxt', () => {
  it('returns null when disabled', () => {
    expect(buildLlmsTxt({ enabled: false }, {})).toBeNull();
  });

  it('returns null when config is undefined', () => {
    expect(buildLlmsTxt(undefined, {})).toBeNull();
  });

  it('renders the title from config, falling back to app.title', () => {
    expect(buildLlmsTxt({ enabled: true, title: 'Brand' }, { title: 'AppName' })).toMatch(/^# Brand\n/);
    expect(buildLlmsTxt({ enabled: true }, { title: 'AppName' })).toMatch(/^# AppName\n/);
    expect(buildLlmsTxt({ enabled: true }, {})).toMatch(/^# App\n/);
  });

  it('renders summary as a blockquote and intro as a paragraph', () => {
    const out = buildLlmsTxt({ enabled: true, title: 'X', summary: 'one-liner', intro: 'a paragraph' }, {});
    expect(out).toContain('> one-liner');
    expect(out).toContain('a paragraph');
  });

  it('renders a section item with a url as a markdown link, with a note suffix', () => {
    const out = buildLlmsTxt(
      { enabled: true, title: 'X', sections: [{ title: 'S', items: [{ label: 'Docs', url: 'https://e.com', note: 'the docs' }] }] },
      {},
    );
    expect(out).toContain('## S');
    expect(out).toContain('- [Docs](https://e.com): the docs');
  });

  it('renders a section item without a url as a plain bullet', () => {
    const out = buildLlmsTxt(
      { enabled: true, title: 'X', sections: [{ title: 'Tools', items: [{ label: 'whoami', note: 'verify auth' }] }] },
      {},
    );
    expect(out).toContain('- whoami: verify auth');
    expect(out).not.toContain('](');
  });

  it('appends the body passthrough at the end', () => {
    const out = buildLlmsTxt({ enabled: true, title: 'X', body: '## Connect\nstuff' }, {});
    expect(out).toContain('## Connect\nstuff');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('does not throw and falls back to "App" when app is undefined', () => {
    expect(buildLlmsTxt({ enabled: true }, undefined)).toMatch(/^# App\n/);
  });

  it('skips sections without a title and items without a label', () => {
    const out = buildLlmsTxt(
      {
        enabled: true,
        title: 'X',
        sections: [
          { items: [{ label: 'orphan', note: 'no section title' }] },
          { title: 'Real', items: [{ note: 'no label' }, { label: 'kept' }] },
        ],
      },
      {},
    );
    expect(out).not.toContain('orphan');
    expect(out).not.toContain('undefined');
    expect(out).toContain('## Real');
    expect(out).toContain('- kept');
  });

  it('renders the test.config fixture correctly', () => {
    const out = buildLlmsTxt(testConfig.app.seo.llms, testConfig.app);
    expect(out).toMatch(/^# Test App\n/);
    expect(out).toContain('> Test summary');
    expect(out).toContain('## Links');
    expect(out).toContain('- [Home](https://example.com): the home page');
  });
});
