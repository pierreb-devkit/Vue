<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-user" title="Account">
      <template #actions>
        <organizationsSwitcherComponent />
      </template>
    </PageHeader>
    <v-row class="pa-2 mt-0">
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
          <v-tabs v-model="tab" color="primary">
            <v-tab value="profile" class="text-none text-body-medium">
              <v-icon icon="fa-solid fa-id-card" size="small" class="mr-2"></v-icon>
              Profile
            </v-tab>
            <v-tab value="organizations" class="text-none text-body-medium">
              <v-icon icon="fa-solid fa-building" size="small" class="mr-2"></v-icon>
              Organizations
            </v-tab>
          </v-tabs>
          <v-divider></v-divider>
          <v-window v-model="tab">
            <!-- Profile tab -->
            <v-window-item value="profile">
              <div class="pa-6">
                <userProfileComponent :user="user" :organizations="organizations" @save="updateProfile" @avatar-uploaded="onAvatarUploaded" />
              </div>
            </v-window-item>
            <!-- Organizations tab -->
            <v-window-item value="organizations">
              <div class="pa-6">
                <v-list v-if="organizations && organizations.length" lines="two" class="pa-0 bg-transparent">
                  <template v-for="(org, i) in organizations" :key="org.id || org._id">
                    <v-list-item
                      :to="org.role === 'owner' || org.role === 'admin' ? `/users/organizations/${org.id || org._id}` : undefined"
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
                          <v-chip v-if="org.role" size="small" :color="roleColor(org.role)" variant="tonal" class="text-capitalize">{{
                            org.role
                          }}</v-chip>
                          <v-chip v-if="isActiveOrg(org)" size="small" color="success" variant="flat">Active</v-chip>
                          <v-btn
                            v-if="org.role !== 'owner'"
                            color="error"
                            variant="text"
                            size="small"
                            class="text-none"
                            @click.stop.prevent="confirmLeave(org)"
                          >
                            Leave
                          </v-btn>
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
                >
                  <v-icon icon="fa-solid fa-plus" size="small" class="mr-2"></v-icon>
                  New Organization
                </v-btn>
                <div v-if="!organizations || !organizations.length" class="text-center text-medium-emphasis pa-8">
                  <v-icon icon="fa-solid fa-building" size="x-large" class="mb-4 text-medium-emphasis"></v-icon>
                  <p class="text-body-medium">No organizations yet.</p>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-card>

        <!-- Billing & Plan link (meterMode or non-free subscription) -->
        <v-card
          v-if="showBillingLink"
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
          class="mt-4 pa-6 d-flex align-center justify-space-between flex-wrap ga-4"
        >
          <div>
            <h3 class="text-title-medium font-weight-medium mb-1">Billing &amp; Plan</h3>
            <p class="text-body-small text-medium-emphasis mb-0">Manage your subscription and usage.</p>
          </div>
          <v-btn
            color="primary"
            variant="tonal"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            to="/billing"
          >
            <v-icon icon="fa-solid fa-credit-card" size="small" class="mr-2" />
            Manage subscription
          </v-btn>
        </v-card>

        <!-- Danger zone -->
        <v-card variant="outlined" color="error" class="mt-4 pa-6" :class="config.vuetify.theme.rounded">
          <div class="d-flex align-center flex-wrap ga-4">
            <div class="flex-grow-1">
              <h3 class="text-title-medium font-weight-medium mb-1">Delete Account</h3>
              <p class="text-body-small text-medium-emphasis mb-0">
                Permanently delete your account, data, and organization ownership. This cannot be undone.
              </p>
            </div>
            <v-btn
              color="error"
              variant="tonal"
              :class="config.vuetify.theme.rounded"
              class="text-none text-body-medium"
              @click="confirmDeleteAccount = true"
            >
              Delete Account
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

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

    <!-- Delete account dialog -->
    <v-dialog v-model="confirmDeleteAccount" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium text-error">Delete Account</v-card-title>
        <v-card-text class="text-body-medium">
          This action is irreversible. Your account, all your data, and any organization you are the sole owner of will be permanently deleted.
          <v-text-field
            v-model="deleteConfirmInput"
            label="Type DELETE to confirm"
            variant="outlined"
            density="compact"
            class="mt-4"
            autocomplete="off"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none text-body-medium" @click="confirmDeleteAccount = false; deleteConfirmInput = ''">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :disabled="deleteConfirmInput !== 'DELETE'"
            @click="deleteAccount"
          >Delete my account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useBilling } from '../../billing/composables/billing.useBilling';
