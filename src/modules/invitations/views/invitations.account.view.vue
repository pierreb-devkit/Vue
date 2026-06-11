<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <!-- Error banner (surfaced from the invitations store) -->
      <v-col v-if="error" cols="12">
        <v-alert
          type="error"
          variant="tonal"
          density="compact"
          closable
          :class="config.vuetify.theme.rounded"
          icon="fa-solid fa-circle-exclamation"
          @click:close="clearError"
        >
          <span class="text-body-medium">{{ error }}</span>
        </v-alert>
      </v-col>

      <!-- Invite a contact -->
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
          <div class="d-flex align-center mb-2">
            <v-icon icon="fa-solid fa-gift" color="primary" class="mr-3"></v-icon>
            <span class="text-title-large">Invite a contact</span>
          </div>
          <p class="text-body-medium text-medium-emphasis mb-4">
            Share the platform with someone you know. They'll receive an email invitation to join.
          </p>
          <v-form ref="inviteForm" v-model="inviteForm.valid" @submit.prevent="submitInvite">
            <div class="d-flex flex-column flex-sm-row ga-3">
              <v-text-field
                v-model="inviteForm.email"
                label="Email address"
                :rules="[rules.required, rules.mail]"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                class="flex-grow-1"
              ></v-text-field>
              <v-btn
                type="submit"
                color="primary"
                variant="flat"
                size="large"
                :class="config.vuetify.theme.rounded"
                class="text-none"
                :loading="inviteForm.loading"
                :disabled="inviteForm.valid !== true"
              >
                <v-icon start icon="fa-solid fa-paper-plane"></v-icon>
                Send invite
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>

      <!-- My invitations -->
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
          <div class="d-flex align-center mb-4">
            <v-icon icon="fa-solid fa-envelope" color="primary" class="mr-3"></v-icon>
            <span class="text-title-large">My invitations</span>
          </div>
          <coreDataTableComponent :headers="inviteHeaders" :items="invitations" :fetch-action="fetchInvitations" :search="false">
            <template #status="{ item }">
              <v-chip :color="inviteStatus(item).color" size="small" variant="tonal">{{ inviteStatus(item).label }}</v-chip>
            </template>
          </coreDataTableComponent>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useInvitationsStore } from '../stores/invitations.store';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';

/**
 * Component definition — account "Referrals" tab.
 *
 * The user-facing surface of the standalone `invitations` module: invite a
 * contact (platform invite via `/api/invitations`) + see the status of the
 * invitations I've sent. Rendered inside the account layout as an injected
 * `/users/invitations` child route + a config-contributed `users.extraTabs`
 * entry, both gated by `isModuleActive('invitations')`.
 *
 * P8b expands this into the full referrals experience (referral attribution,
 * rewards). This phase ships the invite-a-contact + my-invites foundation.
 */
export default {
  name: 'InvitationsAccount',
  components: { coreDataTableComponent },
  /**
   * @desc Reactive state: invite form, table headers, validation rules.
   * @returns {Object}
   */
  data() {
    return {
      inviteForm: { email: '', valid: false, loading: false },
      inviteHeaders: [
        { text: 'Email', value: 'email', kind: 'email' },
        { text: 'Status', value: 'status', kind: 'slot', slotName: 'status' },
        { text: 'Sent', value: 'createdAt', kind: 'date', format: 'DD/MM/YY HH:mm' },
        { text: 'Expires', value: 'expiresAt', kind: 'date', format: 'DD/MM/YY' },
      ],
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
      },
    };
  },
  computed: {
    /**
     * @desc The invitations list from the invitations store.
     * @returns {Array}
     */
    invitations() {
      return useInvitationsStore().invitations;
    },
    /**
     * @desc Global error from the invitations store (surfaced as a banner).
     * @returns {string|null}
     */
    error() {
      return useInvitationsStore().error;
    },
  },
  methods: {
    /**
     * @desc Load the invitations list (passed to the datatable's fetch-action).
     * @returns {Promise<void>}
     */
    async fetchInvitations() {
      await useInvitationsStore().getInvitations();
    },
    /**
     * @desc Derive a status label + color from an invitation's lifecycle fields.
     * @param {Object} item - invitation
     * @returns {{ label: string, color: string }}
     */
    inviteStatus(item) {
      if (item.usedAt) return { label: 'Accepted', color: 'success' };
      if (item.expiresAt && new Date(item.expiresAt).getTime() < Date.now()) return { label: 'Expired', color: 'error' };
      return { label: 'Pending', color: 'warning' };
    },
    /**
     * @desc Submit a new invitation, then refresh the list and reset the form.
     * @returns {Promise<void>}
     */
    async submitInvite() {
      if (this.inviteForm.valid !== true) return;
      this.inviteForm.loading = true;
      try {
        await useInvitationsStore().createInvitation(this.inviteForm.email);
        this.inviteForm.email = '';
        this.$refs.inviteForm?.resetValidation?.();
        await this.fetchInvitations();
      } catch {
        // error is surfaced via the store error banner
      } finally {
        this.inviteForm.loading = false;
      }
    },
    /**
     * @desc Clear the invitations store error banner.
     * @returns {void}
     */
    clearError() {
      useInvitationsStore().error = null;
    },
  },
};
</script>
