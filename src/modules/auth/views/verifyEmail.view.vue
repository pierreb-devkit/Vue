<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
        <v-col cols="12">
          <h4 class="text-headline-small font-weight-bold">Email Verification</h4>
          <v-divider class="mt-3"></v-divider>
        </v-col>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
              <v-alert v-if="success && !redirecting" type="success" variant="tonal" class="mt-4" :class="config.vuetify.theme.rounded">
                <span class="text-body-medium">{{ successMessage }}</span>
              </v-alert>
              <v-alert v-if="redirecting" type="info" variant="tonal" class="mt-4" :class="config.vuetify.theme.rounded">
                <span class="text-body-medium">Redirecting...</span>
              </v-alert>
              <v-alert v-if="error" type="error" variant="tonal" class="mt-4" :class="config.vuetify.theme.rounded">
                <span class="text-body-medium">{{ errorMessage }}</span>
              </v-alert>
            </v-col>
          </v-row>
          <p class="text-body-medium mt-6">
            <router-link to="/signin" class="text-primary font-weight-bold text-decoration-none">
              Back to Sign In
            </router-link>
          </p>
        </v-container>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { useAuthStore } from '../stores/auth.store';
/**
 * Component definition.
 */
export default {
  data() {
    const theme = useTheme();
    return {
      theme,
      loading: true,
      success: false,
      error: false,
      redirecting: false,
      successMessage: 'Your email has been verified successfully. You can now sign in.',
      errorMessage: '',
    };
  },
  computed: {
    themeName() {
      return this.theme.name;
    },
  },
  /**
   * Verify the email token on component creation.
   * @returns {Promise<void>}
   */
  async created() {
    const authStore = useAuthStore();
    const { token } = this.$route.params;

    if (!token) {
      this.loading = false;
      this.error = true;
      this.errorMessage = 'No verification token provided.';
      return;
    }

    try {
      await authStore.verifyEmail(token);
      this.success = true;
    } catch (err) {
      this.error = true;
      this.errorMessage = err.response?.data?.message || 'Verification failed. The token may be invalid or expired.';
    } finally {
      this.loading = false;
    }

    if (this.success) {
      try {
        await this.handlePostVerificationRedirect(authStore);
      } catch {
        // Redirect errors should not affect the verified state — stay on page
      }
    }
  },
  methods: {
    /**
     * @desc Redirect the user after successful email verification based on auth state.
     * - Logged in + no org + orgs enabled → /organization-required
     * - Logged in + has org → home route
     * - Not logged in → stay on page with sign-in link
     * @param {Object} authStore - The auth store instance.
     * @returns {Promise<void>}
     */
    async handlePostVerificationRedirect(authStore) {
      if (authStore.isLoggedIn) {
        // Refresh user data to pick up emailVerified = true
        try {
          await authStore.refreshAbilities();
        } catch {
          // If refresh fails (e.g. expired token), stay on page
          return;
        }
        this.redirecting = true;
        const serverConfig = authStore.serverConfig || (await authStore.fetchServerConfig());
        if (!authStore.user?.currentOrganization && serverConfig?.organizations?.enabled) {
          this.$router.push('/organization-required');
        } else {
          this.$router.push(this.config.sign.route);
        }
      }
      // Not logged in — keep default message with sign-in link
    },
  },
};
</script>
