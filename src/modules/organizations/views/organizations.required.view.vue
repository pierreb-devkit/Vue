<template>
  <v-container style="max-width: 520px">
    <v-card class="mt-10 pa-8 pa-sm-10" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
      <h3 class="text-headline-small font-weight-bold text-center">Organization Required</h3>
      <p class="text-body-medium text-medium-emphasis text-center mt-1 mb-6">
        You need to belong to an organization to access the application.
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

      <!-- Domain-matched organizations -->
      <template v-if="domainOrgs.length > 0">
        <label class="text-label-large font-weight-medium d-block mb-2">Organizations matching your email domain</label>
        <v-list density="compact" class="mb-4">
          <v-list-item
            v-for="org in domainOrgs"
            :key="org.id || org._id"
          >
            <template #prepend>
              <v-avatar :color="orgColor(org)" size="32" class="mr-3">
                <span class="text-label-small font-weight-bold">{{ (org.name || '?').charAt(0).toUpperCase() }}</span>
              </v-avatar>
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
import orgColor from '../../../lib/helpers/orgColor';

export default {
  name: 'OrganizationsRequiredView',
  data() {
    return {
      domainOrgs: [],
      requestingOrgId: null,
      resending: false,
      resent: false,
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
  },
  async created() {
    // Auto-load organizations matching the user's email domain
    const organizationsStore = useOrganizationsStore();
    try {
      this.domainOrgs = await organizationsStore.searchOrganizationsByDomain();
    } catch {
      this.domainOrgs = [];
    }
  },
  methods: {
    orgColor,
    async refresh() {
      const authStore = useAuthStore();
      await authStore.refreshAbilities();
      if (authStore.user?.currentOrganization) {
        this.$router.push(this.config.sign.route);
      }
    },
    async requestToJoin(org) {
      const orgId = org.id || org._id;
      this.requestingOrgId = orgId;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.createJoinRequest(orgId);
        const authStore = useAuthStore();
        await authStore.refreshAbilities();
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
