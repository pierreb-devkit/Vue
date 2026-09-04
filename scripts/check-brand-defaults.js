/**
 * Brand-default guard (Vue#4340).
 *
 * The home module's "social proof" section (`social.content[]`) ships
 * logo/name/link entries as a public-OSS default. A real third-party brand
 * name or domain must never be a shipped default here — only an RFC 2606
 * reserved link (example.com/.net/.org, including subdomains like
 * `partner.example.com`, a domain under one of the four reserved TLDs
 * — .test/.example/.invalid/.localhost —, a `#fragment`, or a rooted
 * `/local/path`) paired with a placeholder name starting with "Example"
 * (e.g. "Example Co"). `img` is held to the same local-or-RFC2606 standard
 * as `link` (see checkContentItem) — a local asset path or a reserved
 * domain, never an off-site URL. `social.title` (free prose) is checked too,
 * for a narrower thing — see checkSectionTitle.
 *
 * Both `link`/`img` and `name` are allowlist-based, not a denylist of
 * known-bad brands: any value that isn't one of the reserved/placeholder
 * forms fails, so the *next* real domain or brand name someone pastes in
 * fails too — not just the ones already caught once.
 *
 * IMPORTANT — what this guard cannot see: `img` is checked as a STRING
 * (the path/URL literal), never as image content. A real third-party logo
 * committed as a local file under a neutral filename (e.g.
 * `/images/partner01.svg` actually containing a competitor's logo) is
 * indistinguishable from a genuine placeholder asset and passes clean.
 * This guard closes the off-site-hotlink leak, not "does this file contain
 * a real logo" — that needs human/design review at commit time.
 *
 * Scoped to `social.content[]`/`social.title` specifically (not a whole-file
 * text scan) because the same config files legitimately link real domains
 * elsewhere (github.com, the project blog, etc.) — a blanket domain scan
 * would false-positive on those.
 *
 * Scanned sources are the STACK's own shipped environments — the
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
 * Downstream note — `production`/`test` are NOT downstream-exclusive names:
 * the README documents `src/config/defaults/production.config.js` and
 * `test.config.js` as legitimate override points a downstream fork may use
 * directly (e.g. when it deploys with `NODE_ENV=production` rather than its
 * own project name), alongside the project-named form (`acme.config.js`,
 * `home.acme.config.js`) that the env allowlist below keeps out of scope
 * entirely. A downstream fork's `production.config.js`/`test.config.js` IS
 * scanned like the stack's own, which is correct for the stack's own repo
 * but means a downstream that legitimately ships its real partner list
 * there — because /update-stack keeps this guard byte-identical upstream,
 * so it cannot edit the guard itself — has no way to pass. The opt-out: add
 * `export const BRAND_DEFAULTS_GUARD_SKIP = true;` to that specific file
 * (see OPT_OUT_FLAG below). It is per-file, survives /update-stack (it's
 * downstream's own file content, not the guard), and never reaches the
 * generated config (generateConfig only reads the file's `default` export).
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

// A downstream fork's per-file opt-out for a legitimate real-content
// override the guard would otherwise flag — see the docstring's
// "Downstream note" above.
const OPT_OUT_FLAG = 'BRAND_DEFAULTS_GUARD_SKIP';

const RFC2606_LINK_RE = /^(https?:\/\/)?([a-z0-9-]+\.)*(example\.(com|net|org)|(example|test|invalid|localhost))([/?#].*)?$/i;

// A genuinely local reference: a `#fragment`, or a rooted `/path` (optionally
// `./`/`../`-relative). Determined with the real WHATWG URL parser (the same
// parser the browser applies to `:href`) rather than a string prefix alone —
// a prefix heuristic (e.g. "starts with / and not // or /\") keeps losing to
// forms the parser normalizes differently than the prefix expects: a stray
// ASCII tab/CR/LF ANYWHERE in the string is stripped by the parser before
// resolving (`/\t/realbrand.com` → `//realbrand.com`), and a leading `\` is
// treated as `/` for http(s) URLs — both land on a real third-party host
// despite "looking" local by prefix. Resolving against a sentinel origin and
// checking the result's host sidesteps the whole quirk family at once.
//
// The shape gate below is load-bearing on its own, independent of the URL
// parser: a scheme-less BARE hostname (no leading `#`, `/`, `./`, or `../`)
// — e.g. `realbrand.com` — has the exact same shape as a genuine relative
// asset path (`logo.svg`) to a URL parser: both resolve against the sentinel
// base to a same-host path, so the parser alone cannot tell them apart. That
// was the actual hole (Vue#4623 finding A): the two real brands this PR
// removes, re-added without a scheme, passed as "local". The fix is to
// simply not treat a scheme-less bare string as eligible for "local" at all
// — every real local reference in this repo already writes a leading `/`
// (`/images/partner01.svg`), `#` (`#top`), or `./`/`../`, none of which a
// domain can start with. A value that fails this shape gate is NOT local; it
// still gets a chance to pass via the RFC-2606 check below (isAllowedLink),
// which is exactly where a bare domain belongs.
const LOCAL_SENTINEL = 'https://guard.invalid/';
const LOCAL_SENTINEL_HOST = new URL(LOCAL_SENTINEL).host;
const LOCAL_SHAPE_RE = /^(#|\.\.?\/|\/(?!\/))/;

/**
 * @desc Check whether a link is a genuinely local reference: empty, a
 * `#fragment`, or a rooted/`./`/`../`-relative path that resolves to no host
 * other than the page's own. A scheme-less bare hostname (e.g.
 * "realbrand.com") is deliberately NOT eligible — see the block comment
 * above for why that shape is indistinguishable from a real domain and must
 * fall through to the RFC-2606 check instead.
 * @param {string} link - The raw link/img literal to check.
 * @returns {boolean} True when the link is local to the page.
 */
