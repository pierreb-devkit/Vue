<template>
  <v-snackbar v-model="visible" location="center" color="info" :timeout="8000" multi-line data-test="pending-invitations-nudge">
    <span class="text-body-medium">
      <v-icon icon="fa-solid fa-envelope-open-text" size="small" class="mr-1" />
      You have <strong>{{ count }}</strong> pending organization invitation{{ count > 1 ? 's' : '' }}
    </span>
    <template #actions>
      <v-btn
        variant="text"
        size="small"
        class="text-none"
        to="/users/organizations"
        data-test="pending-invitations-nudge-view"
        @click="dismiss"
      >
        View
      </v-btn>
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
 *
 * App-level pending-invitations nudge: a centered snackbar shown right after
 * login (once per login session) when the user has pending owner_add
 * invitations to accept. Mounted in app.vue next to the other organizations
 * banners; the durable surface stays the persistent list on
 * /users/organizations — this is only the transient prompt pointing at it.
 */
export default {
  name: 'OrganizationsPendingInvitationsNudge',
  data: () => ({
    /**
     * @desc Once-per-session guard: set on the first logged-in trigger so the
     * watcher never re-fetches/re-nudges within the same login session.
     * Reset on logout so the next login re-arms the nudge.
     */
    announced: false,
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
     * @desc Count of the user's pending owner_add invitations.
     * @returns {number}
     */
    count() {
      return (useOrganizationsStore().pendingInvitations || []).length;
    },
    /**
     * @desc Controls snackbar visibility — only after the post-login fetch has
     * run (announced), with at least one pending invitation, until acted on.
     * Accepting an invitation elsewhere drains the shared store list, hiding
     * the nudge automatically.
     * @returns {boolean}
     */
    visible: {
      get() {
        return this.announced && this.count > 0 && !this.dismissed;
      },
      set(val) {
        if (!val) this.dismiss();
      },
    },
  },
  watch: {
    /**
     * @desc Fetch the user's pending invitations when they log in (or on
     * initial load when already logged in). Fires once per login session
     * via the `announced` flag; logout re-arms it.
     * @param {boolean} loggedIn - Whether the user is logged in
     */
    isLoggedIn: {
      immediate: true,
      async handler(loggedIn) {
        if (!loggedIn) {
          this.announced = false;
          this.dismissed = false;
          return;
        }
        if (!config.organizations || this.announced) return;
        this.announced = true;
        try {
          await useOrganizationsStore().fetchMyPendingInvitations();
        } catch {
          // best-effort — silently ignore (the durable list self-heals)
        }
      },
    },
  },
  methods: {
    /**
     * @desc Dismiss the nudge for the current login session.
     * @returns {void}
     */
    dismiss() {
      this.dismissed = true;
    },
  },
};
</script>
