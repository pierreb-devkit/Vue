<template>
  <v-snackbar
    v-model="visible"
    location="top right"
    color="warning"
    :timeout="-1"
    multi-line
  >
    <span class="text-body-medium">
      Your email is not verified. Check your inbox or resend the verification email.
    </span>
    <template #actions>
      <v-btn
        variant="text"
        size="small"
        class="text-none"
        :loading="sending"
        :disabled="sent"
        @click="resend"
      >
        {{ sent ? 'Sent' : 'Resend' }}
      </v-btn>
      <v-btn
        variant="text"
        size="small"
        icon="$close"
        @click="dismiss"
      />
    </template>
  </v-snackbar>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAuthStore } from '../../stores/auth.store';
/**
 * Component definition.
 */
export default {
  name: 'AuthEmailBanner',
  data() {
    return {
      sending: false,
      sent: false,
      dismissed: false,
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
    /**
     * @desc Whether the server has mail/SMTP configured.
     * @returns {boolean}
     */
    mailConfigured() {
      const authStore = useAuthStore();
      return !!(authStore.serverConfig && authStore.serverConfig.mail && authStore.serverConfig.mail.configured);
    },
    /**
     * @desc Whether the snackbar should be shown based on user state and mail config.
     * @returns {boolean}
     */
    shouldShow() {
      return (
        this.isLoggedIn &&
        this.user &&
        this.user.emailVerified === false &&
        this.mailConfigured
      );
    },
    /**
     * @desc v-model binding for the snackbar visibility.
     */
    visible: {
      get() {
        return this.shouldShow && !this.dismissed;
      },
      set(val) {
        if (!val) {
          this.dismissed = true;
        }
      },
    },
  },
  watch: {
    /**
     * @desc Reset dismissed state on route change so the snackbar
     * reappears on next page load if email is still not verified.
     */
    $route() {
      this.dismissed = false;
      this.sent = false;
    },
  },
  methods: {
    /**
     * @desc Dismiss the snackbar until next navigation.
     */
    dismiss() {
      this.dismissed = true;
    },
    /**
     * @desc Resend the verification email via the auth store action.
     * @returns {Promise<void>}
     */
    async resend() {
      this.sending = true;
      const authStore = useAuthStore();
      try {
        await authStore.resendVerification();
        this.sent = true;
      } catch {
        // silently handle — snackbar stays visible for retry
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>
