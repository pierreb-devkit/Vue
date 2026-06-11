<template>
  <v-container fluid>
    <!-- Pending invitations to accept (persistent, owner_add): durable surface an
         offline invitee sees on their next login. -->
    <v-row v-if="pendingInvitations.length" class="pa-2 mt-0" data-test="pending-invitations">
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-4">
          <div class="d-flex align-center mb-2">
            <v-icon icon="fa-solid fa-envelope-open-text" size="small" color="primary" class="mr-2"></v-icon>
            <span class="text-title-medium font-weight-medium">Pending invitations</span>
          </div>
          <p class="text-body-small text-medium-emphasis mb-2">
            You've been invited to join these organizations. Accept to become a member.
          </p>
          <v-list lines="two" class="pa-0 bg-transparent">
            <template v-for="(inv, i) in pendingInvitations" :key="inv.id || inv._id">
              <v-list-item :class="config.vuetify.theme.rounded" class="pa-4">
                <template #prepend>
                  <orgAvatarComponent :org="inv.organizationId || {}" :size="40" class="mr-4" />
                </template>
                <v-list-item-title class="text-body-large font-weight-medium">
                  {{ invitationOrgName(inv) }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-small">
                  Invited as
                  <v-chip size="x-small" :color="roleColor(invitationRole(inv))" variant="tonal" class="text-capitalize ml-1">
                    {{ invitationRole(inv) }}
                  </v-chip>
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    color="primary"
                    variant="flat"
                    size="small"
                    :class="config.vuetify.theme.rounded"
                    class="text-none text-body-medium"
                    :loading="acceptingId === (inv.id || inv._id)"
                    :data-test="`accept-invitation-${inv.id || inv._id}`"
                    @click="acceptInvitation(inv)"
                  >
                    Accept
                  </v-btn>
                </template>
              </v-list-item>
              <v-divider v-if="i < pendingInvitations.length - 1"></v-divider>
            </template>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="pa-2 mt-0">
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-4">
          <v-list v-if="organizations && organizations.length" lines="two" class="pa-0 bg-transparent">
            <template v-for="(org, i) in organizations" :key="org.id || org._id">
              <v-list-item
                :to="org.role === 'owner' || org.role === 'admin' ? `/users/organizations/${org.id || org._id}/general` : undefined"
                :class="config.vuetify.theme.rounded"
                class="pa-4"
              >
                <template #prepend>
                  <orgAvatarComponent :org="org" :size="40" class="mr-4" />
                </template>
                <v-list-item-title class="text-body-large font-weight-medium">{{ org.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="org.description" class="text-body-small">{{ org.description }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex align-center ga-2">
                    <v-chip v-if="org.role" size="small" :color="roleColor(org.role)" variant="tonal" class="text-capitalize">{{ org.role }}</v-chip>
                    <v-chip v-if="isActiveOrg(org)" size="small" color="success" variant="flat">Active</v-chip>
                    <v-btn
                      v-if="org.role !== 'owner'"
                      color="error"
                      variant="text"
                      size="small"
                      class="text-none"
                      @click.stop.prevent="confirmLeave(org)"
                    >Leave</v-btn>
                    <v-icon
                      v-if="org.role === 'owner' || org.role === 'admin'"
                      icon="fa-solid fa-chevron-right"
                      size="small"
                      color="medium-emphasis"
                    ></v-icon>
                  </div>
                </template>
              </v-list-item>
              <v-divider v-if="i < organizations.length - 1"></v-divider>
            </template>
          </v-list>
          <v-btn
            color="primary"
            variant="tonal"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium mt-4"
            to="/users/organizations/create"
            block
            data-test="users-orgs-new"
          >
            <v-icon icon="fa-solid fa-plus" size="small" class="mr-2"></v-icon>
            New Organization
          </v-btn>
          <div v-if="!organizations || !organizations.length" class="text-center text-medium-emphasis pa-8">
            <v-icon icon="fa-solid fa-building" size="x-large" class="mb-4 text-medium-emphasis"></v-icon>
            <p class="text-body-medium">No organizations yet.</p>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <coreConfirmDialog
      v-model="leaveDialog"
      title="Leave Organization"
      :message="leaveOrgMessage"
      confirm-label="Leave"
      confirm-color="error"
      @confirm="leaveOrg"
    />
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../../organizations/stores/organizations.store';
import roleColor from '../../../lib/helpers/roleColor';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

export default {
  name: 'UserOrganizationsView',
  components: { orgAvatarComponent, coreConfirmDialog },
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
      leaveDialog: false,
      orgToLeave: null,
      acceptingId: null,
    };
  },
  computed: {
    /**
     * @desc Organizations the current user belongs to.
     * @returns {Array}
     */
    organizations() {
      return this.organizationsStore.organizations;
    },
    /**
     * @desc The current user's pending owner_add invitations (durable list).
     * @returns {Array}
     */
    pendingInvitations() {
      return this.organizationsStore.pendingInvitations;
    },
    /**
     * @desc The ID of the user's current active organization.
     * @returns {string|undefined}
     */
    currentOrganizationId() {
      const id = this.authStore.user?.currentOrganization;
      return id?._id || id?.id || id;
    },
    /**
     * @desc Confirmation copy interpolated with the org name.
     * @returns {string}
     */
    leaveOrgMessage() {
      return `Are you sure you want to leave ${this.orgToLeave?.name || ''}? You will lose access to all resources in this organization.`;
    },
  },
  /**
   * @desc Fetch organizations on component creation so the list is populated
   *       immediately without waiting for the parent layout's watcher.
   * @returns {Promise<void>}
   */
  async created() {
    try {
      await this.organizationsStore.fetchOrganizations();
    } catch {
      // interceptor handles snackbar
    }
    try {
      // The persistent list above is the source of truth; the transient login
      // nudge is app-level (organizations.pendingInvitationsNudge in app.vue).
      await this.organizationsStore.fetchMyPendingInvitations();
    } catch {
      // interceptor handles snackbar
    }
  },
  methods: {
    roleColor,
    /**
     * @desc Display name of the org an invitation is for. Org is populated
     *       ({ id, name, slug }); falls back gracefully if missing.
     * @param {Object} invitation - A pending owner_add membership.
     * @returns {string}
     */
    invitationOrgName(invitation) {
      return invitation?.organizationId?.name || 'an organization';
    },
    /**
     * @desc Role the user is invited to hold once they accept.
     * @param {Object} invitation - A pending owner_add membership.
     * @returns {string}
     */
    invitationRole(invitation) {
      return invitation?.role || 'member';
    },
    /**
     * @desc Accept a pending owner_add invitation. On success the PUT interceptor
     *       toasts; the membership is now active server-side, so we reflect that in
     *       the UI (refresh orgs + drop the accepted row) FIRST, then refresh
     *       abilities. The abilities refresh is wrapped in its own try/catch so a
     *       hiccup on that endpoint can't surprise-logout the user (refreshAbilities
     *       signs out + throws on failure) right after a successful accept, nor abort
     *       the org/pending refresh — a stale ability set self-heals on the next
     *       natural refresh.
     * @param {Object} invitation - The pending membership to accept.
     * @returns {Promise<void>}
     */
    async acceptInvitation(invitation) {
      const membershipId = invitation.id || invitation._id;
      if (!membershipId || this.acceptingId) return;
      this.acceptingId = membershipId;
      try {
        await this.organizationsStore.acceptMembership(membershipId);
        // Membership is accepted server-side: reflect it before touching abilities.
        // (acceptMembership drains the shared pendingInvitations list, which also
        // hides the app-level nudge.)
        await this.organizationsStore.fetchOrganizations();
        await this.organizationsStore.fetchMyPendingInvitations();
        // Soft-refresh abilities: token() updates abilities/user in-place without
        // signing out on failure (unlike refreshAbilities() which calls signout()
        // before re-throwing). A stale ability set self-heals on the next natural
        // refresh. Non-fatal by design — the accept already succeeded.
        await this.authStore.token();
      } catch {
        // interceptor handles snackbar
      } finally {
        this.acceptingId = null;
      }
    },
    /**
     * @desc Check whether the given org is the user's active organization.
     * @param {Object} org - Organization object.
     * @returns {boolean}
     */
    isActiveOrg(org) {
      return (org.id || org._id) === this.currentOrganizationId;
    },
    /**
     * @desc Open the Leave confirmation dialog for a specific organization.
     * @param {Object} org - Organization object the user wants to leave.
     * @returns {void}
     */
    confirmLeave(org) {
      this.orgToLeave = org;
      this.leaveDialog = true;
    },
    /**
     * @desc Leave the pending organization, refresh abilities, and redirect to
     *       `/organization-required` when no orgs remain or switch to the first
     *       remaining org when currentOrganization becomes null.
     * @returns {Promise<void>}
     */
    async leaveOrg() {
      try {
        await this.organizationsStore.leaveOrganization(this.orgToLeave.id || this.orgToLeave._id);
        this.leaveDialog = false;
        this.orgToLeave = null;
        await this.authStore.refreshAbilities();
        if (this.organizationsStore.organizations.length === 0) {
          this.$router.push('/organization-required');
        } else if (!this.organizationsStore.currentOrganization) {
          await this.organizationsStore.switchOrganization(
            this.organizationsStore.organizations[0].id || this.organizationsStore.organizations[0]._id,
          );
        }
      } catch {
        this.leaveDialog = false;
      }
    },
  },
};
</script>
