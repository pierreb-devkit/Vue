<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-user-tie" title="Admin" />
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
      ><span class="text-body-medium">{{ error }}</span></v-alert
    >
    <v-tabs v-model="activeTab" color="primary" class="px-2">
      <v-tab
        v-for="tab in builtInTabs"
        :key="tab.value"
        :to="tabTo(tab)"
        :value="tabTo(tab)"
        class="text-none text-body-medium"
        ><v-icon :icon="tab.icon" size="small" class="mr-2"></v-icon>{{ tab.label }}</v-tab
      >
      <v-tab
        v-for="extraTab in extraTabs"
        :key="extraTab.value"
        :to="tabTo(extraTab)"
        :value="tabTo(extraTab)"
        class="text-none text-body-medium"
        ><v-icon v-if="extraTab.icon" :icon="extraTab.icon" size="small" class="mr-2"></v-icon
        >{{ extraTab.label }}</v-tab
      >
    </v-tabs>
    <router-view />
    <v-alert
      v-if="showMailerWarning"
      type="warning"
      variant="tonal"
      density="compact"
      class="mx-2 mt-4"
      :class="config.vuetify.theme.rounded"
      icon="fa-solid fa-triangle-exclamation"
      ><span class="text-body-medium"
        >No mailer configured. Users can register with any email without verification. Set up SMTP to enable email verification.</span
      ></v-alert
    >
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import { useAdminStore } from '../stores/admin.store';
import { useAuthStore } from '../../auth/stores/auth.store';

/**
 * Built-in admin tabs.
 *
 * Each entry maps to a routed child of the admin parent route (see
 * `admin.router.js`). They are rendered inline alongside the extras from
 * `config.admin.tabs` to form a single flat tab bar.
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
 * `admin.layout.vue` is the parent layout component for the admin section.
 * It renders the page header, a single flat tab bar (built-in Users /
 * Organizations / Readiness / Activity + extras from `config.admin.tabs`)
 * and a `<router-view>` that hosts the active child:
 *
 *  - Built-in tabs (`/admin/users`, `/admin/organizations`, …) are routed
 *    children defined in `admin.router.js`.
 *  - User / Organization detail views (`/admin/users/:id`, …) are also
 *    children — they deep-link inside the layout.
 *  - Any child route injected via `injectAdminChildren` (downstream tabs)
 *    renders through the same `<router-view>`.
 *
 * Extra tabs are config-driven; their `route` may be relative (preferred,
 * e.g. `'knowledge'`) or a legacy absolute path (`'/admin/knowledge'`).
 * Both are supported — relative is resolved against `/admin/`.
 *
 * Global concerns (error banner, mailer warning) are rendered here so
 * they stay visible across all admin tabs, including downstream extras.
 */
