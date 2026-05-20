<template>
  <div>
    <!-- Layout chrome: header + tab bar, guttered with their own container -->
    <v-container fluid>
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
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import CoreSurfaceTabBar from '../../core/components/core.surfaceTabBar.component.vue';
import organizationsSwitcherComponent from '../../organizations/components/organizations.switcher.component.vue';

export default {
  name: 'UserView',
  components: { PageHeader, CoreSurfaceTabBar, organizationsSwitcherComponent },
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
  },
};
</script>
