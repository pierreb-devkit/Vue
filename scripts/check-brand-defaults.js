#!/usr/bin/env node
/**
 * Brand-default guard (Vue#4340).
 *
 * The home module's "social proof" section (`social.content[]`) ships
 * logo/name/link entries as a public-OSS default. A real third-party brand
 * name, domain, or logo must never be a shipped default here — only an RFC
 * 2606 reserved link (example.com/.net/.org, including subdomains like
 * `partner.example.com`, a domain under one of the four reserved TLDs
 * — .test/.example/.invalid/.localhost —, a `#fragment`, or a single-slash
 * `/relative` path) paired with a placeholder name starting with "Example"
 * (e.g. "Example Co").
 *
 * Both `link` and `name` are allowlist-based, not a denylist of known-bad
 * brands: any value that isn't one of the reserved/placeholder forms fails,
 * so the *next* real domain or brand name someone pastes in fails too — not
 * just the ones already caught once.
 *
 * Scoped to `social.content[]` specifically (not a whole-file text scan)
 * because the same config files legitimately link real domains elsewhere
 * (github.com, the project blog, etc.) — a blanket domain scan would
 * false-positive on those.
 *
 * Scanned sources are the STACK's own shipped environments ONLY — the
 * `development`/`production`/`test`/`myproject` config files this repo
 * itself ships (see README "Configuration" section for the naming
 * convention: `<name>.<env>.config.js` per-module, `<env>.config.js`
 * global):
 *   - src/modules/home/config/home.{development,production,test,myproject}.config.js
 *   - src/config/defaults/{development,production,test,myproject}.config.js
 *     (generateConfig's override layer — deepMerge replaces arrays
 *     wholesale, so this layer WINS over the module config above; skipping
 *     it would miss the layer that actually ships)
 *
 * A downstream project that forks this stack (via /update-stack) creates
 * its OWN env-named files at these exact same two paths — e.g.
 * `home.acme.config.js` / `acme.config.js` — carrying that project's real
 * partner names/logos, which is legitimate. The env allowlist above is
 * what keeps those out of scope: only the four env names this stack itself
 * ships are ever scanned, so a downstream project's own env name is never
 * matched and never scanned, no matter what it contains.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// The stack's own environments — see README "Configuration" for the full
// naming convention. `myproject` is the downstream-override template this
// repo ships (copy-and-rename target for a real project's own env name),
// not a real downstream project itself, so it's included here too.
const STACK_ENVS = ['development', 'production', 'test', 'myproject'];
const STACK_ENV_ALT = STACK_ENVS.join('|');

const RFC2606_LINK_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(example\.(com|net|org)|(example|test|invalid|localhost))(\/.*)?$/i;
// A genuinely local link: a `#fragment`, or a single `/`-absolute path not
// followed by another `/` or a `\`. NOT `//host` or `/\host` — both are
// protocol-relative URLs (browsers normalize a leading `\` to `/` for
// http(s) URLs) that resolve against a real third-party host, e.g.
// `//realbrand.com`. Those must fall through to the RFC2606 check, not be
// waved through as "local".
const LOCAL_LINK_RE = /^(#|\/(?![/\\]))/;
const PLACEHOLDER_NAME_RE = /^Example\b/;

const isAllowedLink = (link) => typeof link === 'string' && (LOCAL_LINK_RE.test(link) || RFC2606_LINK_RE.test(link));
const isPlaceholderName = (name) => typeof name === 'string' && PLACEHOLDER_NAME_RE.test(name);

const LINK_ADVICE = 'Use https://example.com (or .net/.org), a domain under .example/.test/.invalid/.localhost, a #fragment, or a single-slash /relative path — never a real third-party domain, and never a protocol-relative //host link.';
const NAME_ADVICE = 'Shipped defaults must use a placeholder name starting with "Example" (e.g. "Example Co", "Example Corp") — never a real third-party brand name.';

/**
 * @desc Check one social-content entry's `link` and `name` fields.
 * @param {string} source - Human-readable source label for error messages.
 * @param {object} item - A `social.content[]` entry.
 * @param {number} index - Entry index, for error messages.
 * @returns {string[]} Error messages, empty when the entry is clean.
 */
