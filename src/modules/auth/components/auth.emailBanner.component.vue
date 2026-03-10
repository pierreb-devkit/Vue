<template>
  <v-alert
    v-if="isLoggedIn && user && user.emailVerified === false"
    type="warning"
    variant="tonal"
    closable
    class="mb-0"
  >
    <v-row align="center" density="compact">
      <v-col>
        Your email address has not been verified. Please check your inbox or click the button to resend the verification email.
      </v-col>
      <v-col cols="auto">
        <v-btn
          :flat="config.vuetify.theme.flat"
          :loading="sending"
          :disabled="sent"
          color="warning"
          variant="outlined"
          size="small"
          class="ml-4"
          @click="resend"
        >
          {{ sent ? 'Email Sent' : 'Resend Verification Email' }}
        </v-btn>
      </v-col>
    </v-row>
    <v-alert v-if="errorMessage" type="error" density="compact" class="mt-2">
      {{ errorMessage }}
    </v-alert>
  </v-alert>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAuthStore } from '../stores/auth.store';
/**
 * Component definition.
 */
export default {
  name: 'AuthEmailBanner',
  data() {
    return {
      sending: false,
      sent: false,
      errorMessage: '',
    };
  },
  computed: {
    /**
     * @desc Whether the user is currently logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    /**
     * @desc The current authenticated user object.
     * @returns {Object|null}
     */
    user() {
      const authStore = useAuthStore();
      return authStore.user;
    },
  },
  methods: {
    /**
     * @desc Resend the verification email via the auth store action.
     * @returns {Promise<void>}
     */
    async resend() {
      this.sending = true;
      this.errorMessage = '';
      const authStore = useAuthStore();
      try {
        await authStore.resendVerification();
        this.sent = true;
      } catch (err) {
        this.errorMessage = err.response?.data?.message || 'Failed to resend verification email. Please try again later.';
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>
