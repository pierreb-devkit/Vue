<!--
  DocsNavSections
  ===============
  The current page's sections, under its entry in the rail. To stay short, only the
  current branch is open: a group shows its title alone until you reach it, and sub
  sections show under their current parent.
-->
<template>
  <div class="ms-3 mb-1" data-test="docs-nav-sections">
    <template v-for="group in groups" :key="group.title || 'page'">
      <v-list-item
        v-if="group.title"
        :href="`#${group.sections[0].id}`"
        :title="group.title"
        min-height="24"
        rounded="0"
        class="px-3 my-0 border-s-md border-opacity-25 font-weight-medium"
        data-test="docs-nav-section-group"
      />
      <v-list-item
        v-for="(section, i) in group.sections.filter(isShown)"
        :key="`${section.id}-${i}`"
        :href="`#${section.id}`"
        :title="section.nav"
        min-height="24"
        rounded="0"
        class="pe-3 my-0 border-s-md"
        :class="[
          section.depth ? 'ps-6' : 'ps-3',
          section.id === activeId ? 'border-primary border-opacity-100 font-weight-medium' : 'border-opacity-25',
        ]"
        :aria-current="section.id === activeId ? 'location' : undefined"
        data-test="docs-nav-section"
      />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** The sections, in page order: `{ id, nav, group?, depth? }`. */
  sections: { type: Array, required: true },
  /** The current section's id. */
  activeId: { type: String, default: null },
});

/**
 * Sections by group, in page order.
 * @returns {Array<{title: string|undefined, sections: Array}>}
 */
const groups = computed(() => {
  const list = [];
  props.sections.forEach((section) => {
    const last = list[list.length - 1];
    if (last && last.title === section.group) last.sections.push(section);
    else list.push({ title: section.group, sections: [section] });
  });
  return list;
});

/**
 * The current section and the parent it belongs to.
 * @returns {{group: *, parent: string|null}} Current group title and top-level section id
 */
const current = computed(() => {
  let parent = null;
  for (const section of props.sections) {
    if (!section.depth) parent = section.id;
    if (section.id === props.activeId) return { group: section.group, parent };
  }
  return { group: undefined, parent: null };
});

/**
 * Whether a section's link shows: its group is open, and it is top-level or under the
 * current parent.
 * @param {{id: string, group?: string, depth?: number}} section - A section
 * @returns {boolean} True when shown
 */
const isShown = (section) => {
  if (section.group && section.group !== current.value.group) return false;
  if (!section.depth) return true;
  let parent = null;
  for (const other of props.sections) {
    if (!other.depth) parent = other.id;
    if (other === section) break;
  }
  return parent === current.value.parent;
};
</script>
