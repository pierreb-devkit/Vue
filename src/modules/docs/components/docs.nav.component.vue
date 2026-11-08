<template>
  <nav
    class="docs-nav d-flex flex-column ga-1 position-sticky mt-n8 pt-13 pe-3 border-e"
    :style="railPlace"
    aria-label="Documentation"
    data-test="docs-nav"
  >
    <DocsSearch block data-test="docs-nav-search" />

    <div ref="navRef" class="flex-1-1-0 overflow-y-auto mx-n1 px-1 pt-1 pb-4" style="min-height: 0">
      <v-list
        v-model:opened="opened"
        open-strategy="single"
        density="compact"
        bg-color="transparent"
        nav
        slim
        indent="0"
        expand-icon="fa-solid fa-chevron-right"
        collapse-icon="fa-solid fa-chevron-down"
        class="pa-0"
      >
        <v-list-item to="/docs" exact :title="homeTitle" v-bind="ROW" data-test="docs-nav-home" />

        <!-- The API reference route is hidden from the main sidenav: this is its entry point. -->
        <v-list-item to="/docs/api" :title="referenceTitle" v-bind="ROW" data-test="docs-nav-reference" />
        <DocsNavSections v-if="onReference && sections.length" :sections="sections" :active-id="activeId" />

        <v-list-group v-for="category in categories" :key="category.slug" :value="category.slug" data-test="docs-nav-category">
          <template #activator="{ props: group, isOpen: groupOpen }">
            <v-list-item
              v-bind="{ ...group, ...ROW }"
              :title="category.title"
              :aria-expanded="groupOpen"
              class="font-weight-medium"
              data-test="docs-nav-group"
            />
          </template>
          <template v-for="article in category.articles" :key="article.slug">
            <v-list-item
              :to="`/docs/${category.slug}/${article.slug}`"
              :title="article.title"
              v-bind="ROW"
              data-test="docs-nav-article"
            />
            <DocsNavSections v-if="isOpen(article)" :sections="sections" :active-id="activeId" />
          </template>
        </v-list-group>
      </v-list>

      <v-alert
        v-if="!categories.length"
        type="info"
        variant="tonal"
        density="compact"
        data-test="docs-nav-empty"
      >
        No guides yet.
      </v-alert>
    </div>
  </nav>
</template>

<script setup>
/**
 * Persistent left sidebar for the docs surface.
 *
 * Renders the backend guide tree grouped by category (contract order: each
 * category and its articles sorted by `order`). The active article is
 * highlighted by Vuetify's `v-list-item` router-link active state, so deep
 * navigation stays in sync; the current page's sections open under it.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDocsStore } from '../stores/docs.store';
import { sortedCategories } from '../composables/useDocsNav';
import DocsSearch from './docs.search.component.vue';
import DocsNavSections from './docs.navsections.component.vue';
import config from '@/config';

const props = defineProps({
  /** The current page's sections: `{ id, nav, group? }`. */
  sections: { type: Array, default: () => [] },
  /** The current section's id. */
  activeId: { type: String, default: null },
});

/** One rail row. */
const ROW = { minHeight: 28, rounded: 'lg', class: 'px-3 py-0 my-0' };

/** The rail hangs from the app bar and runs to the bottom of the window. */
const railPlace = { top: 'var(--v-layout-top, 0px)', height: 'calc(100vh - var(--v-layout-top, 0px))' };

const store = useDocsStore();

const homeTitle = computed(() => config?.docs?.home?.title || 'Documentation');
const referenceTitle = computed(() => config?.docs?.reference?.title || 'API reference');

const categories = computed(() => sortedCategories(store.tree));

const route = useRoute();
const navRef = ref(null);
const onReference = computed(() => route?.path === '/docs/api');

/**
 * Whether this article is the current page and has sections to open.
 * @param {{slug: string}} article - An article of the tree
 * @returns {boolean} True when its sections show under it
 */
const isOpen = (article) => route?.params?.slug === article.slug && props.sections.length > 0;

/** The one open group: opened by hand, or by arriving on one of its guides. */
const opened = ref([]);

/** Arriving on a guide opens its group; a page outside the groups opens the first one. */
watch(
  () => [route?.params?.category, categories.value[0]?.slug],
  ([current, first]) => {
    opened.value = current || first ? [current || first] : [];
  },
  { immediate: true },
);

/**
 * Keep the current entry visible in the rail, which scrolls on its own. Sets the
 * rail's scrollTop rather than scrollIntoView, which would also scroll the page.
 */
const keepActiveVisible = () => {
  const nav = navRef.value;
  const active = nav?.querySelector?.('[aria-current="location"]')
    || nav?.querySelector?.('.v-list-item--active');
  if (!active) return;
  const top = active.getBoundingClientRect().top - nav.getBoundingClientRect().top;
  if (top < 0 || top > nav.clientHeight - 32) nav.scrollTop += top - nav.clientHeight / 2;
};

watch(
  () => [route?.path, categories.value.length, props.sections.length, props.activeId],
  keepActiveVisible,
  { flush: 'post' },
);
onMounted(keepActiveVisible);
</script>

<style scoped>
/* The rail's 13 px text sits between two Vuetify type steps. */
.docs-nav :deep(.v-list-item-title) {
  font-size: 0.8125rem;
  line-height: 1.3;
  font-weight: inherit;
  white-space: normal;
}

/* Vuetify's list group has no icon size prop. */
.docs-nav :deep(.v-list-item__append .v-icon) {
  font-size: 0.625rem;
}

/* The selected item, the one glass thing in the rail. Vuetify has no glass item. */
.docs-nav :deep(a.v-list-item--active) {
  --docs-pill-edge: rgba(var(--v-theme-surface), 0.75);
  font-weight: 500;
  background:
    linear-gradient(rgba(var(--v-theme-surface), 0.55), rgba(var(--v-theme-surface), 0.15)),
    rgba(var(--v-theme-primary), 0.16);
  box-shadow:
    inset 0 1px 0 var(--docs-pill-edge),
    inset 0 0 0 1px rgba(var(--v-theme-on-surface), 0.06),
    0 4px 12px rgba(var(--v-theme-primary), 0.14);
  backdrop-filter: blur(12px) saturate(1.5);
}

.docs-nav :deep(a.v-list-item--active .v-list-item__overlay) {
  opacity: 0;
}
</style>
