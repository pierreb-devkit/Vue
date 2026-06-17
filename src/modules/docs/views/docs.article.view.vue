<template>
  <v-container class="docs-article py-8">
    <v-row>
      <!-- Left sidebar nav (persistent) -->
      <v-col cols="12" md="3" lg="3" order="1" class="d-none d-md-block">
        <DocsNav />
      </v-col>

      <!-- Body + ToC -->
      <v-col cols="12" md="9" lg="9" order="2">
        <!-- Breadcrumbs -->
        <v-breadcrumbs :items="breadcrumbs" class="px-0 pb-2" data-test="docs-breadcrumbs">
          <template #divider>
            <v-icon icon="fa-solid fa-chevron-right" size="x-small" />
          </template>
        </v-breadcrumbs>

        <!-- Loading -->
        <v-row v-if="loading" justify="center" class="py-12">
          <v-progress-circular indeterminate color="primary" size="48" data-test="docs-article-loading" />
        </v-row>

        <!-- Not found -->
        <v-row v-else-if="page.notFound" justify="center">
          <v-col cols="12">
            <v-alert type="warning" variant="tonal" data-test="docs-article-notfound">
              This documentation page does not exist.
            </v-alert>
          </v-col>
        </v-row>

        <!-- Article -->
        <v-row v-else>
          <!-- Body -->
          <v-col cols="12" lg="9" order="2" order-lg="1">
            <h1 class="text-headline-medium mb-6" data-test="docs-article-title">{{ page.title }}</h1>
            <!--
              The body is rendered as alternating segments: sanitized markdown
              HTML fragments (v-html) interleaved with runnable <DocsCodeblock>
              components hydrated at each `data-docs-example` marker. This keeps
              one markdown renderer (useDocsPage) while letting fenced code use
              the tabbed, copy-with-my-key component.
            -->
            <article class="docs-prose" data-test="docs-article-body">
              <template v-for="(seg, i) in bodySegments" :key="i">
                <!-- eslint-disable-next-line vue/no-v-html -- Markdown fragment sanitized by DOMPurify in useDocsPage -->
                <div v-if="seg.type === 'html'" v-html="seg.html" />
                <DocsCodeblock
                  v-else
                  :examples="page.examples[seg.index]"
                />
              </template>
            </article>

            <!-- Prev / Next -->
            <v-divider class="my-8" />
            <div class="d-flex justify-space-between ga-4 flex-wrap">
              <v-btn
                v-if="prev"
                :to="`/docs/${prev.category}/${prev.slug}`"
                variant="tonal"
                class="text-none"
                prepend-icon="fa-solid fa-arrow-left"
                data-test="docs-article-prev"
              >
                {{ prev.title }}
              </v-btn>
              <v-spacer />
              <v-btn
                v-if="next"
                :to="`/docs/${next.category}/${next.slug}`"
                variant="tonal"
                class="text-none"
                append-icon="fa-solid fa-arrow-right"
                data-test="docs-article-next"
              >
                {{ next.title }}
              </v-btn>
            </div>
          </v-col>

          <!-- Table of contents -->
          <v-col cols="12" lg="3" order="1" order-lg="2" class="d-none d-lg-block">
            <DocsToc :toc="page.toc" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDocsStore } from '../stores/docs.store';
import { useDocsPage, EXAMPLE_MARKER_SOURCE } from '../composables/useDocsPage';
import DocsNav from '../components/docs.nav.component.vue';
import DocsToc from '../components/docs.toc.component.vue';
import DocsCodeblock from '../components/docs.codeblock.component.vue';

const route = useRoute();
const store = useDocsStore();

const page = ref({ title: '', html: '', toc: [], examples: [], notFound: false });
const loading = computed(() => store.loading);

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
const category = computed(() => route.params.category);

/**
 * Article metadata resolved from the cached guide tree (title for breadcrumbs/h1).
 */
const meta = computed(() =>
  store.orderedArticles.find((a) => a.slug === slug.value) || {});

/**
 * Breadcrumb trail: Docs → Category → Article.
 */
const breadcrumbs = computed(() => [
  { title: 'Docs', to: '/docs' },
  { title: category.value, to: `/docs/${category.value}`, disabled: true },
  { title: page.value.title || meta.value.title || slug.value, disabled: true },
]);

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
 * first so breadcrumbs + prev/next resolve, then renders the markdown body.
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
.docs-prose :deep(pre.hljs) {
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.docs-prose :deep(h2),
.docs-prose :deep(h3) {
  /* offset for the sticky header when deep-linking via the ToC */
  scroll-margin-top: 96px;
}
</style>
