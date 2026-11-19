<template>
  <DocsShell
    class="docs-article"
    :sections="railSections"
    :title="panes?.title || page.title"
    :prev="prev"
    :next="next"
  >
    <DocsPanes v-if="panes" :page="panes" />

    <v-sheet v-else color="transparent" max-width="720">
      <!-- Loading -->
      <v-row v-if="loading" justify="center" class="py-12">
        <AppSpinner color="primary" size="48" data-test="docs-article-loading" />
      </v-row>

      <!-- Not found -->
      <v-alert v-else-if="page.notFound" type="warning" variant="tonal" data-test="docs-article-notfound">
        This documentation page does not exist.
      </v-alert>

      <!-- Article -->
      <template v-else>
          <h1 class="text-headline-large font-weight-medium mb-3" data-test="docs-article-title">{{ page.title }}</h1>
          <!--
            The body is rendered as alternating segments: sanitized markdown
            HTML fragments (v-html) interleaved with runnable <DocsCodeblock>
            components hydrated at each `data-docs-example` marker. This keeps
            one markdown renderer (useDocsPage) while letting fenced code use
            the tabbed, copy-with-my-key component.
          -->
          <CoreProse tag="article" class="docs-prose" data-test="docs-article-body">
            <template v-for="(seg, i) in bodySegments" :key="i">
              <!-- eslint-disable-next-line vue/no-v-html -- Markdown fragment sanitized by DOMPurify in useDocsPage -->
              <div v-if="seg.type === 'html'" v-html="seg.html" />
              <DocsCodeblock
                v-else
                :examples="page.examples[seg.index]"
                class="my-6"
              />
            </template>
          </CoreProse>
        </template>
    </v-sheet>
  </DocsShell>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDocsStore } from '../stores/docs.store';
import { useDocsPage, EXAMPLE_MARKER_SOURCE } from '../composables/useDocsPage';
import DocsShell from '../components/docs.shell.component.vue';
import DocsCodeblock from '../components/docs.codeblock.component.vue';
import DocsPanes from '../components/docs.panes.component.vue';
import AppSpinner from '../../core/components/core.appSpinner.component.vue';
import CoreProse from '../../core/components/core.prose.component.vue';
import { usePageHead } from '@/lib/composables/usePageHead';

/**
 * Two-pane guides, by slug. A consumer adds `content/docs.<slug>.content.js`
 * (default export: `{ title, lead, base, sections }`); the module ships none.
 * A downstream uses its project name as the slug: `docs.<project>.content.js`.
 * Bundled with this route only, and a Map so a URL slug never hits a prototype key.
 */
const PANE_PAGES = new Map(
  Object.entries(import.meta.glob('../content/docs.*.content.js', { eager: true, import: 'default' }))
    .map(([path, content]) => [path.match(/docs\.(.+)\.content\.js$/)[1], content]),
);

const route = useRoute();
const store = useDocsStore();
const panes = computed(() => PANE_PAGES.get(route.params.slug) || null);

const page = ref({ title: '', html: '', toc: [], examples: [], notFound: false });
const loading = computed(() => store.loading);

/** This page's sections in the rail: the two-pane page's, or the guide's headings. */
const railSections = computed(() => panes.value?.sections?.map((s) => ({ ...s, nav: s.nav ?? s.title }))
  || page.value.toc.map((h) => ({ id: h.id, nav: h.text, depth: h.level - 2 })));

/**
 * Split the sanitized article HTML on the `data-docs-example` markers into an
 * ordered list of segments: `{ type: 'html', html }` prose fragments and
 * `{ type: 'example', index }` slots hydrated by <DocsCodeblock>. Falls back to
 * a single html segment when the article has no runnable examples.
 */
const bodySegments = computed(() => {
  const html = page.value.html || '';
  const examples = page.value.examples || [];
  if (!examples.length) return html ? [{ type: 'html', html }] : [];

  const segments = [];
  let lastIndex = 0;
  // Build a fresh /g regex per computation: matchAll's iterator carries its own
  // lastIndex, so concurrent component instances never race on a shared one.
  const markerRe = new RegExp(EXAMPLE_MARKER_SOURCE, 'g');
  for (const match of html.matchAll(markerRe)) {
    const before = html.slice(lastIndex, match.index);
    if (before) segments.push({ type: 'html', html: before });
    const index = Number(match[1]);
    // Guard against a marker pointing past the examples array.
    if (examples[index]) segments.push({ type: 'example', index });
    lastIndex = match.index + match[0].length;
  }
  const tail = html.slice(lastIndex);
  if (tail) segments.push({ type: 'html', html: tail });
  return segments;
});

