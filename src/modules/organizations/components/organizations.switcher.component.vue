<template>
  <div v-if="isVisible" class="organizations-switcher">
    <v-menu location="bottom" :close-on-content-click="true">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="text-none text-body-medium px-3"
          color="default"
          size="small"
          :disabled="switching || organizations.length <= 1"
          :loading="switching"
        >
          <orgAvatarComponent :org="currentOrganization" :size="24" class="mr-2" />
          {{ activeName }}
          <v-icon v-if="organizations.length > 1" icon="fa-solid fa-chevron-down" size="x-small" class="ml-2"></v-icon>
        </v-btn>
      </template>
      <v-list
        density="compact"
        class="py-1"
        :class="config.vuetify.theme.rounded"
        min-width="220"
      >
        <v-list-subheader class="text-label-small">SWITCH ORGANIZATION</v-list-subheader>
        <v-list-item
          v-for="org in organizations"
          :key="org.id || org._id"
          :active="isActive(org)"
          @click="switchTo(org)"
        >
          <template #prepend>
            <orgAvatarComponent :org="org" :size="28" class="mr-3" />
          </template>
          <v-list-item-title class="text-body-medium">
            {{ org.name }}
          </v-list-item-title>
          <template v-if="isActive(org)" #append>
            <v-icon icon="fa-solid fa-check" size="x-small" color="primary"></v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';
import orgColor from '../../../lib/helpers/orgColor';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsSwitcherComponent',
  components: {
    orgAvatarComponent,
  },
  data() {
    return {
      switching: false,
    };
  },
  computed: {
    /**
     * @desc Whether the organizations feature is enabled in server config.
     * @returns {boolean}
     */
    organizationsEnabled() {
      const authStore = useAuthStore();
      return authStore.serverConfig?.organizations?.enabled !== false;
    },
    organizations() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.organizations;
    },
    currentOrganization() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.currentOrganization;
    },
    /**
     * @desc Whether the switcher should be visible (enabled + multiple orgs).
     * @returns {boolean}
     */
    isVisible() {
      return this.organizationsEnabled && this.organizations.length > 0;
    },
    /**
     * @desc The display name for the active organization.
     * @returns {string}
     */
    activeName() {
      return this.currentOrganization ? this.currentOrganization.name : 'Select Org';
    },
  },
  created() {
    if (this.organizationsEnabled) {
      const organizationsStore = useOrganizationsStore();
      if (!organizationsStore.organizations.length) {
        organizationsStore.fetchOrganizations().then(() => {
          this.syncCurrentOrganization();
        }).catch(() => {
          // best-effort — silently ignore fetch failures
        });
      } else if (!organizationsStore.currentOrganization) {
        this.syncCurrentOrganization();
      }
    }
  },
  methods: {
    orgColor,
    /**
     * @desc Check whether a given organization is the active one.
     * @param {Object} org - Organization object
     * @returns {boolean}
     */
    isActive(org) {
      if (!this.currentOrganization) return false;
      return (org.id || org._id) === (this.currentOrganization.id || this.currentOrganization._id);
    },
    /**
     * @desc Sync the current organization from the user's profile into the store.
     * @returns {void}
     */
    syncCurrentOrganization() {
      const authStore = useAuthStore();
      const organizationsStore = useOrganizationsStore();
      if (!organizationsStore.currentOrganization && authStore.user?.currentOrganization) {
        const currentOrgId = authStore.user.currentOrganization._id || authStore.user.currentOrganization.id || authStore.user.currentOrganization;
        const match = organizationsStore.organizations.find((o) => (o.id || o._id) === currentOrgId);
        if (match) organizationsStore.currentOrganization = match;
      }
    },
    async switchTo(org) {
      const organizationId = org.id || org._id;
      if (this.currentOrganization && (this.currentOrganization.id || this.currentOrganization._id) === organizationId) return;
      const organizationsStore = useOrganizationsStore();
      this.switching = true;
      try {
        await organizationsStore.switchOrganization(organizationId);
      } finally {
        this.switching = false;
      }
    },
  },
};
</script>
