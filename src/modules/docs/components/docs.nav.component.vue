<template>
  <nav class="docs-nav" aria-label="Documentation" data-test="docs-nav">
    <DocsSearch block class="mb-4" data-test="docs-nav-search" />

    <RouterLink
      to="/docs"
      class="docs-nav__home d-flex align-center ga-2 mb-4 text-none"
      data-test="docs-nav-home"
    >
      <v-icon icon="fa-solid fa-book" size="small" color="primary" />
      <span class="text-title-small font-weight-medium">{{ homeTitle }}</span>
    </RouterLink>

    <!-- Persistent link to the in-theme OpenAPI reference (/docs/api). The route
         is hidden from the MAIN app sidenav (meta.display:false), so this is the
         in-surface entry point. Always shown — the module ships the view. -->
    <v-list
      density="compact"
      bg-color="transparent"
      nav
      class="docs-nav__list py-0 mb-5"
      slim
    >
      <v-list-item
        to="/docs/api"
        :title="referenceTitle"
        :prepend-icon="referenceIcon"
        rounded="lg"
        color="primary"
        class="docs-nav__item text-body-medium"
        data-test="docs-nav-reference"
      />
    </v-list>

    <div
      v-for="category in categories"
      :key="category.slug"
      class="docs-nav__group mb-5"
      data-test="docs-nav-category"
    >
      <p class="docs-nav__heading text-overline text-medium-emphasis mb-1">
        {{ category.title }}
      </p>
      <v-list
        density="compact"
        bg-color="transparent"
        nav
        class="docs-nav__list py-0"
        slim
      >
        <v-list-item
          v-for="article in category.articles"
          :key="article.slug"
          :to="`/docs/${category.slug}/${article.slug}`"
          :title="article.title"
          rounded="lg"
          color="primary"
          class="docs-nav__item text-body-medium"
          data-test="docs-nav-article"
        />
      </v-list>
    </div>

    <v-alert
      v-if="!categories.length"
      type="info"
      variant="tonal"
      density="compact"
      data-test="docs-nav-empty"
    >
      No guides yet.
    </v-alert>
  </nav>
</template>

<script setup>
/**
 * Persistent left sidebar for the docs surface.
 *
 * Renders the backend guide tree grouped by category (contract order: each
 * category and its articles sorted by `order`). The active article is
 * highlighted by Vuetify's `v-list-item` router-link active state (`color`
 * applies when the route matches), so deep navigation stays in sync.
 */
import { computed } from 'vue';
import { useDocsStore } from '../stores/docs.store';
import DocsSearch from './docs.search.component.vue';
import config from '@/config';

const store = useDocsStore();

const homeTitle = computed(() => config?.docs?.home?.title || 'Documentation');
const referenceTitle = computed(() => config?.docs?.reference?.title || 'API reference');
const referenceIcon = computed(() => config?.docs?.reference?.icon || 'fa-solid fa-code');

/**
 * Categories in contract order, each with its articles order-sorted.
 * @returns {Array<{ slug: string, title: string, articles: Array }>}
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
</script>

<style scoped>
.docs-nav {
  position: sticky;
  top: 88px;
}

.docs-nav__home {
  color: rgb(var(--v-theme-on-surface));
}

.docs-nav__heading {
  letter-spacing: 0.06em;
}
</style>
