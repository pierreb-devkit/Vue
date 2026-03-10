<template>
  <div v-if="isVisible" class="organizations-switcher">
    <v-menu location="bottom" :close-on-content-click="true">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="text-none text-body-medium px-3"
          :style="{ color: navigationColor }"
          size="small"
        >
          <v-avatar color="primary" size="24" class="mr-2">
            <span class="text-label-small font-weight-bold" style="color: white;">
              {{ activeInitial }}
            </span>
          </v-avatar>
          {{ activeName }}
          <v-icon icon="fa-solid fa-chevron-down" size="x-small" class="ml-2"></v-icon>
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
            <v-avatar
              :color="isActive(org) ? 'primary' : 'grey'"
              size="28"
              class="mr-3"
            >
              <span class="text-label-small font-weight-bold" style="color: white;">
                {{ (org.name || '?').charAt(0).toUpperCase() }}
              </span>
            </v-avatar>
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

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsSwitcherComponent',
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
      return this.organizationsEnabled && this.organizations.length > 1;
    },
    /**
     * @desc The display name for the active organization.
     * @returns {string}
     */
    activeName() {
      return this.currentOrganization ? this.currentOrganization.name : 'Select Org';
    },
    /**
     * @desc First letter of the active organization name.
     * @returns {string}
     */
    activeInitial() {
      return (this.activeName || '?').charAt(0).toUpperCase();
    },
    navigationColor() {
      return this.config.vuetify.theme.navigation.color;
    },
  },
  created() {
    if (this.organizationsEnabled) {
      const organizationsStore = useOrganizationsStore();
      if (!organizationsStore.organizations.length) {
        organizationsStore.fetchOrganizations();
      }
    }
  },
  methods: {
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
     * @desc Switch to the selected organization.
     * @param {Object} org - Organization object to switch to
     * @returns {Promise<void>}
     */
    async switchTo(org) {
      const organizationId = org.id || org._id;
      if (this.currentOrganization && (this.currentOrganization.id || this.currentOrganization._id) === organizationId) return;
      const organizationsStore = useOrganizationsStore();
      await organizationsStore.switchOrganization(organizationId);
    },
  },
};
</script>
