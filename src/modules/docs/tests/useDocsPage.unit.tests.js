import { describe, it, expect } from 'vitest';
import { useDocsPage, slugifyHeading, EXAMPLE_MARKER_RE } from '../composables/useDocsPage';

const markdown = [
  '# Install Guide',
  '',
  'Intro paragraph.',
  '',
  '## Requirements',
  '',
  'You need Node.',
  '',
  '## Steps',
  '',
  '### Clone',
  '',
  '```js',
  "const x = 1;",
  'console.log(x);',
  '```',
  '',
  'Done.',
].join('\n');

describe('slugifyHeading', () => {
  it('kebab-cases and strips punctuation', () => {
    expect(slugifyHeading('Getting Started!')).toBe('getting-started');
    expect(slugifyHeading('  Multiple   spaces  ')).toBe('multiple-spaces');
    expect(slugifyHeading('C++ & Rust')).toBe('c-rust');
  });
});

describe('useDocsPage', () => {
  it('renders sanitized HTML and builds a ToC from h2/h3 headings', async () => {
    const fetcher = async () => markdown;
    const page = await useDocsPage('install', { fetcher });

    expect(page.notFound).toBe(false);
    expect(page.html).toContain('Intro paragraph.');
    // ToC only collects h2 + h3
    expect(page.toc.map((e) => e.text)).toEqual(['Requirements', 'Steps', 'Clone']);
    expect(page.toc.map((e) => e.level)).toEqual([2, 2, 3]);
    // headings carry stable anchor ids
    expect(page.html).toContain('id="requirements"');
    expect(page.html).toContain('id="clone"');
  });

  it('derives the title from the tree meta when provided', async () => {
    const fetcher = async () => markdown;
    const page = await useDocsPage('install', { fetcher, meta: { title: 'Install (from tree)' } });
    expect(page.title).toBe('Install (from tree)');
  });

  it('falls back to the first h1 for the title when no meta', async () => {
    const fetcher = async () => markdown;
    const page = await useDocsPage('install', { fetcher });
    expect(page.title).toBe('Install Guide');
  });

  it('lifts fenced code blocks into runnable examples (rendered by DocsCodeblock)', async () => {
    const fetcher = async () => markdown;
    const page = await useDocsPage('install', { fetcher });
    // Fenced code is no longer inlined as <pre class="hljs"> — it is extracted
    // into `examples` and replaced with a hydration marker for DocsCodeblock
    // (which owns the highlighting + copy affordance).
    expect(page.html).not.toContain('class="hljs"');
    expect(page.html).toContain('data-docs-example="0"');
    expect(page.examples).toHaveLength(1);
    expect(page.examples[0]).toEqual([{ lang: 'js', code: 'const x = 1;\nconsole.log(x);' }]);
  });

  it('returns notFound when the fetcher yields empty markdown', async () => {
    const page = await useDocsPage('empty', { fetcher: async () => '' });
    expect(page.notFound).toBe(true);
    expect(page.toc).toEqual([]);
  });

  it('returns notFound when the fetcher returns null', async () => {
    const page = await useDocsPage('missing', { fetcher: async () => null });
    expect(page.notFound).toBe(true);
  });

  it('returns notFound when the fetcher throws', async () => {
    const page = await useDocsPage('boom', {
      fetcher: async () => { throw new Error('500'); },
    });
    expect(page.notFound).toBe(true);
  });

  it('returns notFound when slug or fetcher is missing', async () => {
    expect((await useDocsPage('', { fetcher: async () => markdown })).notFound).toBe(true);
    expect((await useDocsPage('x')).notFound).toBe(true);
  });

  it('groups consecutive fenced blocks into one multi-language example', async () => {
    const md = [
      '# Quickstart',
      '',
      'Run it:',
      '',
      '```bash',
      'curl https://api.example.com/resource -H "Authorization: Bearer <YOUR_API_KEY>"',
      '```',
      '',
      '```js',
      'fetch(url, { headers: { Authorization: "Bearer <YOUR_API_KEY>" } });',
      '```',
      '',
      '```python',
      'requests.get(url, headers={"Authorization": "Bearer <YOUR_API_KEY>"})',
      '```',
      '',
      '## Next',
      '',
      'A lone block:',
      '',
      '```json',
      '{ "ok": true }',
      '```',
    ].join('\n');

    const page = await useDocsPage('quickstart', { fetcher: async () => md });
    // Two example groups: the curl/node/python trio + the lone json block.
    expect(page.examples).toHaveLength(2);
    expect(page.examples[0].map((e) => e.lang)).toEqual(['bash', 'js', 'python']);
    expect(page.examples[1].map((e) => e.lang)).toEqual(['json']);
    // Snippets keep the raw placeholder (for clipboard copy downstream).
    expect(page.examples[0][0].code).toContain('<YOUR_API_KEY>');
  });

  it('replaces example groups with hydration markers (not inline highlighted code)', async () => {
    const md = ['# T', '', '```bash', 'echo hi', '```'].join('\n');
    const page = await useDocsPage('t', { fetcher: async () => md });
    EXAMPLE_MARKER_RE.lastIndex = 0;
    const markers = [...page.html.matchAll(EXAMPLE_MARKER_RE)];
    expect(markers).toHaveLength(1);
    expect(markers[0][1]).toBe('0');
    // The fenced block is lifted out — no inline highlighted <pre class="hljs"> remains.
    expect(page.html).not.toContain('class="hljs"');
    // Prose around it is still rendered.
    expect(page.examples[0][0].code).toBe('echo hi');
  });

  it('still builds the ToC when articles contain example groups', async () => {
    const md = [
      '# Title',
      '',
      '## Setup',
      '',
      '```bash',
      'echo a',
      '```',
      '',
      '```js',
      'const a = 1;',
      '```',
      '',
      '## Done',
    ].join('\n');
    const page = await useDocsPage('x', { fetcher: async () => md });
    expect(page.toc.map((e) => e.text)).toEqual(['Setup', 'Done']);
    expect(page.examples).toHaveLength(1);
    expect(page.examples[0]).toHaveLength(2);
  });

  it('returns an empty examples array for prose-only articles', async () => {
    const md = '# Just prose\n\nNo code here.';
    const page = await useDocsPage('prose', { fetcher: async () => md });
    expect(page.examples).toEqual([]);
    expect(page.html).toContain('No code here.');
  });

  it('never leaks a snippet body into the rendered HTML (placeholder stays in the example)', async () => {
    const md = ['# T', '', '```bash', 'curl -H "Authorization: Bearer <YOUR_API_KEY>"', '```'].join('\n');
    const page = await useDocsPage('t', { fetcher: async () => md });
    // The rendered HTML carries only the marker — no inline snippet body.
    expect(page.html).not.toContain('Authorization');
    // The placeholder lives in the structured example (the component renders it),
    // not pre-substituted with any real value.
    expect(page.examples[0][0].code).toContain('<YOUR_API_KEY>');
  });

  it('strips XSS payloads from rendered markdown', async () => {
    const fetcher = async () => '# Hi\n\n<img src="x" onerror="alert(1)">\n\n## Section';
    const page = await useDocsPage('xss', { fetcher });
    expect(page.notFound).toBe(false);
    expect(page.html).not.toContain('onerror');
    // benign heading still rendered + collected
    expect(page.toc.map((e) => e.text)).toEqual(['Section']);
  });

  it('does not let a hostile fenced info-string form a breakout attribute', async () => {
    // A lone fenced block renders inline (not lifted into examples), so its
    // language id reaches the `class="language-…"` attribute. The info-string is
    // HTML-encoded at construction, so no event-handler attribute can be forged.
    const md = ['# T', '', 'before', '', '```bash" onmouseover="alert(1)', 'echo hi', '```'].join('\n');
    const page = await useDocsPage('t', { fetcher: async () => md });
    expect(page.html).not.toContain('onmouseover');
  });

  it('slugs headings with crafted inline content without leaking attribute text', async () => {
    const fetcher = async () => '# T\n\n## Hello `code` World';
    const page = await useDocsPage('h', { fetcher });
    // Plain text comes from the token text renderer, not a regex tag-strip.
    expect(page.toc.map((e) => e.text)).toEqual(['Hello code World']);
    expect(page.html).toContain('id="hello-code-world"');
  });

  it('ignores an author-injected data-docs-example marker in prose', async () => {
    // `data-docs-example` is the hydration hook the splitter indexes on. A guide
    // author could embed a literal `<div data-docs-example="N">` in prose — it
    // survives markdown + DOMPurify (data-* + div are allowed) and would inject a
    // bogus example slot (or shift the indexing) into the article view. Only the
    // markers the renderer itself inserts from the controlled `examples` list may
    // survive: the stray one is stripped post-sanitize, before the split.
    const md = [
      '# Guide',
      '',
      '<div data-docs-example="9">sneaky</div>',
      '',
      'Some prose.',
      '',
      '```bash',
      'echo hi',
      '```',
    ].join('\n');
    const page = await useDocsPage('g', { fetcher: async () => md });

    // Exactly one controlled example (the fenced block) — the stray div does not
    // create a second.
    expect(page.examples).toHaveLength(1);
    expect(page.examples[0]).toEqual([{ lang: 'bash', code: 'echo hi' }]);

    // Only the renderer's own marker (index 0) survives in the HTML; the stray
    // `data-docs-example="9"` is gone, so the splitter indexes correctly.
    const markers = [...page.html.matchAll(/data-docs-example="(\d+)"/g)].map((m) => m[1]);
    expect(markers).toEqual(['0']);
    expect(page.html).not.toContain('data-docs-example="9"');
    // The prose text around the stray div is preserved.
    expect(page.html).toContain('Some prose.');
  });

  it('keeps the renderer marker, not an author-forged in-sequence marker placed before it', async () => {
    // Regression for the in-sequence forgery case: an author embeds the *next
    // expected* marker `<div data-docs-example="0"></div>` in prose BEFORE the
    // real example. A position-counting strip would keep the forged one (first
    // "0" seen) and drop the renderer's — hydrating the example at the wrong spot.
    // The per-render nonce defeats this: the author can't tag their marker, so it
    // is stripped and only the renderer's surviving marker (after the prose) wins.
    const md = [
      '# Guide',
      '',
      '<div data-docs-example="0"></div>',
      '',
      'Some prose.',
      '',
      '```bash',
      'echo hi',
      '```',
    ].join('\n');
    const page = await useDocsPage('g', { fetcher: async () => md });

    expect(page.examples).toHaveLength(1);
    const markers = [...page.html.matchAll(/data-docs-example="(\d+)"/g)].map((m) => m[1]);
    expect(markers).toEqual(['0']);
    // The surviving marker is the renderer's — it sits AFTER the prose (the real
    // example position), not at the forged div's spot at the top of the article.
    expect(page.html.indexOf('data-docs-example="0"')).toBeGreaterThan(
      page.html.indexOf('Some prose.'),
    );
    // The author's forged marker was neutralized in place.
    expect(page.html).toContain('data-docs-example-stripped');
  });
});