const checkContentItem = (source, item, index) => {
  if (!item) return [];
  const errors = [];
  if (typeof item.link !== 'undefined' && !isAllowedLink(item.link)) {
    errors.push(`${source}: social.content[${index}].link is "${item.link}" (name: "${item.name}") — not an RFC-2606 placeholder. ${LINK_ADVICE}`);
  }
  if (typeof item.name !== 'undefined' && !isPlaceholderName(item.name)) {
    errors.push(`${source}: social.content[${index}].name is "${item.name}" — not a placeholder name. ${NAME_ADVICE}`);
  }
  return errors;
};

const CONFIG_SOURCES = [
  // The home module's own defaults, scoped to the stack's own envs.
  { dir: 'src/modules/home/config', pattern: new RegExp(`^home\\.(${STACK_ENV_ALT})\\.config\\.js$`) },
  // generateConfig's override layer — deepMerge replaces arrays wholesale,
  // so a `home.social.content` entry here overrides the module layer above
  // entirely and is what actually ships in the generated config. Same env
  // allowlist: a downstream project's own env file is never matched.
  { dir: 'src/config/defaults', pattern: new RegExp(`^(${STACK_ENV_ALT})\\.config\\.js$`) },
];

/**
 * @desc Check every scanned config file's `social.content` for non-clean
 * link/name literals. See CONFIG_SOURCES for exactly what's scanned and why.
 * @returns {Promise<string[]>} All error messages found.
 */
const checkConfigFiles = async () => {
  const errors = [];
  for (const { dir, pattern } of CONFIG_SOURCES) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!pattern.test(file)) continue;
      const filePath = path.join(dir, file);
      const mod = await import(pathToFileURL(path.resolve(filePath)).href);
      const content = mod.default?.home?.social?.content;
      if (!Array.isArray(content)) continue;
      content.forEach((item, index) => {
        errors.push(...checkContentItem(filePath, item, index));
      });
    }
  }
  return errors;
};

/**
 * @desc Check the home.social component's doc-comment example (the config
 * shape it documents at the top of the file) for non-clean link/name
 * literals. Text-scanned rather than imported — it's a comment, not
 * executable code. Tolerates leading whitespace before the comment, but
 * treats a missing/unmatched comment as an error rather than a silent
 * pass — a scan that finds nothing to inspect where it expected a comment
 * block must say so, not report clean.
 * @returns {string[]} All error messages found.
 */
const checkComponentDocComment = () => {
  const filePath = 'src/modules/home/components/home.social.component.vue';
  if (!fs.existsSync(filePath)) {
    return [`${filePath}: expected file not found — cannot verify its doc comment is brand-clean. If it was intentionally moved or renamed, update this guard.`];
  }
  const text = fs.readFileSync(filePath, 'utf8');
  const commentMatch = text.match(/^\s*<!--([\s\S]*?)-->/);
  if (!commentMatch) {
    return [`${filePath}: expected a leading <!-- --> doc comment documenting the config shape, found none — cannot verify it is brand-clean. If the comment was intentionally removed or moved, update this guard; otherwise restore it.`];
  }
  const comment = commentMatch[1];
  const errors = [];
  const linkRe = /link:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = linkRe.exec(comment))) {
    if (isAllowedLink(m[1])) continue;
    const line = comment.slice(0, m.index).split('\n').length;
    errors.push(`${filePath} (doc comment, line ~${line}): link "${m[1]}" is not an RFC-2606 placeholder. ${LINK_ADVICE}`);
  }
  const nameRe = /name:\s*['"]([^'"]+)['"]/g;
  while ((m = nameRe.exec(comment))) {
    if (isPlaceholderName(m[1])) continue;
    const line = comment.slice(0, m.index).split('\n').length;
    errors.push(`${filePath} (doc comment, line ~${line}): name "${m[1]}" is not a placeholder name. ${NAME_ADVICE}`);
  }
  return errors;
};

const main = async () => {
  const errors = [...(await checkConfigFiles()), ...checkComponentDocComment()];
  if (errors.length > 0) {
    console.error('✗ Brand-default guard failed (Vue#4340):\n');
    errors.forEach((e) => console.error(`  ${e}`));
    console.error(`\n${LINK_ADVICE}\n${NAME_ADVICE}`);
    process.exit(1);
  }
  console.log('✓ Brand-default guard: home social-proof defaults are RFC-2606 clean.');
};

main();
