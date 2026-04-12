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
      activeTab: null,
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
     *       Accepts both relative (`'knowledge'`) and legacy absolute
     *       (`'/admin/knowledge'`) routes. Legacy absolute routes outside
     *       of `/admin/` are filtered and warned about in non-production.
     * @returns {Array<{ value: string, label: string, icon?: string, route: string }>}
     */
    extraTabs() {
      const tabs = this.config?.admin?.tabs;
      if (!Array.isArray(tabs)) return [];
      return tabs.filter((tab) => {
        if (!tab || typeof tab !== 'object' || !tab.value || !tab.label || !tab.route) return false;
        if (typeof tab.route !== 'string') return false;
        // Relative path (new) — any non-empty segment without leading slash.
        if (!tab.route.startsWith('/')) return true;
        // Absolute path (legacy) — must be nested under /admin/.
        const isValid = tab.route.startsWith('/admin/');
        if (!isValid && import.meta.env.MODE !== 'production') {
          console.warn('[admin] Invalid tab route filtered: "' + tab.route + '"');
        }
        return isValid;
      });
    },
  },
  methods: {
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
  },
};
</script>
