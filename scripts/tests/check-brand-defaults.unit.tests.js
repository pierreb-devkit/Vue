import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  isLocalLink,
  isAllowedLink,
  isPlaceholderName,
  checkContentItem,
  checkSectionTitle,
  CONFIG_SOURCES,
  checkConfigFiles,
  checkComponentDocComment,
  main,
} from '../check-brand-defaults.js';

describe('check-brand-defaults', () => {
  describe('isLocalLink', () => {
    it('accepts a fragment, a rooted path, and a ./ or ../ relative path', () => {
      expect(isLocalLink('#top')).toBe(true);
      expect(isLocalLink('/about')).toBe(true);
      expect(isLocalLink('/relative/path')).toBe(true);
      expect(isLocalLink('./relative')).toBe(true);
      expect(isLocalLink('../relative')).toBe(true);
      expect(isLocalLink('')).toBe(true);
    });

    // Finding A: a scheme-less BARE relative path with no leading `/`, `./`,
    // or `../` (e.g. "logo.svg") has the exact same shape as a bare hostname
    // (e.g. "realbrand.com") to the WHATWG URL parser — both resolve to a
    // same-host path against the sentinel base. That ambiguity was the hole:
    // it made a re-added real domain, written without a scheme, look local.
    // Deliberate design change: this bare-relative form is no longer
    // accepted as local at all — every real local reference in this repo
    // already writes a leading `/` (e.g. "/images/partner01.svg").
    it('no longer accepts a bare relative path with no leading marker (ambiguous with a bare hostname)', () => {
      expect(isLocalLink('logo.svg')).toBe(false);
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

    // Finding A (Vue#4623 review): isLocalLink resolves a link against a
    // sentinel origin using the WHATWG URL parser. A scheme-less bare
    // hostname (no leading #, /, ./, or ../) is indistinguishable from a
    // relative path to that parser, so it resolves to a same-host path and
    // is misclassified as "local" — never reaching the RFC-2606 check at
    // all. This means the exact two real brands this PR removes, re-added
    // without a scheme, pass the guard clean.
    it('rejects a scheme-less bare domain (the re-add-without-a-scheme vector this guard exists to close)', () => {
      expect(isAllowedLink('realbrand.com')).toBe(false);
      expect(isAllowedLink('www.realbrand.com')).toBe(false);
      expect(isAllowedLink('nike.com')).toBe(false);
      expect(isAllowedLink('realbrand.com/campaign')).toBe(false);
      expect(isAllowedLink('realbrand.com/logo.png')).toBe(false);
    });

    it('still accepts a legitimate rooted asset path containing a dot (the trap: must not overcorrect)', () => {
      expect(isAllowedLink('/images/partner01.svg')).toBe(true);
    });
  });

  describe('RFC2606_LINK_RE (via isAllowedLink) — query and fragment suffixes', () => {
    // Finding G: `(\/.*)?$` requires a `/` immediately after the host, so a
    // genuine RFC-2606 link with a query string or bare fragment is
    // rejected — while the error message itself tells the contributor to
    // "use https://example.com", which is exactly what they did.
    it('accepts a reserved domain with a query string or fragment (currently falsely rejected)', () => {
      expect(isAllowedLink('https://example.com?q=1')).toBe(true);
      expect(isAllowedLink('https://example.com#frag')).toBe(true);
      expect(isAllowedLink('https://example.org#top')).toBe(true);
      expect(isAllowedLink('https://partner.example.com?ref=1')).toBe(true);
    });

    it('still rejects a real domain disguised with an RFC2606 lookalike prefix/suffix', () => {
      expect(isAllowedLink('https://example.com@nike.com')).toBe(false);
      expect(isAllowedLink('https://example.com.nike.com')).toBe(false);
      expect(isAllowedLink('https://nike.com/example.com')).toBe(false);
      expect(isAllowedLink('https://nike.com?x=https://example.com')).toBe(false);
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

    // Finding A (related note): the PLACEHOLDER_NAME_RE prefix allowlist
    // ("Example Nike" passes) must not defeat a fixed link/img check — a
    // combined entry with a bare-hostname link/img must still fail even
    // when its name uses the allowed placeholder prefix.
    it('fails a combined entry with a bare-hostname link/img even when name uses the allowed placeholder prefix', () => {
      const item = { link: 'realbrand.com', img: 'realbrand.com/logo.png', name: 'Example Nike' };
      const errors = checkContentItem('source.js', item, 0);
      expect(errors).toHaveLength(2);
      expect(errors.join('\n')).toContain('.link is "realbrand.com"');
      expect(errors.join('\n')).toContain('.img is "realbrand.com/logo.png"');
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

      // Finding C: the block comment promises only the four env names this
      // stack ships are ever scanned — a downstream's own env name must
      // never match. The two positive tests above alone would also pass a
      // wildcard pattern (e.g. widening STACK_ENV_ALT to `[a-z0-9-]+`); only
      // a negative assertion catches that. Proven by mutation in the PR
      // description — this test goes red under exactly that widening.
      it('does NOT match a downstream project-style env name on the module-level source (home.acme.config.js)', () => {
        const moduleSource = CONFIG_SOURCES.find((s) => s.dir === 'src/modules/home/config');
        expect(moduleSource.pattern.test('home.acme.config.js')).toBe(false);
      });

      it('does NOT match a downstream project-style env name on the override-layer source (acme.config.js)', () => {
        const overrideSource = CONFIG_SOURCES.find((s) => s.dir === 'src/config/defaults');
        expect(overrideSource.pattern.test('acme.config.js')).toBe(false);
      });
    });

    describe('mechanism: scanning a source directory (fixture-backed, no real files touched)', () => {
      // Finding H: an array, not a single variable — a single `tmpDir`
      // tracked only the most recent writeFixtureSource() result, so a
      // second call within one test leaked the first directory even on a
      // clean run (proven below).
      let tmpDirs = [];

      const fixturesRoot = path.join(process.cwd(), 'scripts/tests/.fixtures-tmp');

      afterEach(() => {
        for (const dir of tmpDirs) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
        tmpDirs = [];
        // Clean up the shared parent dir too, so no stray directory is left
        // behind once the last fixture in this file is removed.
        if (fs.existsSync(fixturesRoot) && fs.readdirSync(fixturesRoot).length === 0) {
          fs.rmdirSync(fixturesRoot);
        }
      });

      /**
       * @desc Write a fixture config file shaped like a real
       * home.*.config.js / *.config.js override file, in a fresh temp
       * directory, and return the {dir, pattern} source pointing at it. Every
       * directory created this way is tracked in `tmpDirs` and removed by
       * `afterEach`, however many times this is called within one test.
       * @param {object} content - The `home.social.content[]` array to ship.
       * @param {object} [options] - Extra fixture shape controls.
       * @param {object} [options.social] - Extra keys merged into `home.social`
       * alongside `content` (e.g. `{ title: '...' }`).
       * @param {string} [options.prelude] - Raw source text written before the
       * `export default` (e.g. an opt-out named export).
       * @returns {{dir: string, pattern: RegExp}} A CONFIG_SOURCES-shaped entry.
       */
      const writeFixtureSource = (content, { social = {}, prelude = '' } = {}) => {
        // Written inside the project tree (not the OS tmpdir): Vite's SSR
        // module runner (which vitest uses for dynamic import()) refuses to
        // resolve a file:// URL outside its project root.
        fs.mkdirSync(fixturesRoot, { recursive: true });
        const dir = fs.mkdtempSync(path.join(fixturesRoot, 'src-'));
        tmpDirs.push(dir);
        const filePath = path.join(dir, 'development.config.js');
        fs.writeFileSync(
          filePath,
          `${prelude}export default { home: { social: { content: ${JSON.stringify(content)}, ...${JSON.stringify(social)} } } };\n`,
        );
        return { dir, pattern: /^development\.config\.js$/ };
      };

      it('cleans up every fixture directory created within a single test, not just the most recent one', () => {
        const source1 = writeFixtureSource([{ link: 'https://example.com', name: 'Example Co' }]);
        const source2 = writeFixtureSource([{ link: 'https://example.com', name: 'Example Co' }]);
        expect(source1.dir).not.toBe(source2.dir);
        expect(fs.existsSync(source1.dir)).toBe(true);
        expect(fs.existsSync(source2.dir)).toBe(true);
        expect(tmpDirs).toEqual([source1.dir, source2.dir]);
        // Real cleanup happens in afterEach below — asserted from OUTSIDE
        // this test in the next one, which checks fixturesRoot is empty.
      });

      it('afterEach leaves no stray fixture directory behind after the previous test', () => {
        // If the previous test's afterEach only removed the most recent
        // directory (the pre-fix bug), fixturesRoot would still exist here
        // with a leftover "src-*" directory in it.
        expect(fs.existsSync(fixturesRoot)).toBe(false);
      });

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

      // Finding B: `social.title` is free prose and was never scanned at
      // all — a real domain (or brand) pasted into it shipped with lint
      // green. The minimum meaningful check on prose is a domain-looking
      // token; see checkSectionTitle's docstring for what it deliberately
      // does NOT catch (a bare brand name with no domain shape).
      it('FAILS on a real domain pasted into social.title (title is currently never scanned)', async () => {
        const source = writeFixtureSource(
          [{ link: 'https://example.com', img: '/images/partner01.svg', name: 'Example Co' }],
          { social: { title: 'Trusted by nike.com' } },
        );
        const errors = await checkConfigFiles([source]);
        expect(errors.some((e) => e.includes('social.title') && e.includes('nike.com'))).toBe(true);
      });

      // Finding I: a downstream fork legitimately ships real partner data in
      // production.config.js/test.config.js (README-documented override
      // points, both scanned by CONFIG_SOURCES) but /update-stack keeps this
      // guard byte-identical upstream, so there is no way to edit the guard
      // itself. The opt-out is a named export the guard honours per-file.
      it('honours a per-file opt-out for a legitimate downstream real-content override (no opt-out mechanism today)', async () => {
        const source = writeFixtureSource([{ link: 'https://nike.com', name: 'Nike' }], {
          prelude: 'export const BRAND_DEFAULTS_GUARD_SKIP = true;\n',
        });
        const errors = await checkConfigFiles([source]);
        expect(errors).toEqual([]);
      });
    });

    // Finding E: a scan source that resolves to zero files (missing
    // directory, or a pattern matching nothing in a real directory) must
    // fail loudly, not report clean having inspected nothing — the same
    // policy checkComponentDocComment already applies to its own doc-comment
    // scan (see its docstring).
    describe('a scan source resolving to zero files must not report clean', () => {
      it('FAILS LOUDLY when the source directory does not exist (currently silently returns [])', async () => {
        const errors = await checkConfigFiles([{ dir: 'src/modules/home/configZZZ', pattern: /.*/ }]);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('FAILS LOUDLY when the pattern matches no file in a real, existing directory (currently silently returns [])', async () => {
        const errors = await checkConfigFiles([{ dir: 'src/modules/home/config', pattern: /^nomatch\.config\.js$/ }]);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('does NOT fail when a matched file legitimately has no home.social key (must not overcorrect)', async () => {
        const errors = await checkConfigFiles([{ dir: 'src/config/defaults', pattern: /^production\.config\.js$/ }]);
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

    // Finding F: the doc-comment scan only matched single/double-quoted
    // literals. A contributor rewriting the example with backticks made the
    // whole scan return [] silently — never flagged, never even attempted.
    it('catches a real brand literal written with backtick quotes instead of straight quotes (currently silently missed)', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        '<!--\n{ link: `https://nike.com`, img: `https://nike.com/logo.png`, name: `Nike` }\n-->\n<template><div /></template>',
      );
      const errors = checkComponentDocComment();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join('\n')).toContain('name "Nike"');
    });

    // Finding B: the doc-comment scan checks link/img/name only — `title`
    // is never scanned there either, even though the real component doc
    // comment documents a `title` field on the same example object.
    it('FAILS on a real domain pasted into the doc comment title field (title is currently never scanned there either)', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(
        '<!--\n{ title: `Trusted by nike.com`, content: [] }\n-->\n<template><div /></template>',
      );
      const errors = checkComponentDocComment();
      expect(errors.some((e) => e.includes('title') && e.includes('nike.com'))).toBe(true);
    });
  });

  describe('checkSectionTitle', () => {
    it('returns no errors for a clean prose title', () => {
      expect(checkSectionTitle('source.js', 'Trusted Partners')).toEqual([]);
    });

    it('flags a domain-looking token embedded in prose', () => {
      const errors = checkSectionTitle('source.js', 'Trusted by nike.com');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('social.title contains "nike.com"');
    });

    it('does NOT flag a bare brand name with no domain shape (documented limit, not a denylist)', () => {
      // Vue#4623 finding B concrete example: this ships lint-green today and
      // still does after the fix — catching it needs a denylist of known
      // brand names, which this guard deliberately does not maintain.
      expect(checkSectionTitle('source.js', 'Trusted by Nike and Adidas')).toEqual([]);
    });

    it('ignores a title that is absent or not a string', () => {
      expect(checkSectionTitle('source.js', undefined)).toEqual([]);
    });
  });

  describe('main (reporting/exit path)', () => {
    // Finding D: main() was exported but never imported by this test file,
    // so mutating its exit code, its error-threshold comparison, or the
    // isMain() auto-run guard was invisible to the suite meant to protect
    // it. main() now accepts an optional `sources` param (same testability
    // pattern already used by checkConfigFiles) so these three surfaces can
    // be driven directly, without touching the real (currently clean)
    // shipped config files.
    let tmpDirs = [];
    const fixturesRoot = path.join(process.cwd(), 'scripts/tests/.fixtures-tmp');

    afterEach(() => {
      for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
      tmpDirs = [];
      if (fs.existsSync(fixturesRoot) && fs.readdirSync(fixturesRoot).length === 0) {
        fs.rmdirSync(fixturesRoot);
      }
    });

    const writeDirtySource = () => {
      fs.mkdirSync(fixturesRoot, { recursive: true });
      const dir = fs.mkdtempSync(path.join(fixturesRoot, 'src-main-'));
      tmpDirs.push(dir);
      fs.writeFileSync(
        path.join(dir, 'development.config.js'),
        "export default { home: { social: { content: [{ link: 'https://nike.com', name: 'Nike' }] } } };\n",
      );
      return { dir, pattern: /^development\.config\.js$/ };
    };

    const writeCleanSource = () => {
      fs.mkdirSync(fixturesRoot, { recursive: true });
      const dir = fs.mkdtempSync(path.join(fixturesRoot, 'src-main-'));
      tmpDirs.push(dir);
      fs.writeFileSync(
        path.join(dir, 'development.config.js'),
        "export default { home: { social: { content: [{ link: 'https://example.com', img: '/images/partner01.svg', name: 'Example Co' }] } } };\n",
      );
      return { dir, pattern: /^development\.config\.js$/ };
    };

    it('a dirty input calls process.exit(1) after reporting the errors', async () => {
      const source = writeDirtySource();
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`exit:${code}`);
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(main([source])).rejects.toThrow('exit:1');
      expect(errorSpy).toHaveBeenCalled();
      exitSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('a clean input never calls process.exit', async () => {
      const source = writeCleanSource();
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`exit:${code}`);
      });
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await expect(main([source])).resolves.toBeUndefined();
      expect(exitSpy).not.toHaveBeenCalled();
      exitSpy.mockRestore();
      logSpy.mockRestore();
    });

    it('running the script directly wires isMain() to actually invoke main() (prints the pass banner on the real, currently-clean shipped config)', () => {
      // Integration-style, real subprocess: proves the `if (isMain()) main()`
      // wiring itself works — a mutation to `if (false)` would mean main()
      // is never called, so stdout would be empty (exit code alone doesn't
      // distinguish that: node exits 0 either way).
      const result = spawnSync(process.execPath, ['scripts/check-brand-defaults.js'], { encoding: 'utf8' });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Brand-default guard');
    });
  });
});
