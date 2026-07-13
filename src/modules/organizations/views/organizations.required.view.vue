<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h3 class="text-headline-small font-weight-bold text-center">No workspace found</h3>
      <p class="text-body-medium text-medium-emphasis text-center mt-1 mb-6">
        You are not a member of any workspace. Create one or ask for an invitation.
      </p>

      <!-- Email verification gate -->
      <template v-if="emailVerificationRequired">
        <v-card variant="tonal" color="warning" class="pa-6 mb-6" :class="config.vuetify.theme.rounded">
          <div class="d-flex flex-column align-center ga-3">
            <v-icon icon="fa-solid fa-envelope" size="large" color="warning"></v-icon>
            <h4 class="text-title-medium font-weight-bold text-center">Verify your email to continue</h4>
            <p class="text-body-medium text-center">We sent a verification link to <strong>{{ userEmail }}</strong></p>
            <v-btn
              variant="flat"
              color="warning"
              :class="config.vuetify.theme.rounded"
              class="text-none text-body-medium"
              :loading="resending"
              :disabled="resent"
              @click="resendVerification"
            >
              {{ resent ? 'Sent' : 'Resend' }}
            </v-btn>
          </div>
        </v-card>
      </template>

      <template v-else>
      <!-- Pending request banner -->
      <v-alert
        v-if="pendingRequests.length > 0"
        type="info"
        variant="tonal"
        class="mb-6"
        :class="config.vuetify.theme.rounded"
      >
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-body-medium font-weight-medium flex-grow-1">
            Your request to join <strong>{{ pendingRequests[0].organizationId?.name || 'an organization' }}</strong> is pending approval.
          </span>
          <v-btn variant="tonal" color="info" size="small" :class="config.vuetify.theme.rounded" class="text-none" @click="refresh">
            <v-icon icon="fa-solid fa-arrows-rotate" size="x-small" class="mr-1"></v-icon>
            Check status
          </v-btn>
        </div>
      </v-alert>

      <!-- Pending owner_add invitations: an invited user who lands on the wall
           can accept right here instead of dead-ending on "No workspace found". -->
      <template v-if="pendingInvitations.length > 0">
        <label class="text-label-large font-weight-medium d-block mb-2">You've been invited</label>
        <v-list density="compact" class="mb-2" data-test="wall-pending-invitations">
          <v-list-item
            v-for="inv in pendingInvitations"
            :key="inv.id || inv._id"
          >
            <template #prepend>
              <orgAvatarComponent :org="inv.organizationId || {}" :size="32" class="mr-3" />
            </template>
            <v-list-item-title class="text-body-medium">{{ inv.organizationId?.name || 'an organization' }}</v-list-item-title>
            <template #append>
              <div class="d-flex align-center ga-2">
                <v-chip size="x-small" :color="roleColor(inv.role || 'member')" variant="tonal" class="text-capitalize">
                  {{ inv.role || 'member' }}
                </v-chip>
                <v-btn
                  size="small"
                  color="primary"
                  variant="flat"
                  :class="config.vuetify.theme.rounded"
                  class="text-none"
                  :loading="acceptingId === (inv.id || inv._id)"
                  :data-test="`wall-accept-invitation-${inv.id || inv._id}`"
                  @click="acceptInvitation(inv)"
                >
                  Accept
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
        <p class="text-body-small text-medium-emphasis mb-4">
          <a href="#" class="text-primary font-weight-bold text-decoration-none" data-test="wall-see-organizations" @click.prevent="$router.push('/users/organizations')">See My Organizations</a>
          to manage your invitations.
        </p>
      </template>

      <!-- Domain-matched organizations -->
      <template v-if="domainOrgs.length > 0">
        <label class="text-label-large font-weight-medium d-block mb-2">Organizations matching your email domain</label>
        <v-list density="compact" class="mb-4">
          <v-list-item
            v-for="org in domainOrgs"
            :key="org.id || org._id"
          >
            <template #prepend>
              <orgAvatarComponent :org="org" :size="32" class="mr-3" />
            </template>
            <v-list-item-title class="text-body-medium">{{ org.name }}</v-list-item-title>
            <template #append>
              <v-btn
                size="small"
                color="primary"
                variant="tonal"
                :class="config.vuetify.theme.rounded"
                class="text-none"
                :loading="requestingOrgId === (org.id || org._id)"
                :disabled="pendingRequests.length > 0"
                @click="requestToJoin(org)"
              >
                Request to join
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </template>

      <!-- Divider -->
      <div class="d-flex align-center ga-4 mb-4">
        <v-divider></v-divider>
        <span class="text-label-medium text-medium-emphasis text-no-wrap">or</span>
        <v-divider></v-divider>
      </div>

      <!-- Create org -->
      <v-btn
        color="primary"
        variant="flat"
        :class="config.vuetify.theme.rounded"
        class="text-none text-body-medium"
        size="large"
        block
        to="/users/organizations/create"
      >
        <v-icon start icon="fa-solid fa-plus" size="small"></v-icon>
        Create an organization
      </v-btn>

      </template>

      <p class="text-body-medium text-medium-emphasis text-center mt-6">
        <a href="#" class="text-primary font-weight-bold text-decoration-none" @click.prevent="signout">Sign out</a>
        to use a different account.
      </p>
    </v-card>
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useCoreStore } from '../../core/stores/core.store';
import { useOrganizationsStore } from '../stores/organizations.store';
import orgAvatarComponent from '../../core/components/org.avatar.component.vue';
import roleColor from '../../../lib/helpers/roleColor';