const isLocalLink = (link) => {
  if (link !== '' && !LOCAL_SHAPE_RE.test(link)) return false;
  try {
    return new URL(link, LOCAL_SENTINEL).host === LOCAL_SENTINEL_HOST;
  } catch {
    // Unparseable → fail closed: not local, so it still has to clear the
    // RFC2606 check below to pass at all.
    return false;
  }
};

// NOTE: this is a PREFIX allowlist, not a full-name match — "Example Nike"
// passes because it starts with "Example". Known, accepted limit of the
// design, not an oversight.
const PLACEHOLDER_NAME_RE = /^Example\b/;

/**
 * @desc Check whether a link/img literal is an allowed shipped default: a
 * local link (see isLocalLink) or an RFC 2606 reserved domain.
 * @param {string} link - The raw link/img literal to check.
 * @returns {boolean} True when the link is allowed as a shipped default.
 */
const isAllowedLink = (link) => typeof link === 'string' && (isLocalLink(link) || RFC2606_LINK_RE.test(link));

/**
 * @desc Check whether a name literal starts with the "Example" placeholder
 * prefix. Prefix match only — see PLACEHOLDER_NAME_RE comment above for the
 * accepted "Example Nike" limit.
 * @param {string} name - The raw name literal to check.
 * @returns {boolean} True when the name is an allowed placeholder.
 */
const isPlaceholderName = (name) => typeof name === 'string' && PLACEHOLDER_NAME_RE.test(name);

// A domain-looking token embedded in free prose: a label sequence ending in
// a 2+ letter TLD-shaped label (e.g. "nike.com", "partner.example.com").
// Deliberately conservative — a version string ("v2.0"), a unit ("1.5M"), or
// an abbreviation ("e.g.") all end in a label under 2 letters and don't
// match.
const DOMAIN_TOKEN_RE = /\b[a-z0-9-]+\.[a-z]{2,}\b/gi;

/**
 * @desc Find every domain-looking token in free text that is not an allowed
 * RFC-2606 placeholder. See DOMAIN_TOKEN_RE / checkSectionTitle for what
 * this can and cannot catch.
 * @param {string} text - The free-text field to scan (e.g. a section title).
 * @returns {string[]} The disallowed tokens found, in source order.
 */
const findDisallowedDomainTokens = (text) => {
  if (typeof text !== 'string') return [];
  const tokens = text.match(DOMAIN_TOKEN_RE) || [];
  return tokens.filter((token) => !isAllowedLink(token));
};

