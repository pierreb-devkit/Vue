<template>
  <v-container fluid>
    <userProfileComponent
      :user="user"
      :organizations="organizations"
      @save="updateProfile"
      @avatar-uploaded="onAvatarUploaded"
    />

    <!-- Danger zone -->
    <v-card variant="outlined" color="error" class="mt-6">
      <v-card-title class="text-title-medium font-weight-medium">Delete Account</v-card-title>
      <v-card-text class="text-body-small text-medium-emphasis">Permanently delete your account, data, and organization ownership. This cannot be undone.</v-card-text>
      <v-card-actions>
        <v-btn color="error" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium" @click="confirmDeleteAccount = true">Delete Account</v-btn>
      </v-card-actions>
    </v-card>

    <!-- Delete account dialog -->
    <v-dialog v-model="confirmDeleteAccount" max-width="440">
      <v-card :class="config.vuetify.theme.rounded" class="pa-4">
        <v-card-title class="text-title-large font-weight-medium text-error">Delete Account</v-card-title>
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
          >Delete my account</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import axios from '../../../lib/services/axios';
import userProfileComponent from '../components/user.profile.component.vue';

export default {
  name: 'UserProfileView',
  components: { userProfileComponent },
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
      confirmDeleteAccount: false,
      deleteConfirmInput: '',
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
     * @desc Persist updated profile fields to the API and refresh CASL abilities.
     * @param {{ firstName: string, lastName: string, bio: string, position: string }} formData
     * @returns {Promise<void>}
     */
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
    /**
     * @desc Refresh CASL abilities after a successful avatar upload.
     * @returns {Promise<void>}
     */
    async onAvatarUploaded() {
      await this.authStore.refreshAbilities();
    },
    /**
     * @desc Permanently delete the authenticated user's account, sign out,
     *       and redirect to the sign-in page. Closes the dialog on error.
     * @returns {Promise<void>}
     */
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
