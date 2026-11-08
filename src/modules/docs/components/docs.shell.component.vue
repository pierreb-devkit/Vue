<!--
  DocsShell
  =========
  What every docs page shares: the rail (or, under its width, one slim bar), the
  page column, prev/next, and the styles the pages have in common. The page goes
  in the default slot and names its sections; the shell marks the current one.
-->
<template>
  <v-container fluid max-width="1560" class="docs-shell mx-auto py-8" data-test="docs-shell">
    <div class="docs-shell__wash" aria-hidden="true" />
    <div class="d-flex ga-10 position-relative pb-16 pb-md-0">
      <v-sheet v-if="mdAndUp" tag="aside" color="transparent" width="216" class="flex-shrink-0">
        <DocsNav :sections="sections" :active-id="activeId" />
      </v-sheet>

      <v-sheet color="transparent" min-width="0" class="docs-body flex-1-1-0">
        <v-sheet
          v-if="!mdAndUp"
          position="fixed"
          rounded="pill"
          class="d-flex align-center ga-2 pa-2 docs-glass"
          :style="[barGlass, barPlace]"
          data-test="docs-shell-bar"
        >
          <v-menu location="top start" offset="12">
            <template #activator="{ props: menu }">
              <v-btn v-bind="menu" variant="text" size="small" min-width="0" class="flex-shrink-1 text-none" append-icon="fa-solid fa-chevron-up" data-test="docs-shell-menu">
                {{ activeLabel }}
              </v-btn>
            </template>
            <v-list density="compact" max-height="60vh" rounded="lg" class="docs-glass" :style="menuGlass">
              <template v-if="sections.length">
                <v-list-subheader>On this page</v-list-subheader>
                <v-list-item v-for="section in sections" :key="section.id" :href="`#${section.id}`" :title="section.nav" :class="{ 'pl-8': section.depth }" />
                <v-divider class="my-1" />
              </template>
              <v-list-item to="/docs" exact :title="homeTitle" />
              <v-list-item to="/docs/api" :title="referenceTitle" />
              <template v-for="category in categories" :key="category.slug">
                <v-list-subheader>{{ category.title }}</v-list-subheader>
                <v-list-item
                  v-for="article in category.articles"
                  :key="article.slug"
                  :to="`/docs/${category.slug}/${article.slug}`"
                  :title="article.title"
                />
              </template>
            </v-list>
          </v-menu>
          <v-spacer />
          <DocsSearch compact />
        </v-sheet>

        <slot />

        <div v-if="prev || next" class="d-flex flex-wrap ga-4 mt-10 pt-4 border-t">
          <v-btn
            v-if="prev"
            :to="`/docs/${prev.category}/${prev.slug}`"
            variant="text"
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
            variant="text"
            class="text-none"
            append-icon="fa-solid fa-arrow-right"
            data-test="docs-article-next"
          >
            {{ next.title }}
          </v-btn>
        </div>
      </v-sheet>
    </div>
  </v-container>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useDocsStore } from '../stores/docs.store';
import { sortedCategories } from '../composables/useDocsNav';
import { useDocsGlass } from '../composables/useDocsGlass';
import DocsNav from './docs.nav.component.vue';
import DocsSearch from './docs.search.component.vue';
import config from '@/config';

const props = defineProps({
  /** This page's sections, in page order: `{ id, nav, group? }`. */
  sections: { type: Array, default: () => [] },
  /** The page's name, for the slim bar. */
  title: { type: String, default: '' },
  /** Previous guide in the tree, or null. */
  prev: { type: Object, default: null },
  /** Next guide in the tree, or null. */
  next: { type: Object, default: null },
});

/** A section is current once its top has passed this line, just under the app bar. */
const CURRENT_LINE = 140;

const route = useRoute();
const store = useDocsStore();
const { mdAndUp } = useDisplay();
// Text scrolls behind the phone bar: more surface, so its own text stays readable.
const barGlass = useDocsGlass(0.85);
const menuGlass = useDocsGlass(0.92);
/** The phone bar floats over the page, in reach of the thumb. */
const barPlace = { left: '12px', right: '12px', bottom: 'calc(12px + env(safe-area-inset-bottom))', zIndex: 5 };

