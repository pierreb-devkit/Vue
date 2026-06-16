<template>
  <v-container class="docs-home py-8">
    <PageHeader
      :icon="home.icon"
      :title="home.title"
      :subtitle="home.subtitle"
      avatar-color="primary"
    />

    <!-- Primary search affordance (⌘K / "/"): the landing's main entry point.
         Left-aligned to the header + door axis (not floated centre) and width
         capped so it reads as a search bar, not a full-bleed band. -->
    <v-row class="mt-5 mb-2">
      <v-col cols="12" sm="9" md="6" lg="5">
        <DocsSearch block size="large" data-test="docs-home-search" />
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading" justify="center" class="py-12">
      <v-progress-circular indeterminate color="primary" size="48" data-test="docs-home-loading" />
    </v-row>

    <!-- Error -->
    <v-row v-else-if="error" class="pa-2 mt-2">
      <v-col>
        <v-alert type="error" variant="tonal" data-test="docs-home-error">{{ error }}</v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Persona doors: one per audience, accent differentiates rather than repeats -->
      <v-row class="mt-8" data-test="docs-home-personas">
        <v-col
          v-for="persona in personas"
          :key="persona.key"
          cols="12"
          md="4"
        >
          <v-card
            :to="persona.to"
            variant="flat"
            rounded="lg"
            class="docs-door h-100 d-flex flex-column pa-5"
            :style="{ '--door-accent': `var(--v-theme-${persona.color})` }"
            :data-test="`docs-home-door-${persona.key}`"
            data-test-door
          >
            <div class="d-flex align-center ga-3 mb-3">
              <v-icon :icon="persona.icon" :class="`text-${persona.color}`" size="20" />
              <h3 class="text-title-medium font-weight-medium">{{ persona.title }}</h3>
            </div>
            <p class="text-body-medium text-medium-emphasis flex-grow-1 mb-4">
              {{ persona.subtitle }}
            </p>
            <span
              class="docs-door__cta text-body-medium font-weight-medium d-inline-flex align-center ga-2"
              :class="`text-${persona.color}`"
            >
              {{ persona.cta }}
            </span>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quickstart hero -->
      <v-card
        v-if="quickstart"
        variant="flat"
        rounded="xl"
        class="docs-quickstart mt-10 pa-2 pa-sm-4"
        data-test="docs-home-quickstart"
      >
        <v-row align="center">
          <v-col cols="12" md="5">
            <p class="text-overline text-primary mb-1">{{ quickstart.eyebrow }}</p>
            <h2 class="text-headline-medium font-weight-bold mb-3">{{ quickstart.title }}</h2>
            <p class="text-body-large text-medium-emphasis mb-4">{{ quickstart.subtitle }}</p>
            <div class="d-flex flex-wrap align-center ga-3">
              <v-btn
                v-if="quickstartCtaTo"
                :to="quickstartCtaTo"
                color="primary"
                variant="flat"
                rounded="lg"
                class="text-none"
                append-icon="fa-solid fa-arrow-right"
                data-test="docs-home-quickstart-cta"
              >
                {{ quickstart.cta.label }}
              </v-btn>
              <!-- In-theme OpenAPI reference (/docs/api) — the natural next step
                   after the first call. Config-driven title/icon; always shown. -->
              <v-btn
                to="/docs/api"
                variant="text"
                rounded="lg"
                class="text-none"
                :prepend-icon="reference.icon"
                data-test="docs-home-reference-cta"
              >
                {{ reference.title }}
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="7">
            <div class="docs-quickstart__terminal">
              <div class="docs-quickstart__bar d-flex align-center ga-2 px-3 py-2">
                <span class="docs-quickstart__dot" />
                <span class="docs-quickstart__dot" />
                <span class="docs-quickstart__dot" />
                <span class="text-caption text-medium-emphasis ml-2">{{ quickstart.language }}</span>
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -- Static config code, highlighted via highlight.js (no user input) -->
              <pre class="docs-quickstart__code" data-test="docs-home-quickstart-command" v-html="commandHtml" />
              <div class="docs-quickstart__sep d-flex align-center ga-2 px-3 py-1">
                <v-icon icon="fa-solid fa-arrow-down" size="x-small" class="text-medium-emphasis" />
                <span class="text-caption text-medium-emphasis">JSON response</span>
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -- Static config code, highlighted via highlight.js (no user input) -->
              <pre class="docs-quickstart__code" data-test="docs-home-quickstart-result" v-html="resultHtml" />
            </div>
          </v-col>
        </v-row>
      </v-card>

      <!-- Job-first category grid -->
      <div class="mt-14">
        <h2 class="text-headline-small font-weight-medium mb-1">Browse by job</h2>
        <p class="text-body-medium text-medium-emphasis mb-5">Jump straight to what you are trying to do.</p>
        <v-row data-test="docs-home-categories">
          <v-col
            v-for="category in categories"
            :key="category.slug"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card variant="flat" rounded="lg" class="docs-cat h-100" data-test="docs-home-category">
              <v-card-title class="text-title-medium font-weight-medium d-flex align-baseline justify-space-between pb-1">
                <span>{{ category.title }}</span>
                <span class="text-caption text-disabled font-weight-regular">{{ category.articles.length }}</span>
              </v-card-title>
              <v-list density="compact" bg-color="transparent" class="pb-2">
                <v-list-item
                  v-for="article in category.articles"
                  :key="article.slug"
                  :to="`/docs/${category.slug}/${article.slug}`"
                  :title="article.title"
                  class="docs-cat__item text-body-medium"
                  data-test="docs-home-article-link"
                />
              </v-list>
            </v-card>
          </v-col>

          <!-- Empty state -->
          <v-col v-if="!categories.length" cols="12">
            <v-alert type="info" variant="tonal" data-test="docs-home-empty">
              No documentation is available yet.
            </v-alert>
          </v-col>
        </v-row>
      </div>
    </template>
  </v-container>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import hljs from 'highlight.js/lib/common';
