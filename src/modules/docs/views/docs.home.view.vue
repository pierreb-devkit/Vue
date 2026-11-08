<template>
  <DocsShell :title="home.title">
    <div>
      <v-sheet tag="header" color="transparent" max-width="640" class="pb-8">
        <h1 class="text-headline-large font-weight-medium mb-3" data-test="docs-home-title">{{ home.title }}</h1>
        <p class="text-body-large text-medium-emphasis">{{ home.subtitle }}</p>
      </v-sheet>

      <!-- Loading -->
      <v-row v-if="loading" justify="center" class="py-12">
        <AppSpinner color="primary" size="48" data-test="docs-home-loading" />
      </v-row>

      <!-- Error -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mt-4" data-test="docs-home-error">{{ error }}</v-alert>

      <template v-else>
        <!-- One way in per audience -->
        <v-row no-gutters class="border-t" data-test="docs-home-personas">
          <v-col v-for="persona in personas" :key="persona.key" cols="12" md="4" class="pe-md-12">
            <v-card
              :to="persona.to"
              variant="text"
              rounded="0"
              class="d-flex flex-column h-100 py-6"
              :data-test="`docs-home-door-${persona.key}`"
              data-test-door
            >
              <h2 class="text-title-medium font-weight-medium mb-1">{{ persona.title }}</h2>
              <p class="text-medium-emphasis flex-grow-1 mb-2">{{ persona.subtitle }}</p>
              <span class="text-decoration-underline">{{ persona.cta }}</span>
            </v-card>
          </v-col>
        </v-row>

        <!-- The first call: a section like any route's on a guide -->
        <v-row v-if="quickstart" tag="section" no-gutters class="docs-row py-10 border-t" data-test="docs-home-quickstart">
          <v-col cols="12" lg="6" class="pe-lg-6">
            <h2 class="text-title-large font-weight-medium mb-2">{{ quickstart.title }}</h2>
            <p>{{ quickstart.subtitle }}</p>
            <div class="d-flex flex-wrap align-center ga-3 mt-4">
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
              <v-btn
                to="/docs/api"
                variant="text"
                rounded="lg"
                class="text-none"
                data-test="docs-home-reference-cta"
              >
                {{ referenceTitle }}
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" lg="6" class="d-flex flex-column ga-3 ps-lg-6 mt-6 mt-lg-0">
            <DocsCodeblock :examples="commandExamples" data-test="docs-home-quickstart-command" />
            <DocsCodeblock :examples="resultExamples" data-test="docs-home-quickstart-result" />
          </v-col>
        </v-row>

        <!-- Every guide, by job -->
        <section class="py-10 border-t">
          <h2 class="text-title-large font-weight-medium mb-2">Browse by job</h2>
          <p>Jump straight to what you are trying to do.</p>
          <v-row class="mt-6" data-test="docs-home-categories">
            <v-col
              v-for="category in categories"
              :key="category.slug"
              cols="12"
              sm="6"
              lg="4"
              data-test="docs-home-category"
            >
              <h3 class="text-title-small pb-2 mb-1 border-b">{{ category.title }}</h3>
              <v-list density="compact" bg-color="transparent" class="pa-0">
                <v-list-item
                  v-for="article in category.articles"
                  :key="article.slug"
                  :to="`/docs/${category.slug}/${article.slug}`"
                  :title="article.title"
                  min-height="32"
                  class="px-0"
                  data-test="docs-home-article-link"
                />
              </v-list>
            </v-col>
          </v-row>
          <v-alert v-if="!categories.length" type="info" variant="tonal" data-test="docs-home-empty">
            No documentation is available yet.
          </v-alert>
        </section>
      </template>
    </div>
  </DocsShell>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useDocsStore } from '../stores/docs.store';
import { resolveDocsTarget, sortedCategories } from '../composables/useDocsNav';
import DocsShell from '../components/docs.shell.component.vue';
import DocsCodeblock from '../components/docs.codeblock.component.vue';
import AppSpinner from '../../core/components/core.appSpinner.component.vue';
import config from '@/config';

const home = config?.docs?.home || { title: 'Documentation', subtitle: '' };
const quickstart = config?.docs?.quickstart || null;
const referenceTitle = config?.docs?.reference?.title || 'API reference';

/**
 * Resolve the quickstart command snippet from config, joining array-of-lines
 * defensively, or falling back to a generic inline placeholder so the card
 * never renders blank.
 * @param {string|string[]|undefined} value - The configured snippet
 * @param {string} fallback - The snippet when none is configured
 * @returns {string} The snippet
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

const categories = computed(() => sortedCategories(store.tree));

/**
 * The ways in, each with its `target` resolved to a concrete route against the
 * loaded tree (config `target.to` override wins; otherwise the category's first
 * article; otherwise `/docs`).
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

const commandExamples = computed(() => [{
  lang: quickstart?.language || 'bash',
  code: resolveSnippet(quickstart?.command, QUICKSTART_COMMAND_FALLBACK),
}]);
const resultExamples = computed(() => [{
  lang: 'json',
  label: 'Response',
  code: resolveSnippet(quickstart?.result, QUICKSTART_RESULT_FALLBACK),
}]);

onMounted(() => {
  store.fetchTree().catch(() => {});
});
</script>
