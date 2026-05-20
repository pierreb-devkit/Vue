<template>
  <v-container fluid>
    <PageHeader icon="fa-solid fa-user" title="Account">
      <template #actions>
        <organizationsSwitcherComponent />
      </template>
    </PageHeader>
    <v-row class="pa-2 mt-0">
      <v-col cols="12">
        <PageTabs v-model="tab" :tabs="tabsConfig">
          <template #profile>
            <userProfileComponent
              :user="user"
              :organizations="organizations"
              @save="updateProfile"
              @avatar-uploaded="onAvatarUploaded"
            />

            <!-- Danger zone -->
            <v-card variant="outlined" color="error" class="mt-6">
              <v-card-title class="text-title-medium font-weight-medium">Delete account</v-card-title>
              <v-card-text class="text-body-small text-medium-emphasis">Permanently delete your account, data, and organization ownership. This cannot be undone.</v-card-text>
              <v-card-actions>
                <v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="confirmDeleteAccount = true">Delete account</v-btn>
              </v-card-actions>
            </v-card>
          </template>

          <template #organizations>
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
            >
              <v-icon icon="fa-solid fa-plus" size="small" class="mr-2"></v-icon>
              New Organization
            </v-btn>
            <div v-if="!organizations || !organizations.length" class="text-center text-medium-emphasis pa-8">
              <v-icon icon="fa-solid fa-building" size="x-large" class="mb-4 text-medium-emphasis"></v-icon>
              <p class="text-body-medium">No organizations yet.</p>
            </div>
          </template>
        </PageTabs>
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
        <v-card-title class="text-title-large font-weight-medium text-error">Delete account</v-card-title>
        <v-card-text class="text-body-medium">
          Permanently delete your account, data, and organization ownership. This cannot be undone.
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
          >Delete account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import axios from '../../../lib/services/axios';
import roleColor from '../../../lib/helpers/roleColor';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import PageTabs from '../../core/components/core.pageTabs.component.vue';
import userProfileComponent from '../components/user.profile.component.vue';
import organizationsSwitcherComponent from '../../organizations/components/organizations.switcher.component.vue';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';

export default {
  name: 'UserView',
  components: {
    PageHeader,
    PageTabs,
    userProfileComponent,
    organizationsSwitcherComponent,
    orgAvatarComponent,
  },
  /**
   * @desc Wires auth and organizations store for use across computed properties and methods.
   * @returns {{ authStore: Object, organizationsStore: Object }}
   */
  setup() {
    const authStore = useAuthStore();
    const organizationsStore = useOrganizationsStore();
    return { authStore, organizationsStore };
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
     * @desc Tab definitions for the Account page.
     * @returns {Array<{value: string, label: string, icon: string}>}
     */
    tabsConfig() {
      return [
        { value: 'profile', label: 'Profile', icon: 'fa-solid fa-id-card' },
        { value: 'organizations', label: 'Organizations', icon: 'fa-solid fa-building' },
      ];
    },
  },
  watch: {
    '$route.query.tab'() {
      this.applyTabFromRoute();
    },
    '$route.hash'() {
      this.applyTabFromRoute();
    },
    /**
     * @desc Refetch organizations whenever the auth state changes so the
     * organizations tab stays hydrated after fresh login.
     * Silent catch: UI must still work when fetches transiently fail.
     * @param {boolean} loggedIn - Auth state after the change.
     * @returns {Promise<void>}
     */
    'authStore.isLoggedIn': {
      immediate: true,
      async handler(loggedIn) {
        if (!loggedIn) return;
        await this.organizationsStore.fetchOrganizations().catch(() => {});
      },
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
  /**
   * @desc Apply tab from query/hash on first render.
   * @returns {void}
   */
  mounted() {
    this.applyTabFromRoute();
  },
  methods: {
    roleColor,
    /**
     * @desc Resolve a requested tab from the route (?tab= or #...) and switch
     * the active tab when the requested tab is one of the available tabs.
     * @returns {void}
     */
    applyTabFromRoute() {
      const requested =
        this.$route?.query?.tab || (this.$route?.hash || '').replace(/^#/, '') || null;
      if (!requested) return;
      if (['profile', 'organizations'].includes(requested)) {
        this.tab = requested;
      }
    },
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
