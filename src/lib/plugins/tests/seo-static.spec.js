import { describe, it, expect, vi } from 'vitest';
import { seoStaticPlugin, buildRobotsTxt, buildSitemapXml, buildManifestJson } from '../seo-static.js';

describe('seoStaticPlugin', () => {
  it('returns a vite plugin with correct name', () => {
    const plugin = seoStaticPlugin({});
    expect(plugin.name).toBe('seo-static');
    expect(typeof plugin.generateBundle).toBe('function');
  });

  describe('robots.txt generation', () => {
    it('generates robots.txt with default rules', () => {
      const content = buildRobotsTxt([{ userAgent: '*', allow: '/' }], 'https://example.com');
      expect(content).toContain('User-agent: *');
      expect(content).toContain('Allow: /');
      expect(content).toContain('Sitemap: https://example.com/sitemap.xml');
    });

    it('generates robots.txt with custom rules', () => {
      const rules = [
        { userAgent: 'Googlebot', allow: '/' },
        { userAgent: 'Bingbot', disallow: '/admin' },
      ];
      const content = buildRobotsTxt(rules, 'https://example.com');
      expect(content).toContain('User-agent: Googlebot');
      expect(content).toContain('Allow: /');
      expect(content).toContain('User-agent: Bingbot');
      expect(content).toContain('Disallow: /admin');
    });

    it('emits robots.txt when enabled', () => {
      const config = { app: { url: 'https://example.com', seo: { robots: { enabled: true, rules: [{ userAgent: '*', allow: '/' }] } } } };
      const plugin = seoStaticPlugin(config);
      const emitFile = vi.fn();
      plugin.generateBundle.call({ emitFile });
      expect(emitFile).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'asset', fileName: 'robots.txt' }),
      );
    });
  });

  describe('sitemap.xml generation', () => {
    it('generates sitemap.xml from routes', () => {
      const routes = [{ path: '/', priority: 1.0, changefreq: 'weekly' }];
      const content = buildSitemapXml(routes, 'https://example.com');
      expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(content).toContain('<loc>https://example.com/</loc>');
      expect(content).toContain('<priority>1</priority>');
      expect(content).toContain('<changefreq>weekly</changefreq>');
    });

    it('generates sitemap.xml with multiple routes', () => {
      const routes = [
        { path: '/', priority: 1.0, changefreq: 'weekly' },
        { path: '/about', priority: 0.8, changefreq: 'monthly' },
      ];
      const content = buildSitemapXml(routes, 'https://example.com');
      expect(content).toContain('<loc>https://example.com/</loc>');
      expect(content).toContain('<loc>https://example.com/about</loc>');
    });

    it('uses default priority and changefreq when not specified', () => {
      const routes = [{ path: '/page' }];
      const content = buildSitemapXml(routes, 'https://example.com');
      expect(content).toContain('<priority>0.5</priority>');
      expect(content).toContain('<changefreq>monthly</changefreq>');
    });

    it('emits sitemap.xml when enabled', () => {
      const config = { app: { url: 'https://example.com', seo: { sitemap: { enabled: true, routes: [{ path: '/' }] } } } };
      const plugin = seoStaticPlugin(config);
      const emitFile = vi.fn();
      plugin.generateBundle.call({ emitFile });
      expect(emitFile).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'asset', fileName: 'sitemap.xml' }),
      );
    });
  });

  describe('manifest.json generation', () => {
    it('generates manifest.json with app config and vuetify colors', () => {
      const app = { title: 'Test App', description: 'A test app' };
      const manifestConfig = { display: 'standalone' };
      const vuetifyTheme = { themes: { light: { colors: { primary: '#2563eb', background: '#f3f3f6' } } } };
      const content = buildManifestJson(app, manifestConfig, vuetifyTheme);
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('Test App');
      expect(parsed.short_name).toBe('Test App');
      expect(parsed.description).toBe('A test app');
      expect(parsed.display).toBe('standalone');
      expect(parsed.theme_color).toBe('#2563eb');
      expect(parsed.background_color).toBe('#f3f3f6');
      expect(parsed.start_url).toBe('/');
      expect(parsed.icons).toEqual([]);
    });

    it('uses fallback colors when vuetify theme is missing', () => {
      const content = buildManifestJson({}, { display: 'standalone' }, {});
      const parsed = JSON.parse(content);
      expect(parsed.theme_color).toBe('#000000');
      expect(parsed.background_color).toBe('#ffffff');
    });

    it('emits manifest.json when enabled', () => {
      const config = {
        app: { title: 'Test', seo: { manifest: { enabled: true, display: 'standalone' } } },
        vuetify: { theme: { themes: { light: { colors: { primary: '#000', background: '#fff' } } } } },
      };
      const plugin = seoStaticPlugin(config);
      const emitFile = vi.fn();
      plugin.generateBundle.call({ emitFile });
      expect(emitFile).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'asset', fileName: 'manifest.json' }),
      );
    });
  });

  describe('disabled features do not generate files', () => {
    it('does not emit any files when all features are disabled', () => {
      const config = {
        app: {
          seo: {
            robots: { enabled: false },
            sitemap: { enabled: false },
            manifest: { enabled: false },
          },
        },
      };
      const plugin = seoStaticPlugin(config);
      const emitFile = vi.fn();
      plugin.generateBundle.call({ emitFile });
      expect(emitFile).not.toHaveBeenCalled();
    });

    it('does not emit any files when seo config is missing', () => {
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
});