describe('useDocsPage cross-guide link rewrite', () => {
  // Normalized tree shape (what `store.tree` holds): categories → articles.
  const tree = {
    categories: [
      {
        slug: 'get-started',
        title: 'Get Started',
        order: 0,
        articles: [{ slug: 'quickstart', title: 'Quickstart', order: 0, category: 'get-started' }],
      },
      {
        slug: 'operate',
        title: 'Operate',
        order: 1,
        articles: [
          // Authoritative anchor (`rl-top`) deliberately differs from the slug.
          { slug: 'rate-limits', title: 'Rate limits', order: 0, category: 'operate', anchor: 'rl-top' },
        ],
      },
    ],
  };

  // A `#later` link placed BEFORE the `## Later` heading exercises the forward-
  // reference case; `#webhooks` (h1) and `#deep-detail` (h4) exercise depths the
  // ToC accumulator never holds — all must be classified in-file via the prescan.
  const md = [
    '# Webhooks',
    '',
    '[jump to setup](#setup) then [jump ahead](#later).',
    '',
    'See [the quickstart](#quickstart), [rate limits by anchor](#rl-top),',
    '[rate limits by slug](#rate-limits), and [nowhere](#does-not-exist).',
    'Back to [the top](#webhooks).',
    '',
    '## Setup',
    '',
    'Body.',
    '',
    '#### Deep detail',
    '',
    'Jump to [deep detail](#deep-detail).',
    '',
    '## Later',
    '',
    'End.',
  ].join('\n');

  const render = (overrides = {}) =>
    useDocsPage('webhooks', { fetcher: async () => md, tree, ...overrides });

  it('rewrites a cross-guide #anchor matching another guide slug to its route', async () => {
    const page = await render();
    expect(page.html).toContain('href="/docs/get-started/quickstart#quickstart"');
    expect(page.html).toContain('href="/docs/operate/rate-limits#rate-limits"');
  });

  it('resolves an authoritative anchor id that differs from the slug', async () => {
    const page = await render();
    expect(page.html).toContain('href="/docs/operate/rate-limits#rl-top"');
  });

  it('leaves in-file anchors untouched — forward refs, h1 and h4 targets included', async () => {
    const page = await render();
    expect(page.html).toContain('href="#setup"'); // h2
    expect(page.html).toContain('href="#later"'); // forward ref (link precedes heading)
    expect(page.html).toContain('href="#webhooks"'); // h1 (never in the ToC)
    expect(page.html).toContain('href="#deep-detail"'); // h4 (never in the ToC)
  });

  it('leaves an unknown #anchor untouched (fail-soft, no invented target)', async () => {
    const page = await render();
    expect(page.html).toContain('href="#does-not-exist"');
  });

  it('disables the rewrite fail-soft when no tree is provided', async () => {
    const page = await useDocsPage('webhooks', { fetcher: async () => md });
    expect(page.html).toContain('href="#quickstart"');
    expect(page.html).not.toContain('/docs/get-started');
  });

  it('prefers the authoritative anchor over a colliding slug (anchor wins)', async () => {
    const ambiguous = {
      categories: [
        { slug: 'a', order: 0, articles: [{ slug: 'dup', category: 'a' }] },
        { slug: 'b', order: 1, articles: [{ slug: 'real', category: 'b', anchor: 'dup' }] },
      ],
    };
    const src = ['# Doc', '', 'Go [there](#dup).'].join('\n');
    const page = await useDocsPage('doc', { fetcher: async () => src, tree: ambiguous });
    expect(page.html).toContain('href="/docs/b/real#dup"');
    expect(page.html).not.toContain('/docs/a/dup');
  });

  it('skips an ambiguous id claimed by two guides within the same keying', async () => {
    const collide = {
      categories: [
        { slug: 'a', order: 0, articles: [{ slug: 'same', category: 'a' }] },
        { slug: 'b', order: 1, articles: [{ slug: 'same', category: 'b' }] },
      ],
    };
    const src = ['# Doc', '', 'Go [there](#same).'].join('\n');
    const page = await useDocsPage('doc', { fetcher: async () => src, tree: collide });
    expect(page.html).toContain('href="#same"');
    expect(page.html).not.toContain('/docs/');
  });
});
