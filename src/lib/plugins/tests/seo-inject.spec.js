import { describe, it, expect } from 'vitest';
import { seoInjectPlugin } from '../seo-inject.js';
import testConfig from '../../../config/defaults/config.test.js';

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
    it('injects noscript tag with title and description before </body>', () => {
      const result = transform(testConfig);
      expect(result).toContain('<noscript><h1>Test App</h1><p>Test description</p></noscript>');
    });

    it('injects noscript with only title when description is missing', () => {
      const result = transform({ app: { title: 'Only Title' } });
      expect(result).toContain('<noscript><h1>Only Title</h1></noscript>');
    });

    it('injects noscript with only description when title is missing', () => {
      const result = transform({ app: { description: 'Only desc' } });
      expect(result).toContain('<noscript><p>Only desc</p></noscript>');
    });

    it('does not inject noscript when both title and description are missing', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('<noscript>');
    });

    it('escapes HTML in noscript content', () => {
      const result = transform({ app: { title: '<img onerror="alert(1)">' } });
      expect(result).toContain('&lt;img onerror=&quot;alert(1)&quot;&gt;');
      expect(result).not.toContain('<img onerror');
    });

    it('injects noscript before closing body tag', () => {
      const result = transform(testConfig);
      const noscriptIndex = result.indexOf('<noscript>');
      const bodyCloseIndex = result.indexOf('</body>');
      expect(noscriptIndex).toBeGreaterThan(-1);
      expect(noscriptIndex).toBeLessThan(bodyCloseIndex);
    });
  });

  describe('preconnect hints', () => {
    it('injects preconnect and dns-prefetch links for each URL', () => {
      const result = transform(testConfig);
      expect(result).toContain('<link rel="preconnect" href="https://fonts.googleapis.com">');
      expect(result).toContain('<link rel="dns-prefetch" href="https://fonts.googleapis.com">');
      expect(result).toContain('<link rel="preconnect" href="https://api.example.com">');
      expect(result).toContain('<link rel="dns-prefetch" href="https://api.example.com">');
    });

    it('does not inject preconnect links when array is empty', () => {
      const result = transform({ app: { seo: { preconnect: [] } } });
      expect(result).not.toContain('rel="preconnect"');
      expect(result).not.toContain('rel="dns-prefetch"');
    });

    it('does not inject preconnect links when not configured', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('rel="preconnect"');
    });

    it('injects preconnect links in the head section', () => {
      const result = transform(testConfig);
      const headCloseIndex = result.indexOf('</head>');
      const preconnectIndex = result.indexOf('rel="preconnect"');
      expect(preconnectIndex).toBeGreaterThan(-1);
      expect(preconnectIndex).toBeLessThan(headCloseIndex);
    });

    it('escapes URLs in preconnect hints', () => {
      const result = transform({ app: { seo: { preconnect: ['https://example.com/path?a=1&b=2'] } } });
      expect(result).toContain('href="https://example.com/path?a=1&amp;b=2"');
    });
  });

  describe('theme-color meta tag', () => {
    it('injects theme-color from vuetify primary color', () => {
      const result = transform(testConfig);
      expect(result).toContain('<meta name="theme-color" content="#1867C0">');
    });

    it('does not inject theme-color when vuetify config is missing', () => {
      const result = transform({ app: {} });
      expect(result).not.toContain('theme-color');
    });

    it('does not inject theme-color when primary color is not set', () => {
      const result = transform({ app: {}, vuetify: { theme: { themes: { light: { colors: {} } } } } });
      expect(result).not.toContain('theme-color');
    });

    it('injects theme-color in the head section', () => {
      const result = transform(testConfig);
      const headCloseIndex = result.indexOf('</head>');
      const themeColorIndex = result.indexOf('theme-color');
      expect(themeColorIndex).toBeGreaterThan(-1);
      expect(themeColorIndex).toBeLessThan(headCloseIndex);
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
});
