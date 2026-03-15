<template>
  <v-snackbar
    v-model="visible"
    location="top right"
    color="warning"
    :timeout="-1"
    multi-line
  >
    <span class="text-body-medium">
      <v-icon icon="fa-solid fa-triangle-exclamation" size="small" class="mr-1"></v-icon>
      No mailer configured. Users can register with any email without verification. Set up SMTP to enable email verification.
    </span>
    <template #actions>
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
import { useAuthStore } from '../stores/auth.store';
/**
 * Component definition.
 */
export default {
  name: 'AuthAdminMailerWarning',
  data() {
    return {
      dismissed: sessionStorage.getItem('adminMailerWarningDismissed') === 'true',
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
     * @desc Whether the user has admin role.
     * @returns {boolean}
     */
    isAdmin() {
      return !!(this.user?.roles?.includes('admin'));
    },
    /**
     * @desc Whether the server has mail/SMTP configured.
     * @returns {boolean}
     */
    mailConfigured() {
      const authStore = useAuthStore();
      return authStore.serverConfig?.mail?.configured;
    },
    /**
     * @desc Whether the warning should be shown.
     * @returns {boolean}
     */
    shouldShow() {
      return this.isLoggedIn && this.isAdmin && this.mailConfigured === false;
    },
    /**
     * @desc v-model binding for the snackbar visibility.
     */
    visible: {
      get() {
        return this.shouldShow && !this.dismissed;
      },
      set(val) {
        if (!val) this.dismiss();
      },
    },
  },
  methods: {
    /**
     * @desc Dismiss the warning and persist in sessionStorage.
     * @returns {void}
     */
    dismiss() {
      this.dismissed = true;
      sessionStorage.setItem('adminMailerWarningDismissed', 'true');
    },
  },
};
</script>