const LINK_ADVICE = 'Use https://example.com (or .net/.org), a domain under .example/.test/.invalid/.localhost, a #fragment, or a rooted /local/path (or ./ /../-relative) — never a real third-party domain (even scheme-less, e.g. "realbrand.com"), and never a form (protocol-relative //host, a leading \\, or an embedded tab/CR/LF) that a URL parser resolves to a real host.';
const IMG_ADVICE = 'Use a local asset path (e.g. /images/partner01.svg) or an RFC-2606 placeholder link — never an off-site image URL, and never a scheme-less real domain. Note: this only checks the path/URL string, not what the image file actually depicts.';
const NAME_ADVICE = 'Shipped defaults must use a placeholder name starting with "Example" (e.g. "Example Co", "Example Corp") — never a real third-party brand name.';
const TITLE_ADVICE = 'A shipped section title must not contain a literal domain-looking token (e.g. "nike.com") — use an RFC-2606 domain if a domain-like example is needed at all. This only catches a domain-SHAPED token: a bare brand name with no domain in it (e.g. "Trusted by Nike and Adidas") is NOT detected here — catching that would need a denylist of known brand names, which this guard deliberately does not maintain (see module docstring: allowlist-based, not a denylist).';
const DOWNSTREAM_OPT_OUT_ADVICE = `Downstream fork with a legitimate real partner list in a scanned file (e.g. production.config.js)? Add "export const ${OPT_OUT_FLAG} = true;" to that file to opt it out of this guard — see this script's docstring ("Downstream note") for why that's needed and what it does/doesn't affect.`;

/**
 * @desc Check one social-content entry's `link`, `img`, and `name` fields.
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
  if (typeof item.img !== 'undefined' && !isAllowedLink(item.img)) {
    errors.push(`${source}: social.content[${index}].img is "${item.img}" (name: "${item.name}") — not a local asset path or RFC-2606 placeholder. ${IMG_ADVICE}`);
  }
  if (typeof item.name !== 'undefined' && !isPlaceholderName(item.name)) {
    errors.push(`${source}: social.content[${index}].name is "${item.name}" — not a placeholder name. ${NAME_ADVICE}`);
  }
  return errors;
};

/**
 * @desc Check a `social.title` literal (free prose, not a placeholder-
 * prefixed name) for an embedded domain-looking token. See TITLE_ADVICE for
 * what this deliberately does and does not catch.
 * @param {string} source - Human-readable source label for error messages.
 * @param {*} title - The raw `social.title` value, if any.
 * @returns {string[]} Error messages, empty when the title is clean (or absent).
 */
const checkSectionTitle = (source, title) => findDisallowedDomainTokens(title).map(
  (token) => `${source}: social.title contains "${token}" — not an RFC-2606 placeholder domain. ${TITLE_ADVICE}`,
);

const CONFIG_SOURCES = [
  // The home module's own defaults, scoped to the stack's own envs.
  { dir: 'src/modules/home/config', pattern: new RegExp(`^home\\.(${STACK_ENV_ALT})\\.config\\.js$`) },
  // generateConfig's override layer — deepMerge replaces arrays wholesale,
  // so a `home.social.content` entry here overrides the module layer above
  // entirely and is what actually ships in the generated config. Same env
  // allowlist: a downstream project's own env-named file is never matched.
  { dir: 'src/config/defaults', pattern: new RegExp(`^(${STACK_ENV_ALT})\\.config\\.js$`) },
];

/**
 * @desc Check every scanned config file's `social.content` and `social.title`
 * for non-clean literals. See CONFIG_SOURCES for exactly what's scanned and
 * why, and for the default value of `sources`. A source that resolves to
 * zero files (missing directory, or a pattern matching no file in an
 * existing directory) is reported as an error rather than silently skipped
 * — the same "never report clean having inspected nothing" policy
 * checkComponentDocComment applies to its own scan.
 * @param {{dir: string, pattern: RegExp}[]} [sources] - Directories + file
 * patterns to scan. Defaults to CONFIG_SOURCES (the guard's real scan
 * targets); overridable so tests can point this at a fixture directory
 * without touching real shipped config files.
 * @returns {Promise<string[]>} All error messages found.
 */
const checkConfigFiles = async (sources = CONFIG_SOURCES) => {
  const errors = [];
  for (const { dir, pattern } of sources) {
    if (!fs.existsSync(dir)) {
      errors.push(`${dir}: directory not found — expected to scan files matching ${pattern} here but there is nothing to inspect. If this directory was intentionally moved or removed, update CONFIG_SOURCES in this guard; otherwise restore it.`);
      continue;
    }
    const matchedFiles = fs.readdirSync(dir).filter((file) => pattern.test(file));
    if (matchedFiles.length === 0) {
      errors.push(`${dir}: no file matched ${pattern} — expected at least one shipped config file here but there is nothing to inspect. A scan that finds nothing to inspect must say so, not report clean. If the file was intentionally renamed or removed, update CONFIG_SOURCES in this guard.`);
      continue;
    }
    for (const file of matchedFiles) {
      const filePath = path.join(dir, file);
      const mod = await import(pathToFileURL(path.resolve(filePath)).href);
      if (mod[OPT_OUT_FLAG] === true) {
        console.log(`  ⚠ ${filePath}: skipped (opt-out) — ${OPT_OUT_FLAG} is set. Not scanned for brand content.`);
        continue;
      }
      const social = mod.default?.home?.social;
      if (!social) continue; // legitimate: this env file doesn't touch home.social at all
      if (Array.isArray(social.content)) {
        social.content.forEach((item, index) => {
          errors.push(...checkContentItem(filePath, item, index));
        });
      }
      errors.push(...checkSectionTitle(filePath, social.title));
    }
  }
  return errors;
};

