<template>
  <nav
    v-if="entries.length"
    class="docs-toc"
    aria-label="On this page"
    data-test="docs-toc"
  >
    <p class="text-overline text-medium-emphasis mb-2">On this page</p>
    <ul class="docs-toc__list">
      <li
        v-for="entry in entries"
        :key="entry.id"
        :class="`docs-toc__item--h${entry.level}`"
      >
        <a
          :href="`#${entry.id}`"
          class="docs-toc__link text-medium-emphasis"
          data-test="docs-toc-link"
        >{{ entry.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
/**
 * Right-rail table of contents.
 *
 * Renders the h2/h3 heading anchors collected by `useDocsPage` (the same render
 * pipeline `<VMarkdown>` uses — no second renderer). Deep-links via `#id`; the
 * article view offsets `scroll-margin-top` so anchors clear the sticky header.
 */
import { computed } from 'vue';

const props = defineProps({
  /** Heading entries: `[{ id, text, level }]` (level 2 or 3). */
  toc: {
    type: Array,
    default: () => [],
  },
});

const entries = computed(() => (Array.isArray(props.toc) ? props.toc : []));
</script>

<style scoped>
.docs-toc {
  position: sticky;
  top: 88px;
}

.docs-toc__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.docs-toc__item--h3 {
  padding-left: 12px;
}

.docs-toc__link {
  display: block;
  padding: 4px 0;
  font-size: 0.875rem;
  text-decoration: none;
  line-height: 1.3;
}

.docs-toc__link:hover {
  text-decoration: underline;
  color: rgb(var(--v-theme-primary));
}
</style>