import DOMPurify from 'dompurify';
import { useDocsStore } from '../stores/docs.store';
import { resolveDocsTarget } from '../composables/useDocsNav';
import DocsSearch from '../components/docs.search.component.vue';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import config from '@/config';

const home = config?.docs?.home || { icon: 'fa-solid fa-book', title: 'Documentation', subtitle: '' };
const quickstart = config?.docs?.quickstart || null;
const reference = {
  icon: config?.docs?.reference?.icon || 'fa-solid fa-code',
  title: config?.docs?.reference?.title || 'API reference',
};

/**
 * Resolve the quickstart command snippet from config, joining array-of-lines
 * defensively, or falling back to a generic inline placeholder so the terminal
 * never renders blank.
 */
const resolveSnippet = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.join('\n');
  return String(value);
};

const QUICKSTART_COMMAND_FALLBACK =
  'curl https://api.example.com/api/resource \\\n' +
  '  -H "Authorization: Bearer <YOUR_API_KEY>"';

const QUICKSTART_RESULT_FALLBACK = '{\n  "status": "ok"\n}';

const store = useDocsStore();
const loading = computed(() => store.loading);
const error = computed(() => store.error);

/**
 * Categories in contract order, each with its articles order-sorted. Drives the
 * job-first grid at the bottom of the home view.
 */
const categories = computed(() => {
  const cats = Array.isArray(store.tree?.categories) ? store.tree.categories : [];
  return [...cats]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((cat) => ({
      ...cat,
      articles: Array.isArray(cat?.articles)
        ? [...cat.articles].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
        : [],
    }));
});

/**
 * The persona doors, each with its `target` resolved to a concrete route
 * against the loaded tree (config `target.to` override wins; otherwise the
 * category's first article; otherwise `/docs`).
 */
const personas = computed(() => {
  const defs = Array.isArray(config?.docs?.personas) ? config.docs.personas : [];
  return defs.map((p) => ({
    ...p,
    to: resolveDocsTarget(p.target, store.tree),
  }));
});

/** Resolved route for the quickstart CTA. */
const quickstartCtaTo = computed(() =>
  (quickstart?.cta ? resolveDocsTarget(quickstart.cta.target, store.tree) : null));

/**
 * Syntax-highlight + sanitize a code snippet for the quickstart terminal.
 * Reuses highlight.js (the same engine `useDocsPage` uses for article code) so
 * we never introduce a second renderer.
 * @param {string} code - The raw snippet.
 * @param {string} lang - The highlight.js language id.
 * @returns {string} Sanitized highlighted HTML.
 */
const highlight = (code, lang) => {
  const src = String(code ?? '');
  const value = lang && hljs.getLanguage(lang)
    ? hljs.highlight(src, { language: lang, ignoreIllegals: true }).value
    : hljs.highlightAuto(src).value;
  return DOMPurify.sanitize(value);
};

const commandHtml = computed(() =>
  highlight(resolveSnippet(quickstart?.command, QUICKSTART_COMMAND_FALLBACK), quickstart?.language || 'bash'));
const resultHtml = computed(() =>
  highlight(resolveSnippet(quickstart?.result, QUICKSTART_RESULT_FALLBACK), 'json'));

onMounted(() => {
  store.fetchTree().catch(() => {});
});
</script>

<style scoped>
/* Persona doors: flat + bordered; the per-persona accent emerges on hover
   instead of repeating an identical avatar block on every card. */
.docs-door {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.22s ease, border-color 0.22s ease;
}

.docs-door:hover {
  transform: translateY(-3px);
  border-color: rgba(var(--door-accent), 0.55);
  box-shadow: 0 14px 30px -18px rgba(var(--door-accent), 0.6);
}

/* Browse-by-job: quiet bordered panels; the links carry the weight, no
   repeated file-icon noise on every row. */
.docs-cat {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.docs-cat__item {
  border-radius: 8px;
  min-height: 38px;
}

.docs-cat__item :deep(.v-list-item__content) {
  transition: transform 0.18s ease;
}

.docs-cat__item:hover :deep(.v-list-item__content) {
  transform: translateX(2px);
}

.docs-quickstart {
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.docs-quickstart__terminal {
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.docs-quickstart__bar,
.docs-quickstart__sep {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.docs-quickstart__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.2);
}

.docs-quickstart__code {
  margin: 0;
  padding: 14px 16px;
  font-size: 0.8125rem;
  line-height: 1.55;
  overflow-x: auto;
  white-space: pre;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>
