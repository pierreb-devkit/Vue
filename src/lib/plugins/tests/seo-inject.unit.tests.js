import { describe, it, expect } from 'vitest';
import { seoInjectPlugin } from '../seo-inject.js';
import testConfig from '../../../config/defaults/test.config.js';

const baseHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>DevKit</title>
  </head>
  <body><div id="app"></div></body>
</html>`;

const transform = (config) => seoInjectPlugin(config).transformIndexHtml(baseHtml);

describe('seoInjectPlugin', () => {
  it('returns a vite plugin with correct name', () => {
    const plugin = seoInjectPlugin({});
    expect(plugin.name).toBe('seo-inject');
    expect(typeof plugin.transformIndexHtml).toBe('function');
  });

  describe('title', () => {
    it('replaces the placeholder title with app.title', () => {
      const result = transform(testConfig);
      expect(result).toContain('<title>Test App</title>');
      expect(result).not.toContain('<title>DevKit</title>');
    });

    it('falls back to "App" when app.title is not set', () => {
      const result = transform({});
      expect(result).toContain('<title>App</title>');
    });
  });

  describe('lang attribute', () => {
    it('sets the html lang attribute from app.lang', () => {
      const result = transform(testConfig);
      expect(result).toContain('<html lang="fr">');
    });

    it('defaults to "en" when app.lang is not set', () => {
      const result = transform({ app: {} });
      expect(result).toContain('<html lang="en">');
    });
  });

  describe('basic meta tags', () => {
    it('injects description meta tag', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="description" content="Test description">');
    });

    it('injects keywords meta tag', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="keywords" content="test, keywords">');
    });

    it('injects author meta tag', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="author" content="test@example.com">');
    });

    it('does not inject description when not set', () => {
      const result = transform({ app: { title: 'Test' } });
      expect(result).not.toContain('name="description"');
    });
  });

  describe('canonical link', () => {
    it('injects canonical link when app.url is set', () => {
      const result = transform(testConfig);
      expect(result).toContain('<link rel="canonical" href="https://example.com">');
    });

    it('does not inject canonical when app.url is not set', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('rel="canonical"');
    });
  });

  describe('Open Graph tags', () => {
    it('injects og:title', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta property="og:title" content="Test App">');
    });

    it('injects og:description', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta property="og:description" content="Test description">');
    });

    it('injects og:type defaulting to "website"', () => {
      const result = transform({ app: {} });
      expect(result).toContain('<meta property="og:type" content="website">');
    });

    it('injects og:type from config', () => {
      const result = transform({ app: { seo: { og: { type: 'profile' } } } });
      expect(result).toContain('<meta property="og:type" content="profile">');
    });

    it('injects og:url when app.url is set', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta property="og:url" content="https://example.com">');
    });

    it('injects og:image when set', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta property="og:image" content="https://example.com/og.jpg">');
    });

    it('does not inject og:image when not set', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('og:image');
    });
  });

  describe('Twitter Card tags', () => {
    it('injects twitter:card defaulting to "summary"', () => {
      const result = transform({ app: {} });
      expect(result).toContain('<meta name="twitter:card" content="summary">');
    });

    it('injects twitter:card from config', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="twitter:card" content="summary_large_image">');
    });

    it('injects twitter:title', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="twitter:title" content="Test App">');
    });

    it('injects twitter:description', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="twitter:description" content="Test description">');
    });

    it('injects twitter:site when twitterSite is set', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="twitter:site" content="@testhandle">');
    });

    it('does not inject twitter:site when not set', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('twitter:site');
    });
  });

  describe('twitter:image', () => {
    it('injects twitter:image when og.image is set', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="twitter:image" content="https://example.com/og.jpg">');
    });

    it('does not inject twitter:image when og.image is not set', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('twitter:image');
    });
  });

  describe('HTML escaping', () => {
    it('escapes special characters in title', () => {
      const result = transform({ app: { title: '<script>alert("xss")</script>' } });
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('escapes special characters in description', () => {
      const result = transform({ app: { description: 'A & B > C' } });
      expect(result).toContain('A &amp; B &gt; C');
    });

    it('escapes double quotes in content attributes', () => {
      const result = transform({ app: { author: 'John "Dev" Doe' } });
      expect(result).toContain('John &quot;Dev&quot; Doe');
    });
  });

  describe('lang attribute — robust replacement', () => {
    it('updates existing lang attribute to config value', () => {
      const result = transform(testConfig);
      expect(result).toContain('<html lang="fr">');
      expect(result).not.toContain('lang="en"');
    });

    it('adds lang attribute when html tag has none', () => {
      const noLangHtml = baseHtml.replace('<html lang="en">', '<html>');
      const result = seoInjectPlugin(testConfig).transformIndexHtml(noLangHtml);
      expect(result).toContain('lang="fr"');
    });
  });

  describe('tags are injected before </head>', () => {
    it('injects tags before closing head tag', () => {
      const result = transform(testConfig);
      const headCloseIndex = result.indexOf('</head>');
      const descIndex = result.indexOf('name="description"');
      expect(descIndex).toBeLessThan(headCloseIndex);
    });
  });

  describe('noscript fallback', () => {
    it('injects noscript block before </body> with title and description', () => {
      const result = transform(testConfig);
      expect(result).toContain('<noscript><h1>Test App</h1><p>Test description</p></noscript>');
      const noscriptIndex = result.indexOf('<noscript>');
      const bodyCloseIndex = result.indexOf('</body>');
      expect(noscriptIndex).toBeLessThan(bodyCloseIndex);
    });

    it('does not inject noscript when title and description are both missing', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('<noscript>');
    });

    it('injects noscript with only title when description is missing', () => {
      const result = transform({ app: { title: 'Only Title' } });
      expect(result).toContain('<noscript><h1>Only Title</h1></noscript>');
      expect(result).not.toContain('<p></p>');
    });

    it('injects noscript with only description when title is missing', () => {
      const result = transform({ app: { description: 'Only Desc' } });
      expect(result).toContain('<noscript><p>Only Desc</p></noscript>');
      expect(result).not.toContain('<h1></h1>');
    });

    it('escapes HTML in noscript content', () => {
      const result = transform({ app: { title: '<script>xss</script>', description: 'A & B' } });
      expect(result).toContain('&lt;script&gt;xss&lt;/script&gt;');
      expect(result).toContain('A &amp; B');
    });
  });

  describe('preconnect hints', () => {
    it('injects preconnect and dns-prefetch links from config', () => {
      const result = transform(testConfig);
      expect(result).toContain('<link rel="preconnect" href="https://fonts.googleapis.com">');
      expect(result).toContain('<link rel="dns-prefetch" href="https://fonts.googleapis.com">');
      expect(result).toContain('<link rel="preconnect" href="https://cdn.example.com">');
      expect(result).toContain('<link rel="dns-prefetch" href="https://cdn.example.com">');
    });

    it('injects preconnect tags before </head>', () => {
      const result = transform(testConfig);
      const headCloseIndex = result.indexOf('</head>');
      const preconnectIndex = result.indexOf('rel="preconnect"');
      expect(preconnectIndex).toBeLessThan(headCloseIndex);
    });

    it('does not inject preconnect when array is empty', () => {
      const result = transform({ app: { seo: { preconnect: [] } } });
      expect(result).not.toContain('rel="preconnect"');
      expect(result).not.toContain('rel="dns-prefetch"');
    });

    it('does not inject preconnect when not configured', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('rel="preconnect"');
    });

    it('does not inject unsafe preconnect protocols', () => {
      const result = transform({ app: { seo: { preconnect: ['javascript:alert(1)'] } } });
      expect(result).not.toContain('javascript:alert(1)');
      expect(result).not.toContain('rel="preconnect"');
    });

    it('filters out unsafe URLs while keeping safe ones', () => {
      const result = transform({
        app: { seo: { preconnect: ['https://safe.example.com', 'data:text/html,bad', 'http://also-safe.com'] } },
      });
      expect(result).toContain('href="https://safe.example.com"');
      expect(result).toContain('href="http://also-safe.com"');
      expect(result).not.toContain('data:text/html');
    });
  });

  describe('theme-color meta tag', () => {
    it('injects theme-color from vuetify light theme primary', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="theme-color" content="#1abc9c">');
    });

    it('injects theme-color before </head>', () => {
      const result = transform(testConfig);
      const headCloseIndex = result.indexOf('</head>');
      const themeColorIndex = result.indexOf('name="theme-color"');
      expect(themeColorIndex).toBeLessThan(headCloseIndex);
    });

    it('does not inject theme-color when vuetify config is missing', () => {
      const result = transform({ app: { title: 'Test' } });
      expect(result).not.toContain('theme-color');
    });

    it('does not inject theme-color when primary color is not set', () => {
      const result = transform({ app: {}, vuetify: { theme: { themes: { light: { colors: {} } } } } });
      expect(result).not.toContain('theme-color');
    });
  });

  describe('JSON-LD structured data', () => {
    it('injects JSON-LD when schema.enabled is true', () => {
      const config = {
        app: {
          title: 'Test App',
          description: 'Test description',
          url: 'https://example.com',
          seo: {
            schema: { enabled: true, type: 'Person', name: 'Test User' },
          },
        },
      };
      const result = transform(config);
      expect(result).toContain('<script type="application/ld+json">');
      const match = result.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
      expect(match).not.toBeNull();
      const jsonLd = JSON.parse(match[1]);
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Person');
      expect(jsonLd.name).toBe('Test User');
      expect(jsonLd.url).toBe('https://example.com');
      expect(jsonLd.description).toBe('Test description');
    });

    it('does not inject JSON-LD when schema.enabled is false', () => {
      const result = transform(testConfig);
      expect(result).not.toContain('application/ld+json');
    });

    it('does not inject JSON-LD when schema.type is missing', () => {
      const config = {
        app: { title: 'Test', seo: { schema: { enabled: true } } },
      };
      const result = transform(config);
      expect(result).not.toContain('application/ld+json');
    });

    it('includes optional fields (jobTitle, sameAs, image) when present', () => {
      const config = {
        app: {
          title: 'Test App',
          description: 'Desc',
          url: 'https://example.com',
          seo: {
            og: { image: 'https://example.com/photo.jpg' },
            schema: {
              enabled: true,
              type: 'Person',
              name: 'Test User',
              jobTitle: 'Developer',
              sameAs: ['https://github.com/test', 'https://twitter.com/test'],
            },
          },
        },
      };
      const result = transform(config);
      const match = result.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
      const jsonLd = JSON.parse(match[1]);
      expect(jsonLd.jobTitle).toBe('Developer');
      expect(jsonLd.sameAs).toEqual(['https://github.com/test', 'https://twitter.com/test']);
      expect(jsonLd.image).toBe('https://example.com/photo.jpg');
    });

    it('omits optional fields when absent', () => {
      const config = {
        app: {
          title: 'Test App',
          description: 'Desc',
          url: 'https://example.com',
          seo: {
            schema: { enabled: true, type: 'Organization', name: 'Org' },
          },
        },
      };
      const result = transform(config);
      const match = result.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
      const jsonLd = JSON.parse(match[1]);
      expect(jsonLd.jobTitle).toBeUndefined();
      expect(jsonLd.sameAs).toBeUndefined();
      expect(jsonLd.image).toBeUndefined();
    });

    it('escapes "</script>" in schema values to prevent tag injection', () => {
      const config = {
        app: {
          title: 'App',
          description: '</script><script>alert("xss")</script>',
          url: 'https://example.com',
          seo: {
            schema: { enabled: true, type: 'Person', name: 'Test' },
          },
        },
      };
      const result = transform(config);
      // The raw "</script>" must not appear inside the JSON-LD block
      const scriptBlocks = result.match(/<script[^>]*>/g) || [];
      const ldBlocks = scriptBlocks.filter((s) => s.includes('application/ld+json'));
      expect(ldBlocks).toHaveLength(1);
      // Extract everything between the JSON-LD opening tag and the next </script>
      const ldMatch = result.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
      expect(ldMatch).not.toBeNull();
      // The escaped JSON should parse correctly and contain the original value
      const jsonLd = JSON.parse(ldMatch[1]);
      expect(jsonLd.description).toBe('</script><script>alert("xss")</script>');
    });
  });

  describe('handles missing config gracefully', () => {
    it('does not throw when config is null', () => {
      expect(() => transform(null)).not.toThrow();
    });

    it('does not throw when config is undefined', () => {
      expect(() => transform(undefined)).not.toThrow();
    });

    it('does not throw when app.seo is missing', () => {
      expect(() => transform({ app: { title: 'Test' } })).not.toThrow();
    });
  });

  describe('theme-color override (#4092)', () => {
    it('uses seo.themeColor when present, ignoring vuetify primary', () => {
      const config = {
        app: { title: 'X', seo: { themeColor: '#0a0a1a' } },
        vuetify: { theme: { themes: { light: { colors: { primary: '#e67e22' } } } } },
      };
      const plugin = seoInjectPlugin(config);
      const out = plugin.transformIndexHtml('<html><head></head><body></body></html>');
      expect(out).toContain('<meta name="theme-color" content="#0a0a1a">');
      expect(out).not.toContain('#e67e22');
    });

    it('falls back to vuetify primary when seo.themeColor is absent', () => {
      const config = {
        app: { title: 'X', seo: {} },
        vuetify: { theme: { themes: { light: { colors: { primary: '#e67e22' } } } } },
      };
      const plugin = seoInjectPlugin(config);
      const out = plugin.transformIndexHtml('<html><head></head><body></body></html>');
      expect(out).toContain('<meta name="theme-color" content="#e67e22">');
    });

    it('escapes the override (defence-in-depth)', () => {
      const config = { app: { title: 'X', seo: { themeColor: '"><script>x</script>' } } };
      const plugin = seoInjectPlugin(config);
      const out = plugin.transformIndexHtml('<html><head></head><body></body></html>');
      expect(out).toContain('&quot;&gt;&lt;script&gt;');
      expect(out).not.toContain('<script>x');
    });
  });
});
