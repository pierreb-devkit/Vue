import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';

/**
 * Placeholder element emitted into the rendered HTML in place of each runnable
 * example group. The article view splits the HTML on this element and mounts a
 * `<DocsCodeblock>` per group. `N` is the group's index into `examples`.
 *
 * A `<div data-docs-example>` survives DOMPurify (div + data-* are allowed),
 * unlike an HTML comment which the sanitizer strips by default.
 *
 * @param {number} n - The zero-based example index.
 * @returns {string} The placeholder HTML string.
 */
const EXAMPLE_MARKER = (n) => `<div data-docs-example="${n}"></div>`;
/** Source pattern for the placeholder element (callers build their own /g instance). */
export const EXAMPLE_MARKER_SOURCE = '<div data-docs-example="(\\d+)"><\\/div>';
/**
 * Matches the placeholder element so the article view can split the HTML.
 * NOTE: `/g` regexes carry mutable `lastIndex` — never share this instance across
 * concurrent scans. Use `String.prototype.matchAll` (creates a fresh iterator) or
 * `new RegExp(EXAMPLE_MARKER_SOURCE, 'g')` per call.
 */
export const EXAMPLE_MARKER_RE = new RegExp(EXAMPLE_MARKER_SOURCE, 'g');

/**
 * Neutralize any `data-docs-example` marker that the renderer did not emit.
 *
 * `data-docs-example` is whitelisted through DOMPurify so the renderer's own
 * hydration markers survive — but `div` + `data-*` are otherwise allowed, so a
 * guide author could embed a literal `<div data-docs-example="N">` in prose. It
 * would survive sanitization and inject a bogus slot (or shift the index) into
 * the article-view splitter. Only the markers the renderer inserts from the
 * controlled `examples` list are legitimate: those are indices `0 … count-1`,
 * each appearing exactly once, in ascending document order. This walks every
 * `data-docs-example` occurrence and keeps only the one matching the next
 * expected controlled index; every other occurrence has its attribute stripped
 * (the surrounding prose is left intact), so the splitter never sees a stray.
 *
 * @param {string} html - The sanitized article HTML.
 * @returns {string} The HTML with author-injected markers neutralized.
 */
const stripStrayExampleMarkers = (html) => {
  let expected = 0;
  // Match the marker's attribute as DOMPurify serializes it; rebuild only the
  // attribute, leaving the rest of the element untouched.
  return String(html).replace(/data-docs-example="(\d+)"/g, (full, idx) => {
    if (Number(idx) === expected) {
      expected += 1;
      return full;
    }
    // Author-injected (out of sequence / duplicate / out of range): drop the
    // hydration attribute so the splitter ignores this element.
    return 'data-docs-example-stripped';
  });
};

/**
 * Minimal HTML-attribute encoder for values interpolated into the pre-DOMPurify
 * HTML string (e.g. a fenced block's language id). DOMPurify sanitizes the
 * result downstream, but encoding at construction time is defense-in-depth: it
 * keeps a hostile info-string (`bash" onmouseover="…`) from ever forming a
 * breakout attribute, independent of the sanitizer's allow-list.
 * @param {string} value
 * @returns {string}
 */
const encodeAttr = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

/**
 * Slugify a heading's text into a stable anchor id.
 * @param {string} text - The heading text content.
 * @returns {string} A kebab-case anchor id.
 */
export const slugifyHeading = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Build a marked renderer that:
 *  - assigns stable anchor ids to h2/h3 headings (so the ToC can deep-link), and
 *  - syntax-highlights fenced code blocks via highlight.js.
 *
 * Collects the heading anchors into `toc` as a side effect.
 *
 * @param {Array<{ level: number, text: string, id: string }>} toc - Mutated in place.
 * @returns {import('marked').MarkedExtension} A marked extension (renderer overrides).
 */
const buildRenderer = (toc) => ({
  renderer: {
    /**
     * Render a heading, registering h2/h3 anchors into the ToC.
     * @param {{ tokens: Array, depth: number }} args - marked heading token.
     * @returns {string} HTML for the heading.
     */
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      // Derive the plain-text label from the raw token stream (not by regex-
      // stripping the parsed HTML — a `<[^>]+>` strip is foolable by crafted
      // attribute content). `slugifyHeading` then filters to [\w\s-], and the id
      // is HTML-encoded before interpolation, so the anchor id stays inert.
      const plain = this.parser.parseInline(tokens, this.parser.textRenderer).trim();
      const id = slugifyHeading(plain);
      if (depth === 2 || depth === 3) toc.push({ level: depth, text: plain, id });
      return `<h${depth} id="${encodeAttr(id)}">${text}</h${depth}>\n`;
    },
    /**
     * Render a fenced code block with highlight.js when the language is known.
     * @param {{ text: string, lang?: string }} args - marked code token.
     * @returns {string} HTML for the code block.
     */
    code({ text, lang }) {
      const language = (lang || '').match(/\S*/)?.[0] || '';
      let highlighted;
      if (language && hljs.getLanguage(language)) {
        highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
      } else {
        highlighted = hljs.highlightAuto(text).value;
      }
      const cls = language ? ` class="language-${encodeAttr(language)}"` : '';
      return `<pre class="hljs"><code${cls}>${highlighted}</code></pre>\n`;
    },
  },
});

