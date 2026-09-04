import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  isLocalLink,
  isAllowedLink,
  isPlaceholderName,
  checkContentItem,
  CONFIG_SOURCES,
  checkConfigFiles,
  checkComponentDocComment,
} from '../check-brand-defaults.js';

describe('check-brand-defaults', () => {
  describe('isLocalLink', () => {
    it('accepts a fragment and absolute/relative paths', () => {
      expect(isLocalLink('#top')).toBe(true);
      expect(isLocalLink('/about')).toBe(true);
      expect(isLocalLink('/relative/path')).toBe(true);
      expect(isLocalLink('./relative')).toBe(true);
      expect(isLocalLink('logo.svg')).toBe(true);
      expect(isLocalLink('')).toBe(true);
    });

    it('rejects a real off-site host', () => {
      expect(isLocalLink('https://realbrand.com')).toBe(false);
    });

    it('rejects protocol-relative //host', () => {
      expect(isLocalLink('//realbrand.com')).toBe(false);
    });

    it('rejects the /\\host slash-backslash form (backslash normalizes to a second slash)', () => {
      // Verified against the real WHATWG URL parser: `/\realbrand.com` ->
      // host "realbrand.com" (the backslash is treated as `/` for http(s)
      // URLs, producing `//realbrand.com`) — a real off-site host, not local.
      expect(isLocalLink('/\\realbrand.com')).toBe(false);
    });

    it('rejects an embedded TAB, CR, or LF that normalizes to a real host', () => {
      // Each whitespace char is stripped by the URL parser before
      // resolving, turning `/<ws>/realbrand.com` into `//realbrand.com` —
      // a real off-site host, not local. See the isLocalLink block comment.
      expect(isLocalLink('/\t/realbrand.com')).toBe(false);
      expect(isLocalLink('/\r/realbrand.com')).toBe(false);
      expect(isLocalLink('/\n/realbrand.com')).toBe(false);
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

    it('accepts local links: /about and #top', () => {
      expect(isAllowedLink('/about')).toBe(true);
      expect(isAllowedLink('#top')).toBe(true);
    });

    it('accepts a local asset path for img', () => {
      expect(isAllowedLink('/images/partner01.svg')).toBe(true);
    });

    it('rejects an off-site img URL', () => {
      expect(isAllowedLink('https://realbrand.com/logo.png')).toBe(false);
    });

    it('rejects a real third-party domain', () => {
      expect(isAllowedLink('https://nike.com')).toBe(false);
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

    it('flags a real brand name even paired with an otherwise-valid placeholder link', () => {
      // This was a real hole: the link/img checks and the name check are
      // independent, so a valid link alone does not make an entry clean —
      // a real brand slipped into `name` must still fail on its own.
      const item = { link: 'https://example.com', img: '/images/partner01.svg', name: 'Nike' };
      const errors = checkContentItem('source.js', item, 0);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('social.content[0].name is "Nike"');
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

  describe('checkConfigFiles', () => {
    describe('wiring: CONFIG_SOURCES must scan the override layer that actually ships', () => {
      it('includes src/config/defaults (generateConfig deepMerge-replaces arrays, so this layer wins over the module config)', () => {
        // This was a real hole, closed during manual review: the module
        // config alone (src/modules/home/config) is not what ships — the
        // generateConfig override layer replaces the array wholesale.
        // Scanning only the module layer would silently miss a real brand
        // shipped via this layer.
        const overrideSource = CONFIG_SOURCES.find((s) => s.dir === 'src/config/defaults');
        expect(overrideSource).toBeDefined();
        expect(overrideSource.pattern.test('development.config.js')).toBe(true);
      });

      it('includes src/modules/home/config for the module-level defaults', () => {
        const moduleSource = CONFIG_SOURCES.find((s) => s.dir === 'src/modules/home/config');
        expect(moduleSource).toBeDefined();
        expect(moduleSource.pattern.test('home.development.config.js')).toBe(true);
      });
    });

    describe('mechanism: scanning a source directory (fixture-backed, no real files touched)', () => {
      let tmpDir;

      const fixturesRoot = path.join(process.cwd(), 'scripts/tests/.fixtures-tmp');

      afterEach(() => {
        if (tmpDir) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          tmpDir = undefined;
        }
        // Clean up the shared parent dir too, so no stray directory is left
        // behind once the last fixture in this file is removed.
        if (fs.existsSync(fixturesRoot) && fs.readdirSync(fixturesRoot).length === 0) {
          fs.rmdirSync(fixturesRoot);
        }
      });

      /**
       * @desc Write a fixture config file shaped like a real
       * home.*.config.js / *.config.js override file, in a fresh temp
       * directory, and return the {dir, pattern} source pointing at it.
       * @param {object} content - The `home.social.content[]` array to ship.
       * @returns {{dir: string, pattern: RegExp}} A CONFIG_SOURCES-shaped entry.
       */
      const writeFixtureSource = (content) => {
        // Written inside the project tree (not the OS tmpdir): Vite's SSR
        // module runner (which vitest uses for dynamic import()) refuses to
        // resolve a file:// URL outside its project root.
        fs.mkdirSync(fixturesRoot, { recursive: true });
        tmpDir = fs.mkdtempSync(path.join(fixturesRoot, 'src-'));
        const filePath = path.join(tmpDir, 'development.config.js');
        fs.writeFileSync(
          filePath,
          `export default { home: { social: { content: ${JSON.stringify(content)} } } };\n`,
        );
        return { dir: tmpDir, pattern: /^development\.config\.js$/ };
      };

      it('FAILS on a real brand entry in a src/config/defaults-shaped override file (the layer that wins at merge)', async () => {
        const source = writeFixtureSource([{ link: 'https://example.com', img: '/images/partner01.svg', name: 'Nike' }]);
        const errors = await checkConfigFiles([source]);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toContain('.name is "Nike"');
      });

      it('PASSES on a clean override file', async () => {
        const source = writeFixtureSource([{ link: 'https://example.com', img: '/images/partner01.svg', name: 'Example Co' }]);
        const errors = await checkConfigFiles([source]);
        expect(errors).toEqual([]);
      });
    });

    it("returns no errors for the stack's own currently-shipped config files", async () => {
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

    it('FAILS LOUDLY (never silently passes) when the documented file is missing', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const errors = checkComponentDocComment();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('expected file not found');
    });

    it('FAILS LOUDLY (never silently passes) when the leading doc comment is missing entirely', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue('<template><div /></template>');
      const errors = checkComponentDocComment();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('found none');
    });

    it('still catches a real brand literal despite a leading newline before the comment', () => {
      // "Tolerates leading whitespace" must not become "silently skips
      // checking content behind whitespace" — a real brand must still be
      // caught.
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue("\n<!--\n{ link: 'https://example.com', name: 'Nike' }\n-->\n<template><div /></template>");
      const errors = checkComponentDocComment();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join('\n')).toContain('name "Nike"');
    });

    it('still catches a real brand literal despite a leading BOM before the comment', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue("﻿<!--\n{ link: 'https://example.com', name: 'Nike' }\n-->\n<template><div /></template>");
      const errors = checkComponentDocComment();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join('\n')).toContain('name "Nike"');
    });

    it('flags a real brand link, img, and name together', () => {
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
