import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import {
  isLocalLink,
  isAllowedLink,
  isPlaceholderName,
  checkContentItem,
  checkConfigFiles,
  checkComponentDocComment,
} from '../check-brand-defaults.js';

describe('check-brand-defaults', () => {
  describe('isLocalLink', () => {
    it('accepts a fragment and absolute/relative paths', () => {
      expect(isLocalLink('#fragment')).toBe(true);
      expect(isLocalLink('/relative')).toBe(true);
      expect(isLocalLink('/relative/path')).toBe(true);
      expect(isLocalLink('./relative')).toBe(true);
      expect(isLocalLink('logo.svg')).toBe(true);
      expect(isLocalLink('')).toBe(true);
    });

    it('rejects a real off-site host', () => {
      expect(isLocalLink('https://realbrand.com')).toBe(false);
    });

    it('rejects protocol-relative and backslash forms that resolve off-site', () => {
      // `//host` and `\\host` are both real-host forms a browser's URL
      // parser resolves off-site, not local — see the block comment on
      // isLocalLink in check-brand-defaults.js.
      expect(isLocalLink('//realbrand.com')).toBe(false);
      expect(isLocalLink('\\\\realbrand.com')).toBe(false);
    });

    it('rejects an embedded-tab quirk that normalizes to a real host', () => {
      // A stray tab is stripped by the URL parser before resolving, turning
      // this into `//realbrand.com` — a real off-site host, not local.
      expect(isLocalLink('/\t/realbrand.com')).toBe(false);
    });

    it('fails closed on a value the URL parser cannot resolve at all', () => {
      // Genuinely unparseable (not just coerced to a relative path) — hits
      // the catch branch in isLocalLink.
      expect(isLocalLink('http://[invalid')).toBe(false);
    });
  });

  describe('isAllowedLink', () => {
    it('accepts RFC 2606 reserved domains, including subdomains', () => {
      expect(isAllowedLink('https://example.com')).toBe(true);
      expect(isAllowedLink('https://example.net')).toBe(true);
      expect(isAllowedLink('https://example.org')).toBe(true);
      expect(isAllowedLink('https://partner.example.com')).toBe(true);
      expect(isAllowedLink('foo.example')).toBe(true);
      expect(isAllowedLink('foo.test')).toBe(true);
      expect(isAllowedLink('foo.invalid')).toBe(true);
      expect(isAllowedLink('foo.localhost')).toBe(true);
    });

    it('accepts local links', () => {
      expect(isAllowedLink('/images/partner01.svg')).toBe(true);
      expect(isAllowedLink('#fragment')).toBe(true);
    });

    it('rejects a real third-party domain', () => {
      expect(isAllowedLink('https://nike.com')).toBe(false);
      expect(isAllowedLink('https://nike.com/logo.png')).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isAllowedLink(undefined)).toBe(false);
      expect(isAllowedLink(42)).toBe(false);
    });
  });

  describe('isPlaceholderName', () => {
    it('accepts names starting with "Example"', () => {
      expect(isPlaceholderName('Example Co')).toBe(true);
      expect(isPlaceholderName('Example Corp')).toBe(true);
    });

    it('rejects a real brand name', () => {
      expect(isPlaceholderName('Nike')).toBe(false);
    });

    it('accepts the accepted prefix-match limit ("Example Nike")', () => {
      // Documented, accepted design limit: this is a prefix allowlist, not
      // a full-name match. Locked in here so a future tightening of the
      // regex is a deliberate change, not an accidental one.
      expect(isPlaceholderName('Example Nike')).toBe(true);
    });

    it('rejects non-string values', () => {
      expect(isPlaceholderName(undefined)).toBe(false);
      expect(isPlaceholderName(null)).toBe(false);
    });
  });

  describe('checkContentItem', () => {
    it('returns no errors for a clean entry', () => {
      const item = { link: 'https://example.com', img: '/images/partner01.svg', name: 'Example Co' };
      expect(checkContentItem('source.js', item, 0)).toEqual([]);
    });

    it('returns no errors when the entry is missing/falsy', () => {
      expect(checkContentItem('source.js', null, 0)).toEqual([]);
      expect(checkContentItem('source.js', undefined, 0)).toEqual([]);
    });

    it('flags a real brand link, img, and name together', () => {
      const item = { link: 'https://nike.com', img: 'https://nike.com/logo.png', name: 'Nike' };
      const errors = checkContentItem('source.js', item, 2);
      expect(errors).toHaveLength(3);
      expect(errors[0]).toContain('social.content[2].link is "https://nike.com"');
      expect(errors[1]).toContain('social.content[2].img is "https://nike.com/logo.png"');
      expect(errors[2]).toContain('social.content[2].name is "Nike"');
    });

    it('only flags the fields that are present', () => {
      const errors = checkContentItem('source.js', { name: 'Nike' }, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('.name is "Nike"');
    });
  });

  describe('checkConfigFiles (global override files + module config)', () => {
    it('returns no errors for the stack\'s own shipped config files', async () => {
      // Integration-style: runs against the real, currently-shipped
      // home.*.config.js and *.config.js (generateConfig override layer)
      // files rather than a mock — this is what actually ships, so a
      // regression here is exactly what the guard exists to catch.
      const errors = await checkConfigFiles();
      expect(errors).toEqual([]);
    });
  });

  describe('checkComponentDocComment (component documentation parsing)', () => {
    it('returns no errors for the real home.social component doc comment', () => {
      const errors = checkComponentDocComment();
      expect(errors).toEqual([]);
    });

    it('reports an error when the documented file is missing', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const errors = checkComponentDocComment();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('expected file not found');
    });

    it('reports an error when the leading doc comment is missing', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('<template><div /></template>');
      const errors = checkComponentDocComment();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('found none');
    });

    it('flags a real brand literal inside the doc comment', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(`<!--
        {
          link: 'https://nike.com',
          img: 'https://nike.com/logo.png',
          name: 'Nike',
        }
      -->
      <template><div /></template>`);
      const errors = checkComponentDocComment();
      expect(errors).toHaveLength(3);
      expect(errors.join('\n')).toContain('link "https://nike.com"');
      expect(errors.join('\n')).toContain('img "https://nike.com/logo.png"');
      expect(errors.join('\n')).toContain('name "Nike"');
    });

    it('returns no errors for a clean doc comment', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(`<!--
        {
          link: 'https://example.com',
          img: '/images/partner01.svg',
          name: 'Example Co',
        }
      -->
      <template><div /></template>`);
      expect(checkComponentDocComment()).toEqual([]);
    });
  });
});