/**
 * Extract the language id from a fenced block's info-string (first word).
 * @param {string} lang - The raw info-string (e.g. `bash`, `js title="x"`).
 * @returns {string}
 */
const langOf = (lang) => (lang || '').match(/\S*/)?.[0] || '';

/**
 * Split a markdown source into ordered segments, grouping *consecutive* fenced
 * code blocks into runnable example groups. The guide convention:
 *
 *   - Two or more fenced blocks with only whitespace between them = ONE
 *     multi-language example (curl / Node / Python tabs).
 *   - A lone fenced block = a single-language example (degrades to no tabs).
 *   - Each example may carry the `<YOUR_API_KEY>` placeholder; the component
 *     renders it verbatim and copies it as-is.
 *
 * Markdown prose is left untouched and rendered by `marked`; example groups are
 * replaced with a `<div data-docs-example="N">` marker the article view hydrates.
 *
 * @param {string} markdown - Raw article markdown.
 * @param {import('marked').Marked} lexer - A Marked instance (for tokenizing).
 * @returns {{ stitched: string, examples: Array<Array<{ lang: string, code: string }>> }}
 *   `stitched` is markdown with example groups replaced by markers; `examples`
 *   is the ordered list of groups (each group = an array of language snippets).
 */
const extractExamples = (markdown, lexer) => {
  const tokens = lexer.lexer(markdown);
  const examples = [];
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.type === 'code') {
      // Greedily collect this run of code blocks, skipping whitespace-only space
      // tokens between them so visually-adjacent fences group together.
      const group = [{ lang: langOf(tok.lang), code: tok.text }];
      let j = i + 1;
      while (j < tokens.length) {
        const next = tokens[j];
        if (next.type === 'space') { j += 1; continue; }
        if (next.type === 'code') {
          group.push({ lang: langOf(next.lang), code: next.text });
          j += 1;
          continue;
        }
        break;
      }
      out.push(`\n\n${EXAMPLE_MARKER(examples.length)}\n\n`);
      examples.push(group);
      i = j;
    } else {
      // Re-emit the original markdown slice verbatim so marked renders it.
      out.push(tok.raw);
      i += 1;
    }
  }
  return { stitched: out.join(''), examples };
};

const NOT_FOUND = { title: '', html: '', toc: [], examples: [], notFound: true };

/**
 * Resolve an article slug to rendered, sanitized HTML + a heading ToC +
 * extracted runnable examples.
 *
 * Mirrors `useLegalPage`: a pure async function over an injected fetcher. The
 * markdown render pipeline is the same one `<VMarkdown>` uses (marked +
 * DOMPurify) — no second renderer — extended with anchor ids + highlight.js,
 * plus a pre-pass that lifts fenced code-block groups out into `examples` so the
 * article view can mount `<DocsCodeblock>` (language tabs + copy button).
 *
 * @param {string} slug - The article slug.
 * @param {Object} [options]
 * @param {(slug: string) => Promise<string|null>} [options.fetcher] - Markdown loader.
 * @param {{ title?: string }} [options.meta] - Optional article metadata (e.g. title from the tree).
 * @returns {Promise<{ title: string, html: string, toc: Array, examples: Array, notFound: boolean }>}
 */
export async function useDocsPage(slug, { fetcher, meta = {} } = {}) {
  if (!slug || typeof fetcher !== 'function') return { ...NOT_FOUND };

  let markdown;
  try {
    markdown = await fetcher(slug);
  } catch {
    return { ...NOT_FOUND };
  }
  if (typeof markdown !== 'string' || !markdown.trim()) return { ...NOT_FOUND };

  const toc = [];
  // marked.use is global+stateful; scope the renderer to a local instance so
  // concurrent renders don't share ToC accumulators.
  const instance = new Marked({ mangle: false, headerIds: false });
  instance.use(buildRenderer(toc));

  // Pre-pass: lift fenced code-block groups into structured examples and replace
  // them with markers (rendered later as <DocsCodeblock> by the article view).
  const { stitched, examples } = extractExamples(markdown, instance);

  const rawHtml = instance.parse(stitched);
  // `data-docs-example` is our hydration hook — whitelist it through DOMPurify so
  // the marker `<div>` (and its index) survive sanitization for the article view.
  const sanitized = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['id', 'class', 'data-docs-example'],
  });
  // Whitelisting `data-docs-example` also lets an author's literal
  // `<div data-docs-example="N">` in prose through the sanitizer; neutralize any
  // marker the renderer did not emit so only the controlled examples hydrate.
  const html = stripStrayExampleMarkers(sanitized);

  // Prefer the tree-provided title; fall back to the first h1 in the body.
  let title = meta.title || '';
  if (!title) {
    const h1 = markdown.match(/^#\s+(.+)$/m);
    title = h1 ? h1[1].trim() : '';
  }

  return { title, html, toc, examples, notFound: false };
}

export default useDocsPage;
