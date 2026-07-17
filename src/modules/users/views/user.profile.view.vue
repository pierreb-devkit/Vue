<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
          <userProfileComponent
            :user="user"
            :organizations="organizations"
            @save="updateProfile"
            @avatar-uploaded="onAvatarUploaded"
          />
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

    <coreConfirmDialog
      v-model="confirmDeleteAccount"
      title="Delete Account"
      title-class="text-error"
      message="Permanently delete your account, data, and organization ownership. This cannot be undone."
      confirm-text="DELETE"
      confirm-label="Delete my account"
      confirm-color="error"
      @confirm="deleteAccount"
    />
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import { useUsersStore } from '../stores/users.store';
import userProfileComponent from '../components/user.profile.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

export default {
  name: 'UserProfileView',
  components: { userProfileComponent, coreConfirmDialog },
  /**
   * @desc Wires auth, organizations, and users stores for computed properties and methods.
   * @returns {{ authStore: Object, organizationsStore: Object, usersStore: Object }}
   */
  setup() {
    return {
      authStore: useAuthStore(),
      organizationsStore: useOrganizationsStore(),
      usersStore: useUsersStore(),
    };
  },
  data() {
    return {
      confirmDeleteAccount: false,
    };
  },
  computed: {
    /**
     * @desc Current authenticated user object.
     * @returns {Object}
     */
    user() {
      return this.authStore.user || {};
    },
    /**
     * @desc Organizations the user belongs to (passed to profile form for avatar context).
     * @returns {Array}
     */
    organizations() {
      return this.organizationsStore.organizations;
    },
  },
  methods: {
    /**
     * @desc Persist updated profile fields via the users store and refresh CASL abilities.
     * @param {{ firstName: string, lastName: string, bio: string, position: string }} formData
     * @returns {Promise<void>}
     */
    async updateProfile(formData) {
      try {
        await this.usersStore.updateProfile(formData);
        await this.authStore.refreshAbilities();
      } catch {
        // interceptor handles snackbar
      }
    },
    /**
     * @desc Refresh CASL abilities after a successful avatar upload.
     * @returns {Promise<void>}
     */
    async onAvatarUploaded() {
      await this.authStore.refreshAbilities();
    },
    /**
     * @desc Permanently delete the authenticated user's account via the
     *       users store, sign out, and redirect to the sign-in page. Closes
     *       the dialog on error.
     * @returns {Promise<void>}
     */
    async deleteAccount() {
      try {
        await this.usersStore.deleteAccount();
        await this.authStore.signout();
        this.$router.push('/signin');
      } catch {
        this.confirmDeleteAccount = false;
      }
    },
  },
};
</script>
