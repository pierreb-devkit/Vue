<script setup>
import { computed } from 'vue';
import { resolveSurfaceTabs } from '@/lib/helpers/surface-tabs';

/**
 * SurfaceTabBar — a cosmetic tab strip that renders only the tabs allowed by
 * reactive CASL. Filtering is done via `resolveSurfaceTabs`, which validates
 * descriptors AND applies the `can` predicate.
 *
 * Decoupling contract: this component does NOT import CASL/ability itself.
 * The parent owns the ability source and passes `can` as a prop. The computed
 * getter re-evaluates automatically whenever `tabs` or `can` change — no
 * remount needed.
 */
const props = defineProps({
  /** Raw tab descriptors from config. */
  tabs: {
    type: Array,
    default: () => [],
  },
  /**
   * Reactive CASL `ability.can` predicate from the host view.
   * Must be a function — `resolveSurfaceTabs` throws TypeError otherwise.
   */
  can: {
    type: Function,
    required: true,
  },
  /** Base path for tab routes, e.g. /users/organizations/:id */
  basePath: {
    type: String,
    required: true,
  },
});

const visibleTabs = computed(() => resolveSurfaceTabs(props.tabs, props.can));
</script>

<template>
  <v-tabs>
    <v-tab v-for="t in visibleTabs" :key="t.value" :to="`${basePath}/${t.route}`">
      <v-icon v-if="t.icon" :icon="t.icon" class="mr-2" />
      {{ t.label }}
    </v-tab>
  </v-tabs>
</template>
