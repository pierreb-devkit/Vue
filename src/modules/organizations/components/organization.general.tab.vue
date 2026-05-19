<template>
  <v-container fluid>
    <!-- Content -->
    <v-row class="pa-2">
      <!-- Organization details -->
      <v-col cols="12" md="4">
        <v-card
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
          class="pa-6"
        >
          <h3 class="text-title-medium font-weight-medium mb-4">Details</h3>
          <v-form ref="form" v-model="valid">
            <label class="text-label-large font-weight-medium d-block mb-1">Organization Name</label>
            <v-text-field
              v-model="name"
              placeholder="Acme Inc."
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              :readonly="!canManage"
              hide-details="auto"
              class="mb-4"
            ></v-text-field>
            <label class="text-label-large font-weight-medium d-block mb-1">Description</label>
            <v-textarea
              v-model="description"
              placeholder="What does this organization do?"
              variant="outlined"
              density="comfortable"
              :readonly="!canManage"
              rows="3"
              hide-details="auto"
              class="mb-6"
            ></v-textarea>
            <v-btn
              v-if="canManage"
              :disabled="!dirty || !valid"
              color="primary"
              variant="flat"
              :class="config.vuetify.theme.rounded"
              class="text-none text-body-medium"
              block
              @click="update"
            >
              Save Changes
            </v-btn>
          </v-form>
        </v-card>

        <!-- Roles & Permissions -->
        <v-card
          v-if="Object.keys(roleDescriptions).length > 0"
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
          class="pa-6 mt-4"
        >
          <h3 class="text-title-medium font-weight-medium mb-4">Roles & Permissions</h3>
          <v-list density="compact" class="bg-transparent">
            <div v-for="(desc, role) in roleDescriptions" :key="role" class="d-flex align-start ga-3 mb-3">
              <v-chip :color="roleColor(role)" variant="tonal" size="small" class="text-capitalize" style="min-width: 70px; justify-content: center;">{{ role }}</v-chip>
              <span class="text-body-small text-medium-emphasis">{{ desc }}</span>
            </div>
          </v-list>
        </v-card>
      </v-col>

      <!-- Members section -->
      <v-col cols="12" md="8">
        <organizationsMembersComponent
          v-if="viewedOrganization"
          :organization-id="organizationId"
        />

        <!-- Invite Member (owner/admin only) -->
        <v-card
          v-if="canManage"
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
          class="pa-6 mb-4 mt-4"
        >
          <h3 class="text-title-medium font-weight-medium mb-4">Invite Member</h3>
          <v-form ref="inviteForm" v-model="inviteValid" @submit.prevent="sendInvite">
            <div class="d-flex ga-2 flex-column flex-sm-row align-end">
              <div class="flex-grow-1">
                <label class="text-label-large font-weight-medium d-block mb-1">Email address</label>
                <v-text-field
                  v-model="inviteEmail"
                  placeholder="colleague@example.com"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                ></v-text-field>
              </div>
              <v-btn
                color="primary"
                variant="flat"
                :class="config.vuetify.theme.rounded"
                class="text-none text-body-medium"
                :disabled="!inviteValid"
                :loading="inviteLoading"
                style="min-height: 48px;"
                :block="$vuetify.display.xs"
                @click="sendInvite"
              >
                Send Invite
              </v-btn>
            </div>
          </v-form>
          <v-alert v-if="inviteLink" type="info" variant="tonal" class="mt-2" closable @click:close="inviteLink = null">
            <span class="text-body-small">Invite link (share manually if no email was sent):</span>
            <div class="d-flex align-center mt-1 ga-2">
              <code class="text-body-small flex-grow-1 text-truncate">{{ inviteLink }}</code>
              <v-btn
                size="x-small"
                variant="tonal"
                :icon="copied ? 'fa-solid fa-check' : 'fa-solid fa-copy'"
                :color="copied ? 'success' : 'default'"
                @click="copyInviteLink"
              ></v-btn>
            </div>
          </v-alert>
        </v-card>

        <!-- Pending Join Requests (owner/admin only) -->
        <v-card
          v-if="canManage && pendingRequests.length > 0"
          color="surface"
          :flat="config.vuetify.theme.flat"
          :class="config.vuetify.theme.rounded"
          class="pa-6 mt-4"
        >
          <h3 class="text-title-medium font-weight-medium mb-4">
            Pending Join Requests
            <v-chip size="small" color="warning" class="ml-2">{{ pendingRequests.length }}</v-chip>
          </h3>
          <v-list lines="two">
            <v-list-item
              v-for="request in pendingRequests"
              :key="request._id || request.id"
            >
              <template #prepend>
                <v-avatar color="secondary" size="36">
                  <span class="text-white text-body-small font-weight-bold">
                    {{ (request.userId?.firstName || request.userId?.email || '?').charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title class="text-body-medium font-weight-medium">
                {{ request.userId?.firstName }} {{ request.userId?.lastName }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-body-small">
                {{ request.userId?.email }}
                <span class="text-medium-emphasis ml-2">{{ formatTimeAgo(request.createdAt) }}</span>
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  color="success"
                  variant="tonal"
                  size="small"
                  :class="config.vuetify.theme.rounded"
                  class="text-none mr-2"
                  :loading="requestActionLoading === (request._id || request.id)"
                  @click="approveRequest(request)"
                >
                  Approve
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  size="small"
                  :class="config.vuetify.theme.rounded"
                  class="text-none"
                  :loading="requestActionLoading === (request._id || request.id)"
                  @click="rejectRequest(request)"
                >
                  Reject
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { subject } from '@casl/ability';
import { ability } from '../../../lib/helpers/ability';
import { useOrganizationsStore } from '../stores/organizations.store';
import { useAuthStore } from '../../auth/stores/auth.store';
import roleColor from '../../../lib/helpers/roleColor';
import organizationsMembersComponent from './organizations.members.component.vue';

export default {
  name: 'OrganizationGeneralTab',
  components: {
    organizationsMembersComponent,
  },
  /**
   * @desc Guard against navigating away from this tab with unsaved changes.
   *       Mirrors the original guard from organization.view.vue (pre-C3).
   * @returns {boolean|undefined} false to cancel navigation, undefined to allow
   */
  beforeRouteLeave() {
    if (this.dirty) {
      const answer = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!answer) return false;
    }
  },
  props: {
    organizationId: { type: String, required: true },
  },
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      valid: false,
      dirty: false,
      pendingRequests: [],
      requestActionLoading: null,
      inviteEmail: '',
      inviteValid: false,
      inviteLoading: false,
      inviteLink: null,
      copied: false,
      rules: {
        required: (v) => !!v || 'Required',
        email: (v) => /\S+@\S+\.\S+/.test(v) || 'Valid email required',
      },
    };
  },
  computed: {
    viewedOrganization() {
      const organizationsStore = useOrganizationsStore();
      return organizationsStore.viewedOrganization;
    },
    roleDescriptions() {
      return this.authStore.serverConfig?.organizations?.roleDescriptions || {};
    },
    canManage() {
      if (ability && ability.rules && ability.rules.length > 0) {
        return ability.can('update', subject('Organization', { _id: this.organizationId }));
      }
      return false;
    },
    name: {
      get() { return this.viewedOrganization ? this.viewedOrganization.name : ''; },
      set(value) {
        const organizationsStore = useOrganizationsStore();
        if (organizationsStore.viewedOrganization) {
          organizationsStore.viewedOrganization.name = value;
          this.dirty = true;
        }
      },
    },
    description: {
      get() { return this.viewedOrganization ? this.viewedOrganization.description : ''; },
      set(value) {
        const organizationsStore = useOrganizationsStore();
        if (organizationsStore.viewedOrganization) {
          organizationsStore.viewedOrganization.description = value;
          this.dirty = true;
        }
      },
    },
  },
  async created() {
    if (this.organizationId) {
      await this.loadPendingRequests();
    }
  },
  methods: {
    roleColor,
    async update() {
      const form = await this.$refs.form.validate();
      if (form.valid) {
        const organizationsStore = useOrganizationsStore();
        try {
          await organizationsStore.updateOrganization(this.organizationId, {
            name: this.name,
            description: this.description,
          });
          this.dirty = false;
        } catch {
          // interceptor handles snackbar
        }
      }
    },
    async loadPendingRequests() {
      const organizationsStore = useOrganizationsStore();
      try {
        this.pendingRequests = await organizationsStore.fetchPendingRequests(this.organizationId);
      } catch {
        // User may not have permission — ignore
      }
    },
    async approveRequest(request) {
      const requestId = request._id || request.id;
      this.requestActionLoading = requestId;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.approveRequest(this.organizationId, requestId);
        this.pendingRequests = this.pendingRequests.filter((r) => (r._id || r.id) !== requestId);
        await organizationsStore.fetchMembers(this.organizationId);
      } catch {
        // interceptor handles snackbar
      } finally {
        this.requestActionLoading = null;
      }
    },
    async sendInvite() {
      const form = await this.$refs.inviteForm.validate();
      if (!form.valid) return;
      this.inviteLoading = true;
      const organizationsStore = useOrganizationsStore();
      try {
        const result = await organizationsStore.inviteMember(this.organizationId, this.inviteEmail);
        const front = `${this.config.api.protocol}://${this.config.api.host}`;
        this.inviteLink = `${front}/invite?token=${result.inviteToken}`;
        this.inviteEmail = '';
        this.$refs.inviteForm.reset();
      } catch {
        // interceptor handles snackbar
      } finally {
        this.inviteLoading = false;
      }
    },
    /**
     * @desc Format a date as a relative time string.
     * @param {string|Date} date - The date to format
     * @returns {string} Relative time string (e.g. "5m ago", "2d ago")
     */
    formatTimeAgo(date) {
      if (!date) return '';
      const now = new Date();
      const then = new Date(date);
      const diffMs = now - then;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    },
    /**
     * @desc Copy the invite link to clipboard.
     * @returns {Promise<void>}
     */
    async copyInviteLink() {
      try {
        await navigator.clipboard.writeText(this.inviteLink);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      } catch {
        // fallback: select text manually
      }
    },
    async rejectRequest(request) {
      const requestId = request._id || request.id;
      this.requestActionLoading = requestId;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.rejectRequest(this.organizationId, requestId);
        this.pendingRequests = this.pendingRequests.filter((r) => (r._id || r.id) !== requestId);
      } catch {
        // interceptor handles snackbar
      } finally {
        this.requestActionLoading = null;
      }
    },
  },
};
</script>
