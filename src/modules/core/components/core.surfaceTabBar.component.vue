<script setup>
import { computed } from 'vue';
import { resolveSurfaceTabs } from '@/lib/helpers/surface-tabs';
import { isModuleActive } from '@/lib/helpers/modules';

defineOptions({ name: 'CoreSurfaceTabBar' });

/**
 * SurfaceTabBar — a cosmetic tab strip that renders only the tabs allowed by
 * reactive CASL AND module activation. Filtering is done via
 * `resolveSurfaceTabs`, which validates descriptors, applies the `can`
 * predicate, and hides tabs whose optional `module` field names a
 * deactivated module (`isModuleActive`, config-backed).
 *
 * Decoupling contract: this component does NOT import CASL/ability itself.
 * The parent owns the ability source and passes `can` as a prop. Module
 * activation is config-backed (not ability-backed), so `isModuleActive` is
 * imported directly. The computed getter re-evaluates automatically whenever
 * `tabs` or `can` change — no remount needed.
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

const visibleTabs = computed(() => resolveSurfaceTabs(props.tabs, props.can, isModuleActive));

/**
 * Resolve a tab descriptor to a concrete absolute path.
 * If the route is already absolute (legacy /admin/... passthrough), use it
 * as-is to avoid double-slash when basePath has a trailing slash or when the
 * route was injected with a leading slash.
 * @param {string} route - The tab's route field.
 * @returns {string}
 */
function tabTo(route) {
  // Absolute-route passthrough: legacy routes injected with a leading slash
  // are used verbatim so basePath is not prepended (avoids double-slash).
  if (route.startsWith('/')) return route;
  return `${props.basePath.replace(/\/$/, '')}/${route}`;
}
</script>

<template>
  <v-tabs class="mx-4">
    <v-tab
      v-for="t in visibleTabs"
      :key="t.value"
      :to="tabTo(t.route)"
      :value="tabTo(t.route)"
      class="text-none text-body-medium"
    >
      <v-icon v-if="t.icon" :icon="t.icon" class="mr-2" />
      {{ t.label }}
      <!-- Optional numeric badge on a tab descriptor (e.g. the admin
           readiness warning count). Additive: tabs without a `badge`
           field render exactly as before, so the Account / Organization
           surfaces sharing this component are unaffected. -->
      <v-chip v-if="t.badge > 0" size="small" density="compact" variant="tonal" color="warning" class="ml-1">
        {{ t.badge }}
      </v-chip>
    </v-tab>
  </v-tabs>
</template>