export default {
  name: 'OrganizationsRequiredView',
  components: {
    orgAvatarComponent,
  },
  data() {
    return {
      domainOrgs: [],
      requestingOrgId: null,
      resending: false,
      resent: false,
      acceptingId: null,
    };
  },
  computed: {
    pendingRequests() {
      const authStore = useAuthStore();
      return authStore.pendingRequests || [];
    },
    /**
     * @desc Whether the user must verify their email before proceeding.
     * @returns {boolean}
     */
    emailVerificationRequired() {
      const authStore = useAuthStore();
      return !!(authStore.user?.emailVerified === false && authStore.serverConfig?.mail?.configured);
    },
    /**
     * @desc The current user's email address.
     * @returns {string}
     */
    userEmail() {
      const authStore = useAuthStore();
      return authStore.user?.email || '';
    },
    /**
     * @desc Pending owner_add invitations the user RECEIVED (durable surface —
     *       distinct from pendingRequests, the join requests the user SENT).
     * @returns {Array}
     */
    pendingInvitations() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.pendingInvitations || [];
    },
  },
  async created() {
    const organizationsStore = useOrganizationsStore();
    // Auto-load organizations matching the user's email domain
    try {
      this.domainOrgs = await organizationsStore.searchOrganizationsByDomain();
    } catch {
      this.domainOrgs = [];
    }
    // Pending owner_add invitations: surfaced on the wall so an invited user
    // is not stuck behind "No workspace found".
    try {
      await organizationsStore.fetchMyPendingInvitations();
    } catch {
      // interceptor handles snackbar
    }
  },
  methods: {
    roleColor,
    /**
     * @desc Accept a pending owner_add invitation from the wall. Mirrors the
     *       My Organizations accept flow (deliberate small duplication, not a
     *       new abstraction): accept server-side, refresh the pending list,
     *       then soft-refresh abilities via token() — refreshAbilities() signs
     *       out + throws on failure, which must never follow a successful
     *       accept. If the refreshed user now has a currentOrganization, leave
     *       the wall the same way refresh() does.
     * @param {Object} invitation - The pending membership to accept.
     * @returns {Promise<void>}
     */
    async acceptInvitation(invitation) {
      const membershipId = invitation.id || invitation._id;
      if (!membershipId || this.acceptingId) return;
      this.acceptingId = membershipId;
      const authStore = useAuthStore();
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.acceptMembership(membershipId);
        await organizationsStore.fetchMyPendingInvitations();
        await authStore.token();
        if (authStore.user?.currentOrganization) {
          this.$router.push(this.config.sign.route);
        }
      } catch {
        // interceptor handles snackbar
      } finally {
        this.acceptingId = null;
      }
    },
    /**
     * @desc Soft-refresh the session ("Check status") and, if the user now has an
     *       organization, forward them into the app.
     * @returns {Promise<void>}
     */
    async refresh() {
      const authStore = useAuthStore();
      // Soft-refresh (token(), never throws) — refreshAbilities() signs out +
      // rethrows on failure, so a hiccup on "Check status" would eject the user.
      await authStore.token();
      if (authStore.user?.currentOrganization) {
        this.$router.push(this.config.sign.route);
      }
    },
    /**
     * @desc Send a join request for the given organization, then soft-refresh the
     *       session so any resulting membership/pending state is reflected.
     * @param {Object} org - The organization to request to join.
     * @returns {Promise<void>}
     */
    async requestToJoin(org) {
      const orgId = org.id || org._id;
      this.requestingOrgId = orgId;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.createJoinRequest(orgId);
        const authStore = useAuthStore();
        // Soft-refresh (token(), never throws). refreshAbilities() would sign the
        // user out before this try/catch could swallow the throw.
        await authStore.token();
      } catch {
        // interceptor handles snackbar
      } finally {
        this.requestingOrgId = null;
      }
    },
    /**
     * @desc Resend the email verification link.
     * @returns {Promise<void>}
     */
    async resendVerification() {
      this.resending = true;
      const authStore = useAuthStore();
      try {
        await authStore.resendVerification();
        this.resent = true;
      } catch {
        // silently handle — button stays enabled for retry
      } finally {
        this.resending = false;
      }
    },
    async signout() {
      const authStore = useAuthStore();
      const coreStore = useCoreStore();
      await authStore.signout();
      coreStore.refreshNav(authStore.isLoggedIn);
      this.$router.push('/');
    },
  },
};
</script>
