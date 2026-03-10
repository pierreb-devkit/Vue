<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" :style="{ background: theme.current.colors.surface }" :flat="config.vuetify.theme.flat">
        <v-col cols="12">
          <h4>Email Verification</h4>
          <v-divider></v-divider>
        </v-col>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>
              <v-alert v-if="success" type="success" class="mt-4">
                {{ successMessage }}
              </v-alert>
              <v-alert v-if="error" type="error" class="mt-4">
                {{ errorMessage }}
              </v-alert>
            </v-col>
          </v-row>
          <br />
          <p>
            <b>
              <router-link to="/signin">Back to Sign In</router-link>
            </b>
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
  },
};
</script>