import axios from '../../../lib/services/axios';
import roleColor from '../../../lib/helpers/roleColor';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import userProfileComponent from '../components/user.profile.component.vue';
import organizationsSwitcherComponent from '../../organizations/components/organizations.switcher.component.vue';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';

export default {
  name: 'UserView',
  components: {
    PageHeader,
    userProfileComponent,
    organizationsSwitcherComponent,
    orgAvatarComponent,
  },
  /**
   * @desc Wires auth, organizations and billing helpers for use across computed
   * properties and methods.
   * @returns {{ authStore: Object, organizationsStore: Object, isPlanActive: import('vue').ComputedRef<boolean> }}
   */
  setup() {
    const authStore = useAuthStore();
    const organizationsStore = useOrganizationsStore();
    const { isPlanActive } = useBilling();
    return { authStore, organizationsStore, isPlanActive };
  },
  data() {
    return {
      tab: 'profile',
      leaveDialog: false,
      orgToLeave: null,
      confirmDeleteAccount: false,
      deleteConfirmInput: '',
    };
  },
  computed: {
    user() {
      return this.authStore.user || {};
    },
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
    /**
     * @desc Show the billing link when meterMode is enabled OR the user has an active subscription.
     * Always dormant when billing is not configured.
     * @returns {boolean}
     */
    showBillingLink() {
      const meterMode = this.authStore.serverConfig?.billing?.meterMode === true;
      const billingEnabled = this.authStore.serverConfig?.billing?.enabled === true;
      return billingEnabled && (meterMode || this.isPlanActive);
    },
  },
  /**
   * Fetch organizations on component creation.
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
     * @param {Object} org - Organization object
     * @returns {boolean}
     */
    isActiveOrg(org) {
      return (org.id || org._id) === this.currentOrganizationId;
    },
    async updateProfile(formData) {
      try {
        const api = `${this.config.api.protocol}://${this.config.api.host}:${this.config.api.port}/${this.config.api.base}`;
        await axios.put(`${api}/users`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          position: formData.position,
        });
        await this.authStore.refreshAbilities();
      } catch {
        // interceptor handles snackbar
      }
    },
    async onAvatarUploaded() {
      await this.authStore.refreshAbilities();
    },
    confirmLeave(org) {
      this.orgToLeave = org;
      this.leaveDialog = true;
    },
    async leaveOrg() {
      try {
        await this.organizationsStore.leaveOrganization(this.orgToLeave.id || this.orgToLeave._id);
        this.leaveDialog = false;
        this.orgToLeave = null;
        await this.authStore.refreshAbilities();
        if (this.organizationsStore.organizations.length === 0) {
          this.$router.push('/organization-required');
        } else if (!this.organizationsStore.currentOrganization) {
          await this.organizationsStore.switchOrganization(this.organizationsStore.organizations[0].id || this.organizationsStore.organizations[0]._id);
        }
      } catch {
        this.leaveDialog = false;
      }
    },
    async deleteAccount() {
      try {
        const api = `${this.config.api.protocol}://${this.config.api.host}:${this.config.api.port}/${this.config.api.base}`;
        await axios.delete(`${api}/users`);
        await this.authStore.signout();
        this.$router.push('/signin');
      } catch {
        this.confirmDeleteAccount = false;
        this.deleteConfirmInput = '';
      }
    },
  },
};
</script>
