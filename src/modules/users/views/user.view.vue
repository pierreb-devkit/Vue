<template>
  <div>
    <!-- Layout chrome: header + tab bar, guttered with their own container.
         pb-0 collapses the gap below tabs — child router-view supplies its own top padding. -->
    <v-container fluid class="pb-0">
      <PageHeader icon="fa-solid fa-user" title="Account">
        <template #actions>
          <organizationsSwitcherComponent />
        </template>
      </PageHeader>
      <!-- Tab bar (config-driven, CASL-gated) -->
      <CoreSurfaceTabBar
        :tabs="config.users.tabs"
        :can="userCan"
        :base-path="basePath"
      />
    </v-container>

    <!-- Active child route renders outside the layout container so each child's
         own root <v-container> provides exactly one gutter (no double-nesting). -->
    <router-view />
  </div>
</template>

<script>
import { ability } from '../../../lib/helpers/ability';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import CoreSurfaceTabBar from '../../core/components/core.surfaceTabBar.component.vue';
import organizationsSwitcherComponent from '../../organizations/components/organizations.switcher.component.vue';

export default {
  name: 'UserView',
  components: { PageHeader, CoreSurfaceTabBar, organizationsSwitcherComponent },
  /**
   * @desc Wires auth + organizations stores for the layout-level isLoggedIn
   *       watcher. The watcher mirrors the pre-Gamma fetch behavior: it pre-
   *       loads organizations as soon as auth flips to logged-in, so deep-links
   *       into /users/organizations don't race the child view's own fetch
   *       (which would leave the v-list empty on first paint).
   * @returns {{ authStore: Object, organizationsStore: Object }}
   */
  setup() {
    return {
      authStore: useAuthStore(),
      organizationsStore: useOrganizationsStore(),
    };
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
    /**
     * @desc Convenience read used by the watcher.
     * @returns {boolean}
     */
    isLoggedIn() {
      return this.authStore.isLoggedIn;
    },
  },
  watch: {
    /**
     * @desc Pre-load organizations as soon as auth flips to logged-in. Mirrors
     *       the pre-Gamma layout behavior so deep-links into the Organizations
     *       child view don't paint an empty list while the child's own fetch
     *       is still in flight. `immediate: true` ensures the load fires on
     *       layout mount, not only on subsequent auth changes.
     */
    isLoggedIn: {
      immediate: true,
      async handler(loggedIn) {
        if (!loggedIn) return;
        await this.organizationsStore.fetchOrganizations().catch(() => {});
      },
    },
  },
};
</script>
