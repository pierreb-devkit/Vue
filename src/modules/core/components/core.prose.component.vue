<!--
  CoreProseComponent
  ==================
  The one stylesheet for rendered markdown (marked + DOMPurify output), which
  cannot take Vuetify classes. Wrap the rendered HTML in it; theme tokens only,
  so light and dark both work.

  USAGE:
  <CoreProseComponent tag="article" class="my-page-prose">
    <VMarkdown :source="markdown" />
  </CoreProseComponent>

  PROPS:
  - tag (String, default 'div'): root element
-->
<template>
  <component :is="tag" class="core-prose">
    <slot></slot>
  </component>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'CoreProseComponent',
  props: {
    tag: {
      type: String,
      default: 'div',
    },
  },
};
</script>

<style scoped>
/* Everything below styles rendered markdown, which cannot take Vuetify classes. */
.core-prose {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.core-prose :deep(p),
.core-prose :deep(ul),
.core-prose :deep(ol) {
  margin-block: 0 12px;
}

.core-prose :deep(ul),
.core-prose :deep(ol) {
  padding-inline-start: 20px;
}

.core-prose :deep(li) {
  margin-bottom: 8px;
  padding-inline-start: 4px;
}

.core-prose :deep(li::marker) {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.core-prose :deep(strong) {
  font-weight: 600;
}

.core-prose :deep(h2) {
  font-size: 1.375rem;
  line-height: 1.3;
  font-weight: 500;
  margin-block: 40px 8px;
}

.core-prose :deep(h3) {
  font-size: 1rem;
  line-height: 1.4;
  font-weight: 500;
  margin-block: 24px 8px;
}

.core-prose :deep(pre code) {
  padding: 0;
  background: none;
  font-size: inherit;
}

.core-prose :deep(pre.hljs) {
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

/*
 * The table sizes and wraps like any normal block table (no `width:
 * max-content` — that would force every cell onto one line, so a prose
 * column never wraps and even a short table goes wide). It keeps its native
 * `display: table` — overriding it (e.g. `display: block`) can strip table
 * semantics from the accessibility tree in some browser/screen-reader
 * combinations. A wrapper that scrolls sideways is the caller's job.
 */
.core-prose :deep(table) {
  border-collapse: collapse;
  width: 100%;
  line-height: 1.5;
}

/* Ledger tables: rows only, no boxes and no filled header. */
.core-prose :deep(th),
.core-prose :deep(td) {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 10px 24px 10px 0;
  vertical-align: top;
}

.core-prose :deep(th:last-child),
.core-prose :deep(td:last-child) {
  padding-inline-end: 0;
}

/*
 * A column-aligned header (marked's `:-:` / `--:` syntax emits `align="..."`)
 * must keep the browser's attribute-driven alignment — an unconditional
 * `text-align` here would override it, so every column would render
 * left-aligned regardless of the markdown source. Left-align only the
 * headers with NO explicit alignment (browsers default a bare `<th>` to
 * `center`, which would otherwise mismatch the left-aligned body cells).
 */
.core-prose :deep(th:not([align])) {
  text-align: start;
}

.core-prose :deep(thead th) {
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.3);
}

/* A name in a table breaks at its hyphens only, never inside a word. */
.core-prose :deep(td code) {
  overflow-wrap: normal;
}

/* The first column is the key you look for: bare code on one line. */
.core-prose :deep(td:first-child code) {
  padding: 0;
  background: none;
  font-weight: 500;
}

@media (min-width: 600px) {
  .core-prose :deep(td:first-child code) {
    white-space: nowrap;
  }
}
</style>
