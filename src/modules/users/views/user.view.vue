<template>
  <div>
    <!-- Layout chrome: header + tab bar, guttered with their own container.
         pb-0 collapses the gap below tabs — child router-view supplies its own top padding. -->
    <v-container fluid class="pb-0">
      <CorePageHeaderTabs
        icon="fa-solid fa-user"
        title="Account"
        :tabs="allTabs"
        :can="userCan"
        :base-path="basePath"
      >
        <template #actions>
          <component :is="action.component" v-for="action in headerActions" :key="action._id" />
        </template>
      </CorePageHeaderTabs>
    </v-container>

    <!-- Active child route renders outside the layout container so each child's
         own root <v-container> provides exactly one gutter (no double-nesting). -->
    <router-view />
  </div>
</template>

<script>
import { ability } from '../../../lib/helpers/ability';
import { useUserHeaderActions } from '../../../lib/composables/useUserHeaderActions';
import CorePageHeaderTabs from '../../core/components/core.pageHeaderTabs.component.vue';

export default {
  name: 'UserView',
  components: { CorePageHeaderTabs },
  /**
   * @desc Reads the account-header-actions registry (see
   *       `useUserHeaderActions`) so the users module renders whatever
   *       optional modules have registered (e.g. the organizations switcher,
   *       via `organizations.headerAction.component.vue`) without importing
   *       them directly. The on-login organizations pre-load previously
   *       owned by this view's `isLoggedIn` watcher now lives in that
   *       registrar component.
   * @returns {{ headerActions: import('vue').Ref<Array> }}
   */
  setup() {
    const { extras: headerActions } = useUserHeaderActions();
    return { headerActions };
  },
  computed: {
    /**
     * @desc Base path for CoreSurfaceTabBar tab route resolution.
     * @returns {string}
     */
    basePath() {
      return '/users';
    },
    /**
     * @desc Merged account tab list (built-in + module-contributed extras),
     *       passed to CoreSurfaceTabBar. Mirrors `admin.layout.vue`'s
     *       built-in ∪ config.admin.tabs merge: `config.users.tabs` holds the
     *       core tabs (Profile, Organizations) while optional modules append to
     *       `config.users.extraTabs` (a separate key — generateConfig's
     *       deepMerge REPLACES arrays, so a module fragment cannot push onto
     *       `users.tabs` without clobbering the base set). Validation + CASL
     *       filtering happen inside the bar via `resolveSurfaceTabs`.
     * @returns {Array<object>}
     */
    allTabs() {
      const tabs = Array.isArray(this.config?.users?.tabs) ? this.config.users.tabs : [];
      const extras = Array.isArray(this.config?.users?.extraTabs) ? this.config.users.extraTabs : [];
      return [...tabs, ...extras];
    },
    /**
     * @desc CASL predicate passed to CoreSurfaceTabBar. Account tabs (Profile,
     *       Organizations) are gated upstream by the parent route's
     *       `requiresAuth + action:'read' + subject:'User'`; this predicate
     *       provides fine-grained tab visibility for any downstream-injected
     *       extras. Falls back to allow-all when ability is not yet loaded.
     * @returns {(action: string, subject: string) => boolean}
     */
    userCan() {
      return (action, subject) => (ability ? ability.can(action, subject) : true);
    },
  },
};
</script>
