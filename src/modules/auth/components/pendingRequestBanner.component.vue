<template>
  <v-snackbar
    v-model="visible"
    location="top right"
    color="info"
    :timeout="-1"
    multi-line
  >
    <span class="text-body-medium">
      <v-icon icon="fa-solid fa-clock" size="small" class="mr-1"></v-icon>
      Your request to join <strong>{{ organizationName }}</strong> is pending approval.
    </span>
    <template #actions>
      <v-btn
        variant="text"
        size="small"
        class="text-none"
        to="/users/organizations/create"
      >
        Create your own
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
import { useAuthStore } from '../stores/auth.store';
/**
 * Component definition.
 */
export default {
  name: 'AuthPendingRequestBanner',
  data() {
    return {
      dismissed: sessionStorage.getItem('pendingRequestBannerDismissed') === 'true',
    };
  },
  computed: {
    isLoggedIn() {
      const authStore = useAuthStore();
      return authStore.isLoggedIn;
    },
    pendingRequests() {
      const authStore = useAuthStore();
      return authStore.pendingRequests || [];
    },
    organizationName() {
      if (this.pendingRequests.length > 0) {
        const req = this.pendingRequests[0];
        return req.organizationId?.name || req.organizationId?.slug || 'an organization';
      }
      return 'an organization';
    },
    user() {
      const authStore = useAuthStore();
      return authStore.user;
    },
    shouldShow() {
      return this.isLoggedIn && this.pendingRequests.length > 0 && !this.user?.currentOrganization;
    },
    visible: {
      get() {
        return this.shouldShow && !this.dismissed;
      },
      set(val) {
        if (!val) this.dismissed = true;
      },
    },
  },
  methods: {
    /**
     * @desc Dismiss the banner and persist in sessionStorage.
     * @returns {void}
     */
    dismiss() {
      this.dismissed = true;
      sessionStorage.setItem('pendingRequestBannerDismissed', 'true');
    },
  },
};
</script>
