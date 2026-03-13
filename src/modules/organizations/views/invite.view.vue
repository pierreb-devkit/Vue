<template>
  <v-container :style="`max-width: ${config.vuetify.theme.maxWidth}`">
    <v-row align="start" justify="center">
      <v-card class="mt-8 pa-8" width="100%" color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded">
        <!-- Loading state -->
        <div v-if="loading" class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <p class="text-body-medium text-medium-emphasis mt-4">Loading invite details...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center pa-8">
          <v-icon icon="fa-solid fa-circle-exclamation" size="x-large" color="error" class="mb-4"></v-icon>
          <h3 class="text-headline-small font-weight-bold mb-2">Invalid Invite</h3>
          <p class="text-body-medium text-medium-emphasis">{{ error }}</p>
          <v-btn color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium mt-4" to="/">
            Go Home
          </v-btn>
        </div>

        <!-- Accepted state -->
        <div v-else-if="accepted" class="text-center pa-8">
          <v-icon icon="fa-solid fa-circle-check" size="x-large" color="success" class="mb-4"></v-icon>
          <h3 class="text-headline-small font-weight-bold mb-2">Invitation Accepted</h3>
          <p class="text-body-medium text-medium-emphasis">
            You have joined {{ invite?.organizationId?.name || 'the organization' }}.
          </p>
          <v-btn color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none text-body-medium mt-4" to="/users">
            Go to Account
          </v-btn>
        </div>

        <!-- Invite details -->
        <div v-else-if="invite" class="text-center pa-8">
          <v-icon icon="fa-solid fa-envelope-open-text" size="x-large" color="primary" class="mb-4"></v-icon>
          <h3 class="text-headline-small font-weight-bold mb-2">You're Invited</h3>
          <p class="text-body-medium text-medium-emphasis mb-6">
            You have been invited to join <strong>{{ invite.organizationId?.name || 'an organization' }}</strong>.
          </p>
          <v-btn
            color="primary"
            variant="flat"
            :class="config.vuetify.theme.rounded"
            class="text-none text-body-medium"
            :loading="accepting"
            @click="accept"
          >
            Accept Invitation
          </v-btn>
        </div>
      </v-card>
    </v-row>
  </v-container>
</template>

<script>
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';

export default {
  name: 'InviteView',
  data() {
    return {
      loading: true,
      error: null,
      invite: null,
      accepting: false,
      accepted: false,
    };
  },
  computed: {
    token() {
      return this.$route.query.token;
    },
  },
  async created() {
    const authStore = useAuthStore();
    if (!authStore.isLoggedIn) {
      this.$router.push(`/signin?redirect=${encodeURIComponent(`/invite?token=${this.token}`)}`);
      return;
    }
    await this.loadInvite();
  },
  methods: {
    /**
     * @desc Load invite details from the API using the token query param.
     * @returns {Promise<void>}
     */
    async loadInvite() {
      const organizationsStore = useOrganizationsStore();
      try {
        this.invite = await organizationsStore.getInvite(this.token);
      } catch {
        this.error = 'This invite link is invalid or has expired.';
      } finally {
        this.loading = false;
      }
    },
    /**
     * @desc Accept the organization invite and refresh user abilities.
     * @returns {Promise<void>}
     */
    async accept() {
      this.accepting = true;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.acceptInvite(this.token);
        const authStore = useAuthStore();
        await authStore.refreshAbilities();
        this.accepted = true;
      } catch {
        this.error = 'Failed to accept the invite. It may have expired or already been used.';
      } finally {
        this.accepting = false;
      }
    },
  },
};
</script>
