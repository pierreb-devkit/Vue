#!/usr/bin/env node
/**
 * Brand-default guard (Vue#4340).
 *
 * The home module's "social proof" section (`social.content[].link`) ships
 * logo/name/link entries as a public-OSS default. A real third-party brand
 * name or domain must never be a shipped default here — only an RFC 2606
 * reserved placeholder: example.com/.net/.org (the three reserved 2LDs,
 * including subdomains like `partner.example.com`), a domain under one of
 * the four reserved TLDs (.test/.example/.invalid/.localhost), or a local
 * `#`/`/`-relative link.
 *
 * Allowlist-based, not a denylist of known-bad brands: any `link` value that
 * isn't one of the reserved forms fails, so the *next* real domain someone
 * pastes in fails too — not just the ones already caught once.
 *
 * Scoped to `social.content[].link` specifically (not a whole-file text
 * scan) because the same config files legitimately link real domains
 * elsewhere (github.com, the project blog, etc.) — a blanket domain scan
 * would false-positive on those.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const RFC2606_LINK_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(example\.(com|net|org)|(example|test|invalid|localhost))(\/.*)?$/i;
const LOCAL_LINK_RE = /^[#/]/;

const isAllowedLink = (link) => typeof link === 'string' && (LOCAL_LINK_RE.test(link) || RFC2606_LINK_RE.test(link));

/**
 * @desc Check one social-content entry's `link` field.
 * @param {string} source - Human-readable source label for error messages.
 * @param {object} item - A `social.content[]` entry.
 * @param {number} index - Entry index, for error messages.
 * @returns {string[]} Error messages, empty when the entry is clean.
 */
const checkContentItem = (source, item, index) => {
  if (!item || typeof item.link === 'undefined') return [];
  if (isAllowedLink(item.link)) return [];
  return [`${source}: social.content[${index}].link is "${item.link}" (name: "${item.name}") — not an RFC-2606 placeholder. Use https://example.com (or .org/.net/.edu), a #/relative link, never a real third-party domain.`];
};

/**
 * @desc Check every module `home.*.config.js` file's `social.content` for
 * non-RFC-2606 link literals.
 * @returns {Promise<string[]>} All error messages found.
 */
const checkConfigFiles = async () => {
  const dir = 'src/modules/home/config';
  if (!fs.existsSync(dir)) return [];
  const errors = [];
  for (const file of fs.readdirSync(dir)) {
    if (!/^home\..*\.config\.js$/.test(file)) continue;
    const filePath = path.join(dir, file);
    const mod = await import(pathToFileURL(path.resolve(filePath)).href);
    const content = mod.default?.home?.social?.content;
    if (!Array.isArray(content)) continue;
    content.forEach((item, index) => {
      errors.push(...checkContentItem(filePath, item, index));
    });
  }
  return errors;
};

/**
 * @desc Check the home.social component's doc-comment example (the config
 * shape it documents at the top of the file) for non-RFC-2606 link literals.
 * Text-scanned rather than imported — it's a comment, not executable code —
 * scoped to `link:` lines only (the component itself carries no default).
 * @returns {string[]} All error messages found.
 */
const checkComponentDocComment = () => {
  const filePath = 'src/modules/home/components/home.social.component.vue';
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, 'utf8');
  const commentMatch = text.match(/^<!--([\s\S]*?)-->/);
  if (!commentMatch) return [];
  const comment = commentMatch[1];
  const errors = [];
  const linkRe = /link:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = linkRe.exec(comment))) {
    if (isAllowedLink(m[1])) continue;
    const line = comment.slice(0, m.index).split('\n').length;
    errors.push(`${filePath} (doc comment, line ~${line}): link "${m[1]}" is not an RFC-2606 placeholder.`);
  }
  return errors;
};

const main = async () => {
  const errors = [...(await checkConfigFiles()), ...checkComponentDocComment()];
  if (errors.length > 0) {
    console.error('✗ Brand-default guard failed (Vue#4340):\n');
    errors.forEach((e) => console.error(`  ${e}`));
    console.error('\nReplace with an RFC-2606 reserved placeholder (example.com/.org/.net/.edu) — never a real third-party domain.');
    process.exit(1);
  }
  console.log('✓ Brand-default guard: home social-proof defaults are RFC-2606 clean.');
};

main();