/**
 * @desc Find every `field: <literal>` occurrence in text, where <literal> is
 * a single-quoted, double-quoted, or backtick-quoted string. Used to scan
 * the doc-comment example (comments are ordinary text, not executable code,
 * so real parsing isn't available) — a contributor rewriting the example
 * with backticks must still be caught, not silently skipped (Vue#4623
 * finding F).
 * @param {string} text - The text to scan (the doc comment body).
 * @param {string} field - The field name to look for (e.g. "link").
 * @returns {{value: string, index: number}[]} Matches, in source order.
 */
const matchFieldLiterals = (text, field) => {
  const re = new RegExp(`\\b${field}:\\s*(?:'([^']*)'|"([^"]*)"|\`([^\`]*)\`)`, 'g');
  const matches = [];
  let m;
  while ((m = re.exec(text))) {
    matches.push({ value: m[1] ?? m[2] ?? m[3], index: m.index });
  }
  return matches;
};

/**
 * @desc Check the home.social component's doc-comment example (the config
 * shape it documents at the top of the file) for non-clean link/img/name/
 * title literals. Text-scanned rather than imported — it's a comment, not
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
  const lineOf = (index) => comment.slice(0, index).split('\n').length;

  for (const { value, index } of matchFieldLiterals(comment, 'link')) {
    if (isAllowedLink(value)) continue;
    errors.push(`${filePath} (doc comment, line ~${lineOf(index)}): link "${value}" is not an RFC-2606 placeholder. ${LINK_ADVICE}`);
  }
  for (const { value, index } of matchFieldLiterals(comment, 'img')) {
    if (isAllowedLink(value)) continue;
    errors.push(`${filePath} (doc comment, line ~${lineOf(index)}): img "${value}" is not a local asset path or RFC-2606 placeholder. ${IMG_ADVICE}`);
  }
  for (const { value, index } of matchFieldLiterals(comment, 'name')) {
    if (isPlaceholderName(value)) continue;
    errors.push(`${filePath} (doc comment, line ~${lineOf(index)}): name "${value}" is not a placeholder name. ${NAME_ADVICE}`);
  }
  for (const { value, index } of matchFieldLiterals(comment, 'title')) {
    const tokens = findDisallowedDomainTokens(value);
    tokens.forEach((token) => {
      errors.push(`${filePath} (doc comment, line ~${lineOf(index)}): title contains "${token}" — not an RFC-2606 placeholder domain. ${TITLE_ADVICE}`);
    });
  }
  return errors;
};

/**
 * @desc Run the full guard: check both config sources and the component doc
 * comment, print every error found, and exit non-zero if any exist.
 * @param {{dir: string, pattern: RegExp}[]} [sources] - Passed straight
 * through to checkConfigFiles. Defaults to the real scan targets; overridable
 * so tests can drive the reporting/exit path against a fixture without
 * touching real shipped config files (Vue#4623 finding D).
 * @returns {Promise<void>}
 */
const main = async (sources = CONFIG_SOURCES) => {
  const errors = [...(await checkConfigFiles(sources)), ...checkComponentDocComment()];
  if (errors.length > 0) {
    console.error('✗ Brand-default guard failed (Vue#4340):\n');
    errors.forEach((e) => console.error(`  ${e}`));
    console.error(`\n${LINK_ADVICE}\n${IMG_ADVICE}\n${NAME_ADVICE}\n${TITLE_ADVICE}\n${DOWNSTREAM_OPT_OUT_ADVICE}`);
    process.exit(1);
  }
  console.log('✓ Brand-default guard: home social-proof defaults are RFC-2606 clean.');
};

// Only run when executed directly (`node scripts/check-brand-defaults.js`,
// including via `npm run check:brand-defaults`) — not when imported, so unit
// tests can import the functions above without triggering a real scan/exit.
const isMain = () => {
  try {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
};

if (isMain()) {
  main();
}

export {
  isLocalLink,
  isAllowedLink,
  isPlaceholderName,
  checkContentItem,
  checkSectionTitle,
  CONFIG_SOURCES,
  checkConfigFiles,
  checkComponentDocComment,
  main,
};
