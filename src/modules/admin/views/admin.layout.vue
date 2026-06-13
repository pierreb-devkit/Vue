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
     * @desc Number of readiness checks that are not OK — drives the badge
     *       on the built-in Readiness tab.
     * @returns {number}
     */
    readinessWarnings() {
      const checks = useAdminStore().readiness;
      if (!Array.isArray(checks)) return 0;
      return checks.filter((c) => c && c.status !== 'ok').length;
    },
    /**
     * @desc Merged tab list (built-in + config-driven extras), passed to
     *       CoreSurfaceTabBar. Validation and CASL filtering happen inside
     *       the bar via `resolveSurfaceTabs`. The built-in Readiness tab is
     *       decorated with an optional numeric `badge` (non-ok check count)
     *       that CoreSurfaceTabBar renders as a small warning chip.
     * @returns {Array<object>}
     */
    allTabs() {
      const extras = Array.isArray(this.config?.admin?.tabs) ? this.config.admin.tabs : [];
      const tabs = [...BUILT_IN_TABS, ...extras];
      if (this.readinessWarnings > 0) {
        return tabs.map((t) => (t.value === 'readiness' ? { ...t, badge: this.readinessWarnings } : t));
      }
      return tabs;
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
  mounted() {
    // Readiness data feeds the tab badge. The readiness view fetches on its
    // own mount, and child mounted() runs BEFORE the parent's — so when the
    // user lands directly on /admin/readiness a request is already in
    // flight and an empty-store check alone would still double-hit
    // GET /admin/readiness. Skip that route entirely; everywhere else,
    // fetch once iff the store has no readiness data yet (fire-and-forget;
    // the store sanitizes failures into its own `error` state).
    if (this.$route?.path?.startsWith('/admin/readiness')) return;
    const adminStore = useAdminStore();
    if (!Array.isArray(adminStore.readiness) || adminStore.readiness.length === 0) {
      adminStore.getReadiness();
    }
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
