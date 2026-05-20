<template>
  <v-container fluid>
    <v-list v-if="organizations && organizations.length" lines="two" class="pa-0 bg-transparent">
      <template v-for="(org, i) in organizations" :key="org.id || org._id">
        <v-list-item
          :to="org.role === 'owner' || org.role === 'admin' ? `/users/organizations/${org.id || org._id}/general` : undefined"
          :class="config.vuetify.theme.rounded"
          class="pa-4"
        >
          <template #prepend>
            <orgAvatarComponent :org="org" :size="40" class="mr-4" />
          </template>
          <v-list-item-title class="text-body-large font-weight-medium">{{ org.name }}</v-list-item-title>
          <v-list-item-subtitle v-if="org.description" class="text-body-small">{{ org.description }}</v-list-item-subtitle>
          <template #append>
            <div class="d-flex align-center ga-2">
              <v-chip v-if="org.role" size="small" :color="roleColor(org.role)" variant="tonal" class="text-capitalize">{{ org.role }}</v-chip>
              <v-chip v-if="isActiveOrg(org)" size="small" color="success" variant="flat">Active</v-chip>
              <v-btn
                v-if="org.role !== 'owner'"
                color="error"
                variant="text"
                size="small"
                class="text-none"
                @click.stop.prevent="confirmLeave(org)"
              >Leave</v-btn>
              <v-icon
                v-if="org.role === 'owner' || org.role === 'admin'"
                icon="fa-solid fa-chevron-right"
                size="small"
                color="medium-emphasis"
              ></v-icon>
            </div>
          </template>
        </v-list-item>
        <v-divider v-if="i < organizations.length - 1"></v-divider>
      </template>
    </v-list>
    <v-btn
      color="primary"
      variant="tonal"
      :class="config.vuetify.theme.rounded"
      class="text-none text-body-medium mt-4"
      to="/users/organizations/create"
      block
      data-test="users-orgs-new"
    >
      <v-icon icon="fa-solid fa-plus" size="small" class="mr-2"></v-icon>
      New Organization
    </v-btn>
    <div v-if="!organizations || !organizations.length" class="text-center text-medium-emphasis pa-8">
      <v-icon icon="fa-solid fa-building" size="x-large" class="mb-4 text-medium-emphasis"></v-icon>
      <p class="text-body-medium">No organizations yet.</p>
    </div>

    <!-- Leave organization dialog -->
    <v-dialog v-model="leaveDialog" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium">Leave Organization</v-card-title>
        <v-card-text class="text-body-medium">
          Are you sure you want to leave {{ orgToLeave?.name }}? You will lose access to all resources in this organization.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none text-body-medium" @click="leaveDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="leaveOrg">Leave</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import roleColor from '../../../lib/helpers/roleColor';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';

export default {
  name: 'UserOrganizationsView',
  components: { orgAvatarComponent },
  /**
   * @desc Wires auth and organizations stores for computed properties and methods.
   * @returns {{ authStore: Object, organizationsStore: Object }}
   */
  setup() {
    return {
      authStore: useAuthStore(),
      organizationsStore: useOrganizationsStore(),
    };
  },
  data() {
    return {
      leaveDialog: false,
      orgToLeave: null,
    };
  },
  computed: {
    /**
     * @desc Organizations the current user belongs to.
     * @returns {Array}
     */
    organizations() {
      return this.organizationsStore.organizations;
    },
    /**
     * @desc The ID of the user's current active organization.
     * @returns {string|undefined}
     */
    currentOrganizationId() {
      const id = this.authStore.user?.currentOrganization;
      return id?._id || id?.id || id;
    },
  },
  /**
   * @desc Fetch organizations on component creation so the list is populated
   *       immediately without waiting for the parent layout's watcher.
   * @returns {Promise<void>}
   */
  async created() {
    try {
      await this.organizationsStore.fetchOrganizations();
    } catch {
      // interceptor handles snackbar
    }
  },
  methods: {
    roleColor,
    /**
     * @desc Check whether the given org is the user's active organization.
     * @param {Object} org - Organization object.
     * @returns {boolean}
     */
    isActiveOrg(org) {
      return (org.id || org._id) === this.currentOrganizationId;
    },
    /**
     * @desc Open the Leave confirmation dialog for a specific organization.
     * @param {Object} org - Organization object the user wants to leave.
     * @returns {void}
     */
    confirmLeave(org) {
      this.orgToLeave = org;
      this.leaveDialog = true;
    },
    /**
     * @desc Leave the pending organization, refresh abilities, and redirect to
     *       `/organization-required` when no orgs remain or switch to the first
     *       remaining org when currentOrganization becomes null.
     * @returns {Promise<void>}
     */
    async leaveOrg() {
      try {
        await this.organizationsStore.leaveOrganization(this.orgToLeave.id || this.orgToLeave._id);
        this.leaveDialog = false;
        this.orgToLeave = null;
        await this.authStore.refreshAbilities();
        if (this.organizationsStore.organizations.length === 0) {
          this.$router.push('/organization-required');
        } else if (!this.organizationsStore.currentOrganization) {
          await this.organizationsStore.switchOrganization(
            this.organizationsStore.organizations[0].id || this.organizationsStore.organizations[0]._id,
          );
        }
      } catch {
        this.leaveDialog = false;
      }
    },
  },
};
</script>
