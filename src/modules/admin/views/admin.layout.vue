<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-user-tie" title="Admin" />
    <v-tabs v-model="activeTab" color="primary" class="px-2">
      <v-tab :to="basePath" :value="basePath" exact class="text-none text-body-medium"
        ><v-icon icon="fa-solid fa-gauge-high" size="small" class="mr-2"></v-icon>General</v-tab
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
  </v-container>
</template>
<script>
/**
 * Module dependencies.
 */
import PageHeader from '../../core/components/core.pageHeader.component.vue';

/**
 * Component definition.
 *
 * `admin.layout.vue` is the parent layout component for the admin section.
 * It renders the page header plus the top-level tab bar (General + extra
 * tabs from `config.admin.tabs`) and a `<router-view>` that hosts:
 *
 *  - The base "General" route → `admin.content.vue` (Users / Orgs / ...)
 *  - User / Organization detail views (`/admin/users/:id`, ...)
 *  - Any child route injected via `injectAdminChildren` (downstream tabs)
 *
 * Extra tabs are config-driven; their `route` may be relative (preferred,
 * e.g. `'knowledge'`) or a legacy absolute path (`'/admin/knowledge'`).
 * Both are supported — relative is resolved against `/admin/`.
 */
export default {
  name: 'AdminLayout',
  components: { PageHeader },
  data() {
    return {
      activeTab: '/admin',
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
     * @param {{ route: string }} tab - The extra tab descriptor.
     * @returns {string} Absolute path the `<v-tab>` should link to.
     */
    tabTo(tab) {
      if (tab.route.startsWith('/')) return tab.route;
      return `${this.basePath}/${tab.route}`.replace(/\/+/g, '/');
    },
    /**
     * @desc Map a router path to the `v-tab` value it should activate.
     *       Exact-match for the base path, then prefix-match for extra
     *       tabs. Falls back to the base path so the indicator never
     *       leaves a visible tab empty.
     * @param {string} path - Current route path.
     * @returns {string} The matching tab's `value`.
     */
    resolveActiveTab(path) {
      if (path === this.basePath) return this.basePath;
      const match = this.extraTabs
        .map((tab) => this.tabTo(tab))
        .find((to) => path === to || path.startsWith(`${to}/`));
      return match || this.basePath;
    },
  },
};
</script>
