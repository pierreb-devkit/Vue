<template>
  <v-snackbar v-model="visible" location="top right" color="info" :timeout="-1" multi-line>
    <span class="text-body-medium">
      <v-icon icon="fa-solid fa-user-clock" size="small" class="mr-1" />
      <strong>{{ totalCount }}</strong> pending join request{{ totalCount > 1 ? 's' : '' }}
      <span v-if="orgs.length === 1"> in <strong>{{ orgs[0].organizationName }}</strong></span>
      <span v-else> across {{ orgs.length }} organizations</span>
    </span>
    <template #actions>
      <v-btn variant="text" size="small" class="text-none" :to="reviewLink" @click="dismiss">Review</v-btn>
      <v-btn variant="text" size="small" icon="$close" @click="dismiss" />
    </template>
  </v-snackbar>
</template>

<script>
/**
 * Module dependencies.
 */
import config from '@/config';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsAdminPendingBanner',
  data: () => ({
    dismissed: false,
  }),
  computed: {
    /**
     * @desc Whether the user is logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
      return useAuthStore().isLoggedIn;
    },
    /**
     * @desc List of orgs with pending requests from the organizations store.
     * @returns {Array<{organizationId: string, organizationName: string, count: number}>}
     */
    orgs() {
      return useOrganizationsStore().adminPendingRequests || [];
    },
    /**
     * @desc Total count of pending requests across all orgs.
     * @returns {number}
     */
    totalCount() {
      return this.orgs.reduce((sum, org) => sum + org.count, 0);
    },
    /**
     * @desc Route to review pending requests (single org detail or org list).
     * @returns {string}
     */
    reviewLink() {
      return `/users/organizations/${this.orgs[0].organizationId}`;
    },
    /**
     * @desc Controls snackbar visibility.
     * @returns {boolean}
     */
    visible: {
      get() {
        return this.totalCount > 0 && !this.dismissed;
      },
      set(val) {
        if (!val) this.dismiss();
      },
    },
  },
  watch: {
    /**
     * @desc Fetch admin pending requests when user logs in or on initial load.
     * @param {boolean} loggedIn - Whether the user is logged in
     */
    isLoggedIn: {
      immediate: true,
      async handler(loggedIn) {
        if (!loggedIn || !config.organizations) {
          useOrganizationsStore().adminPendingRequests = [];
          return;
        }
        this.dismissed = false;
        const orgStore = useOrganizationsStore();
        try {
          await orgStore.fetchAdminPendingRequests();
        } catch {
          // best-effort — silently ignore
        }
      },
    },
  },
  methods: {
    /**
     * @desc Dismiss the banner for current page view.
     * @returns {void}
     */
    dismiss() {
      this.dismissed = true;
    },
  },
};
</script>