/**
 * The current slug from the route (`/docs/:category/:slug`).
 */
const slug = computed(() => route.params.slug);

/**
 * Article metadata resolved from the cached guide tree (title for the h1).
 */
const meta = computed(() =>
  store.orderedArticles.find((a) => a.slug === slug.value) || {});

/** Search title + summary: the guide's own, from the two-pane page or the guide tree. */
usePageHead(() => ({
  title: panes.value?.title || meta.value.title || page.value.title,
  description: panes.value?.lead || meta.value.summary,
}));

/**
 * Prev/next from the flattened, order-sorted article list.
 */
const currentIndex = computed(() =>
  store.orderedArticles.findIndex((a) => a.slug === slug.value));
const prev = computed(() => {
  const i = currentIndex.value;
  return i > 0 ? store.orderedArticles[i - 1] : null;
});
const next = computed(() => {
  const i = currentIndex.value;
  return i >= 0 && i < store.orderedArticles.length - 1 ? store.orderedArticles[i + 1] : null;
});

/**
 * Monotonically-increasing token used to discard responses from superseded
 * in-flight loads (race guard). Each call to `load` captures the token at
 * invocation time; on resolution it checks that the token still matches the
 * current one — if not, a newer navigation fired and the result is stale.
 */
let _loadToken = 0;

/**
 * Load (and render) the article for a given slug. Ensures the tree is loaded
 * first so the title + prev/next resolve, then renders the markdown body.
 *
 * Race guard: if the slug changes while a fetch is in flight, the earlier
 * promise resolves but its result is silently dropped because its captured
 * token no longer matches the current one.
 *
 * @param {string} s - The article slug.
 * @returns {Promise<void>}
 */
const load = async (s) => {
  const token = ++_loadToken;
  if (!s) {
    page.value = { title: '', html: '', toc: [], examples: [], notFound: true };
    return;
  }
  await store.fetchTree().catch(() => {});
  if (PANE_PAGES.has(s)) return;
  const result = await useDocsPage(s, {
    fetcher: (sl) => store.fetchArticle(sl),
    meta: meta.value,
    // The tree feeds the cross-guide `#anchor` link rewrite (fetched just above).
    tree: store.tree,
  });
  // Only commit if this load is still the latest one.
  if (token === _loadToken) {
    page.value = result;
  }
};

watch(slug, (s) => load(s), { immediate: true });
</script>

<style scoped>
/*
 * Rendered markdown takes the shared prose sheet (CoreProse); below are the
 * guide-only rules: reading measure, lead paragraph, section rules, anchors.
 */

/* Prose: one reading measure; tables and code may use the whole column. */
.docs-prose :deep(p),
.docs-prose :deep(ul),
.docs-prose :deep(ol) {
  max-width: 600px;
}

/* A guide's opening paragraph, with or without an anchor paragraph before it. */
.docs-prose > div:first-child > :deep(p:first-child:has(> a[id]:empty:only-child) + p),
.docs-prose > div:first-child > :deep(p:first-child:not(:has(> a[id]:empty:only-child))) {
  font-size: 1.125rem;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 8px;
}

/* A section opens as on a two-pane page: rule, then title. */
.docs-prose :deep(h2) {
  padding-top: 40px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Guides put `<a id>` anchors in a paragraph of their own: it takes no room. */
.docs-prose :deep(p:has(> a[id]:empty:only-child)) {
  margin: 0;
}

.docs-prose :deep(h2),
.docs-prose :deep(h3),
.docs-prose :deep(a[id]) {
  /* offset for the sticky header when deep-linking from the rail */
  scroll-margin-top: 128px;
}

@media (min-width: 840px) {
  .docs-prose :deep(h2),
  .docs-prose :deep(h3),
  .docs-prose :deep(a[id]) {
    scroll-margin-top: 72px;
  }
}

/*
 * The wrapper (emitted by useDocsPage's table renderer) scrolls horizontally
 * so the table only overflows sideways when a cell truly cannot shrink (e.g.
 * a long unbreakable code span), instead of forcing the whole article sideways.
 */
.docs-prose :deep(.docs-table-scroll) {
  max-width: 100%;
  overflow-x: auto;
  margin: 16px 0 24px;
}
</style>
