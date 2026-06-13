<template>
  <v-container fluid class="pb-0">
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mx-2 mt-2"
      :class="config.vuetify.theme.rounded"
      icon="fa-solid fa-circle-exclamation"
      @click:close="clearError"
    >
      <span class="text-body-medium">{{ error }}</span>
    </v-alert>

    <CorePageHeaderTabs
      icon="fa-solid fa-user-tie"
      :title="currentBreadcrumb ? '' : 'Admin'"
      :tabs="allTabs"
      :can="adminCan"
      :base-path="basePath"
      :hide-tabs="!!currentBreadcrumb"
    >
      <template v-if="currentBreadcrumb" #breadcrumb>
        <router-link to="/admin" class="text-medium-emphasis text-decoration-none">Admin</router-link>
        <v-icon icon="fa-solid fa-chevron-right" size="x-small" class="mx-2 text-medium-emphasis"></v-icon>
        <span :class="currentBreadcrumb.titleClass || ''">{{ currentBreadcrumb.title }}</span>
      </template>
    </CorePageHeaderTabs>
  </v-container>

  <router-view />
</template>
<script>
/**
 * Module dependencies.
 */
import CorePageHeaderTabs from '../../core/components/core.pageHeaderTabs.component.vue';
import { ability } from '../../../lib/helpers/ability';
import { useAdminStore } from '../stores/admin.store';

/**
 * Built-in admin tabs (canonical). Downstream apps may add more via
 * `config.admin.tabs` — both are merged and passed to CoreSurfaceTabBar,
 * which validates + CASL-filters internally.
 */
const BUILT_IN_TABS = Object.freeze([
  { value: 'users', label: 'Users', icon: 'fa-solid fa-users', route: 'users' },
  { value: 'organizations', label: 'Organizations', icon: 'fa-solid fa-building', route: 'organizations' },
  { value: 'readiness', label: 'Readiness', icon: 'fa-solid fa-clipboard-check', route: 'readiness' },
  { value: 'activity', label: 'Activity', icon: 'fa-solid fa-clock-rotate-left', route: 'activity' },
]);

/**
 * Component definition.
 *
 * `admin.layout.vue` is the parent layout for the admin section. It renders an
 * error banner, a page header that either shows the admin tab bar (list-page
 * mode) or a breadcrumb pushed by a sub-view (detail-page mode), and a
 * `<router-view>` for nested children. Mailer readiness is reported by the
 * Readiness tab only — no layout-level banner.
 *
 * Tab rendering is delegated to `CoreSurfaceTabBar` (the same primitive used
 * by `user.view.vue` and `organization.detail.component.vue`) — full chrome
 * convergence across Account / Organization / Admin surfaces. The tab bar
 * receives the canonical built-in tabs merged with any downstream extras from
 * `config.admin.tabs`; validation + CASL gating happen inside the bar.
 */
export default {
  name: 'AdminLayout',
  components: { CorePageHeaderTabs },
  computed: {
    /**
     * @desc Base path for admin tabs (where CoreSurfaceTabBar resolves relative routes).
     * @returns {string}
     */
    basePath() {
      return '/admin';
    },
    /**
     * @desc Global error from the admin store (surfaced as a banner above the header).
     * @returns {string|null}
     */
    error() {
      return useAdminStore().error;
    },
    /**
     * @desc Current breadcrumb published by an admin sub-view via
     *       `useAdminStore().setBreadcrumb(...)`. When set, the layout renders
     *       a breadcrumb in the header instead of the tab bar.
     * @returns {{ title: string, titleClass?: string } | null}
     */
    currentBreadcrumb() {
      return useAdminStore().currentBreadcrumb;
    },
    /**
     * @desc Merged tab list (built-in + config-driven extras), passed to
     *       CoreSurfaceTabBar. Validation and CASL filtering happen inside
     *       the bar via `resolveSurfaceTabs`.
     * @returns {Array<object>}
     */
    allTabs() {
      const extras = Array.isArray(this.config?.admin?.tabs) ? this.config.admin.tabs : [];
      return [...BUILT_IN_TABS, ...extras];
    },
    /**
     * @desc Reactive CASL predicate passed to CoreSurfaceTabBar. Falls back
     *       to allow-all when ability is not yet loaded (consistent with the
     *       user view's `userCan`).
     * @returns {(action: string, subject: string) => boolean}
     */
    adminCan() {
      return (action, subject) => (ability ? ability.can(action, subject) : true);
    },
  },
  methods: {
    /**
     * @desc Clear the global admin error banner.
     * @returns {void}
     */
    clearError() {
      useAdminStore().error = null;
    },
  },
};
</script>