export default {
  name: 'AdminLayout',
  components: { PageHeader },
  data() {
    return {
      activeTab: '/admin/users',
      builtInTabs: BUILT_IN_TABS,
    };
  },
  computed: {
    /**
     * @desc Base path for the admin layout. Kept configurable so a downstream
     *       project could remount the layout under a different prefix.
     * @returns {string}
     */
    basePath() {
      return '/admin';
    },
    /**
     * @desc Global error from the admin store (surfaced on any admin tab).
     * @returns {string|null}
     */
    error() {
      return useAdminStore().error;
    },
    /**
     * @desc Whether to show the mailer warning across admin tabs.
     * @returns {boolean}
     */
    showMailerWarning() {
      return useAuthStore().serverConfig?.mail?.configured === false;
    },
    /**
     * @desc Returns validated extra admin tabs from `config.admin.tabs`.
     *
     * Accepted shapes (in preference order):
     *  - **Relative path** (new): `'knowledge'`, `'billing'`, …
     *    No leading slash, non-empty, no `..` traversal segments, no
     *    `?`/`#`, no whitespace.
     *  - **Legacy absolute under /admin/**: `'/admin/knowledge'` — still
     *    works during the migration but logs a dev-mode warning.
     *
     * Anything else (absolute routes outside `/admin/`, malformed entries,
     * path traversal, empty strings) is filtered out silently in
     * production and with a dev-mode warning otherwise.
     *
     * @returns {Array<{ value: string, label: string, icon?: string, route: string }>}
     */
    extraTabs() {
      const tabs = this.config?.admin?.tabs;
      if (!Array.isArray(tabs)) return [];
      return tabs.filter((tab) => this.isValidTab(tab));
    },
  },
  watch: {
    /**
     * @desc Keep `activeTab` in sync with the current route so the tab
     *       indicator stays correct across deep-links and back/forward.
     */
    $route: {
      immediate: true,
      handler(to) {
        if (!to || typeof to.path !== 'string') return;
        this.activeTab = this.resolveActiveTab(to.path);
      },
    },
  },
  methods: {
    /**
     * @desc Clear the global admin error banner.
     */
    clearError() {
      useAdminStore().error = null;
    },
    /**
     * @desc Validate a single tab descriptor (shared by `extraTabs`).
     * @param {unknown} tab - Raw entry from `config.admin.tabs`.
     * @returns {boolean} True if the tab should render.
     */
    isValidTab(tab) {
      if (!tab || typeof tab !== 'object' || !tab.value || !tab.label || !tab.route) return false;
      if (typeof tab.route !== 'string') return false;
      const route = tab.route;
      // Reject whitespace, query, fragment, or traversal segments.
      if (/\s/.test(route) || route.includes('?') || route.includes('#')) {
        if (import.meta.env?.MODE !== 'production') {
          console.warn(`[admin] Invalid tab route filtered: "${route}"`);
        }
        return false;
      }
      if (route === '' || route === '/' || route === '.' || route === '..') {
        if (import.meta.env?.MODE !== 'production') {
          console.warn(`[admin] Empty or dot tab route filtered: "${route}"`);
        }
        return false;
      }
      const segments = route.split('/');
      if (segments.some((seg) => seg === '..' || seg === '.')) {
        if (import.meta.env?.MODE !== 'production') {
          console.warn(`[admin] Path-traversal tab route filtered: "${route}"`);
        }
        return false;
      }
      // Relative path (preferred).
      if (!route.startsWith('/')) return true;
      // Absolute path — only legacy `/admin/*` is allowed (with a warning).
      if (route.startsWith('/admin/')) {
        if (import.meta.env?.MODE !== 'production') {
          console.warn(`[admin] Legacy absolute tab route "${route}" — migrate to a relative path (see MIGRATIONS.md)`);
        }
        return true;
      }
      if (import.meta.env?.MODE !== 'production') {
        console.warn(`[admin] Invalid tab route filtered: "${route}"`);
      }
      return false;
    },
    /**
     * @desc Resolve a tab descriptor to a concrete absolute path.
     *       Relative paths are joined under `/admin/`.
     * @param {{ route: string }} tab - The tab descriptor.
     * @returns {string} Absolute path the `<v-tab>` should link to.
     */
    tabTo(tab) {
      if (tab.route.startsWith('/')) return tab.route;
      return `${this.basePath}/${tab.route}`.replace(/\/+/g, '/');
    },
    /**
     * @desc Map a router path to the `v-tab` value it should activate.
     *       Prefix-match across built-in + extra tabs, longest-match wins
     *       so detail routes (e.g. `/admin/users/abc`) still light up the
     *       parent tab (`/admin/users`).
     * @param {string} path - Current route path.
     * @returns {string} The matching tab's `value` (absolute path).
     */
    resolveActiveTab(path) {
      const candidates = [...this.builtInTabs, ...this.extraTabs].map((tab) => this.tabTo(tab));
      const match = candidates
        .filter((to) => path === to || path.startsWith(`${to}/`))
        .sort((a, b) => b.length - a.length)[0];
      return match || `${this.basePath}/users`;
    },
  },
};
</script>