const homeTitle = config?.docs?.home?.title || 'Documentation';
const referenceTitle = config?.docs?.reference?.title || 'API reference';
const categories = computed(() => sortedCategories(store.tree));

const activeId = ref(null);
const activeLabel = computed(() =>
  props.sections.find((s) => s.id === activeId.value)?.nav || props.title || homeTitle);

/**
 * Mark the last section whose top has passed the line; at the very bottom, the last one.
 * @returns {void}
 */
const markCurrent = () => {
  const { sections } = props;
  if (!sections.length) {
    activeId.value = null;
    return;
  }
  let current = sections[0].id;
  sections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= CURRENT_LINE) current = id;
  });
  const atBottom = window.scrollY > 0
    && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  activeId.value = atBottom ? sections[sections.length - 1].id : current;
};

/**
 * Once the sections are in the page: land on the link's section, then mark the current one.
 * @returns {Promise<void>}
 */
const arrive = async () => {
  await nextTick();
  if (route?.hash) document.getElementById(route.hash.slice(1))?.scrollIntoView();
  markCurrent();
};

/**
 * A new page opens at its top, unless its link names a section.
 * @returns {void}
 */
const openAtTop = () => {
  if (!route?.hash) document.documentElement.scrollTop = 0;
};

watch(() => props.sections, arrive);
watch(() => route?.path, openAtTop);

onMounted(() => {
  window.addEventListener('scroll', markCurrent, { passive: true });
  openAtTop();
  arrive();
});

onBeforeUnmount(() => window.removeEventListener('scroll', markCurrent));
</script>

<style scoped>
/* Decorative: the theme's two colours far behind the page, what the glass refracts. */
.docs-shell__wash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(420px 460px at 4% 18%, rgba(var(--v-theme-primary), 0.2), transparent 72%),
    radial-gradient(380px 420px at 14% 78%, rgba(var(--v-theme-secondary), 0.16), transparent 72%),
    radial-gradient(620px 300px at 92% 0%, rgba(var(--v-theme-secondary), 0.07), transparent 72%);
}
</style>

<!-- Shared by the docs pages. Each rule covers what no Vuetify prop or utility reaches. -->
<style>
/* Accessibility: where blur is missing or unwanted, the glass is plain surface. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .docs-glass {
    background: rgb(var(--v-theme-surface)) !important;
  }
}

@media (prefers-reduced-transparency: reduce) {
  .docs-glass {
    background: rgb(var(--v-theme-surface)) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
}

/* The reading size sits between two Vuetify type steps. */
.docs-body {
  font-size: 0.9375rem;
  line-height: 1.6;
}

/* Deep links land under the sticky app bar. */
.docs-row {
  scroll-margin-top: 128px;
}

@media (min-width: 840px) {
  .docs-row {
    scroll-margin-top: 72px;
  }
}

/* The code stays in view while its section scrolls by. */
@media (min-width: 1145px) {
  .docs-cards--held {
    position: sticky;
    top: 88px;
    max-height: calc(100vh - 104px);
    overflow-y: auto;
  }
}

/* Inline code in authored text and rendered markdown. */
.docs-body :not(pre) > code {
  font-family: monospace;
  font-size: 0.875em;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  overflow-wrap: anywhere;
}

/* The app styles every link in main with !important: these rules answer it. */
.v-application main .docs-shell a.v-list-item {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity)) !important;
  text-decoration: none !important;
}

.v-application main .docs-shell a.v-list-item:hover,
.v-application main .docs-shell a.v-list-item--active,
.v-application main .docs-shell a.v-list-item[aria-current] {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)) !important;
}

.v-application main .docs-shell a.v-card {
  color: inherit !important;
  text-decoration: none !important;
}

.v-application main .docs-body a:not(.v-btn, .v-card, .v-list-item) {
  color: inherit !important;
  text-decoration: underline !important;
  text-decoration-color: rgb(var(--v-theme-primary)) !important;
  text-underline-offset: 3px;
}
</style>
