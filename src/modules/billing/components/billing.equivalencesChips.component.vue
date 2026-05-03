<!--
  BillingEquivalencesChipsComponent
  ===================================
  Primitive Vuetify v-chip list rendering equivalence entries color-coded by kind.

  USAGE:
  <BillingEquivalencesChipsComponent
    :equivalences="[
      { kind: 'easy', count: 500, label: 'light operations / week' },
      { kind: 'hard', count: 50, label: 'heavy operations / week' },
      { kind: 'feature', count: 3, label: 'integrations' },
    ]"
  />

  PROPS:
  - equivalences (Array, required): Array of { kind: 'easy'|'hard'|'feature', count: number, label: string }

  Kind → color mapping:
  - easy    → success (green)  — lightweight / fast operations
  - hard    → warning (amber)  — compute-heavy operations
  - feature → primary (brand)  — feature entitlements
-->
<template>
  <div class="d-flex flex-wrap ga-2" role="list">
    <v-chip
      v-for="(eq, i) in equivalences"
      :key="`${eq.kind}-${i}`"
      :color="colorForKind(eq.kind)"
      :prepend-icon="iconForKind(eq.kind)"
      variant="tonal"
      density="comfortable"
      role="listitem"
    >
      {{ eq.count }} {{ eq.label }}
    </v-chip>
  </div>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'BillingEquivalencesChipsComponent',

  props: {
    /**
     * @desc Structured equivalences to render as chips.
     * Each entry must have { kind: 'easy'|'hard'|'feature', count: number, label: string }.
     */
    equivalences: {
      type: Array,
      required: true,
      validator: (arr) =>
        arr.every(
          (e) =>
            e &&
            typeof e.label === 'string' &&
            typeof e.count === 'number' &&
            ['easy', 'hard', 'feature'].includes(e.kind),
        ),
    },
  },

  methods: {
    /**
     * @desc Map a kind to its Vuetify color token.
     * @param {'easy'|'hard'|'feature'} kind
     * @returns {string} Vuetify color name
     */
    colorForKind(kind) {
      return { easy: 'success', hard: 'warning', feature: 'primary' }[kind] || 'default';
    },
    /**
     * @desc Map a kind to its Font Awesome icon string (FA iconset required).
     * @param {'easy'|'hard'|'feature'} kind
     * @returns {string} Icon identifier
     */
    iconForKind(kind) {
      return (
        { easy: 'fa-solid fa-bolt', hard: 'fa-solid fa-fire', feature: 'fa-solid fa-check' }[kind] || 'fa-solid fa-circle'
      );
    },
  },
};
</script>
