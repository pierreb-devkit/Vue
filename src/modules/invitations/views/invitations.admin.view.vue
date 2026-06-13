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

      <v-col cols="12">
        <coreDataTableComponent :headers="inviteHeaders" :items="invitations" :fetch-action="fetchInvitations" :search="false">
          <!-- Card-level action: the Invite button lives inside the datatable card
               title (top-right — no search on this table), like other admin tabs. -->
          <template #toolbar>
            <v-btn
              color="primary"
              variant="tonal"
              :class="config.vuetify.theme.rounded"
              class="text-none text-body-medium"
              @click="openCreate"
            >
              <v-icon icon="fa-solid fa-envelope" size="small" class="mr-2"></v-icon>
              Invite
            </v-btn>
          </template>
          <template #status="{ item }">
            <v-chip :color="inviteStatus(item).color" size="small" variant="tonal">{{ inviteStatus(item).label }}</v-chip>
          </template>
          <template #invitedBy="{ item }">
            {{ item.invitedBy?.email || '—' }}
          </template>
          <template #actions="{ item }">
            <v-btn
              icon="fa-solid fa-paper-plane"
              size="small"
              variant="text"
              color="primary"
              aria-label="Resend invitation"
              :loading="resendingId === (item.id || item._id)"
              :disabled="item.status !== 'pending'"
              :data-test="`resend-invitation-${item.id || item._id}`"
              @click="resendInvite(item)"
            ></v-btn>
            <v-btn
              icon="fa-solid fa-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!!item.usedAt || !!item.revokedAt || item.status === 'revoked'"
              @click="openRevoke(item)"
            ></v-btn>
          </template>
        </coreDataTableComponent>
      </v-col>
    </v-row>

    <!-- Create invite dialog — flips to a one-time copy-link panel after create -->
    <v-dialog v-model="createDialog.show" max-width="460">
      <v-card :class="config.vuetify.theme.rounded">
        <v-card-title>Invite a user</v-card-title>
        <template v-if="!createDialog.createdLink">
          <v-card-text>
            <v-form ref="createForm" v-model="createDialog.valid">
              <v-text-field
                v-model="createDialog.email"
                label="Email address"
                :rules="[rules.required, rules.mail]"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" @click="createDialog.show = false">Cancel</v-btn>
            <v-btn color="primary" variant="flat" :loading="createDialog.loading" :disabled="createDialog.valid !== true" @click="submitInvite">Send invite</v-btn>
          </v-card-actions>
        </template>
        <template v-else>
          <v-card-text data-test="invite-created-link">
            <p class="text-body-medium text-medium-emphasis mb-2">
              Invitation sent. This signup link is shown only once — the list never exposes it again.
            </p>
            <code class="text-body-small">{{ createDialog.createdLink }}</code>
          </v-card-text>
          <v-card-actions>
            <v-btn variant="text" @click="createDialog.show = false">Close</v-btn>
            <v-btn color="primary" variant="tonal" data-test="copy-invite-link" @click="copyCreatedLink">
              <v-icon start icon="fa-solid fa-copy" size="small"></v-icon>
              {{ createDialog.copied ? 'Copied' : 'Copy link' }}
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>

    <!-- Revoke confirmation -->
    <coreConfirmDialog
      v-model="deleteDialog.show"
      title="Revoke invitation"
      :message="`Revoke the invitation for ${deleteDialog.email}?`"
      confirm-label="Revoke"
      confirm-color="error"
      @confirm="confirmRevoke"
    ></coreConfirmDialog>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { useInvitationsStore } from '../stores/invitations.store';
import { inviteStatus as deriveInviteStatus } from '../lib/invitations.status';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

/**
 * Component definition — admin platform-invitations management tab.
 *
 * Moved out of the admin module into the standalone `invitations` module
 * (invitations↔org decouple, P6). Renders inside the admin layout as an
 * injected child route + config-contributed tab; the management UI itself is
 * unchanged from the former `admin.invitations.view.vue`, only its store
 * dependency is repointed to the dedicated invitations store.
 */
export default {
  name: 'InvitationsAdmin',
  components: { coreDataTableComponent, coreConfirmDialog },
  /**
   * @desc Reactive state: table headers, create + revoke dialog state, form rules.
   * @returns {Object}
   */
  data() {
    return {
      inviteHeaders: [
        { text: 'Email', value: 'email', kind: 'email' },
        { text: 'Status', value: 'status', kind: 'slot', slotName: 'status' },
        { text: 'Invited by', value: 'invitedBy', kind: 'slot', slotName: 'invitedBy' },
        { text: 'Created', value: 'createdAt', kind: 'date', format: 'DD/MM/YY HH:mm' },
        { text: 'Expires', value: 'expiresAt', kind: 'date', format: 'DD/MM/YY' },
        { text: 'Actions', value: 'actions', kind: 'slot', slotName: 'actions' },
      ],
      createDialog: { show: false, email: '', valid: false, loading: false, createdLink: null, copied: false },
      deleteDialog: { show: false, id: null, email: '' },
      // Single-flight guard for the resend icon-button (id in flight, or null).
      resendingId: null,
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
     * @desc Shared status derivation (lib/invitations.status — revoked-aware).
     * @param {Object} item - invitation
     * @returns {{ label: string, color: string }}
     */
    inviteStatus(item) {
      return deriveInviteStatus(item);
    },
    /**
     * @desc Open the create-invite dialog (reset fields).
     * @returns {void}
     */
    openCreate() {
      this.createDialog = { show: true, email: '', valid: false, loading: false, createdLink: null, copied: false };
    },
    /**
     * @desc Submit a new invitation. On success the dialog STAYS OPEN showing
     * the one-time signup link (the list strips tokens server-side, so the
     * link can only be built here, from the create response).
     * @returns {Promise<void>}
     */
    async submitInvite() {
      this.createDialog.loading = true;
      try {
        const created = await useInvitationsStore().createInvitation(this.createDialog.email);
        await this.fetchInvitations();
        const link = this.signupLink(created?.token);
        if (link) {
          this.createDialog.createdLink = link;
          this.createDialog.copied = false;
        } else {
          this.createDialog.show = false;
        }
      } catch {
        // error is surfaced via the view's own error banner (invitations store)
      } finally {
        this.createDialog.loading = false;
      }
    },
    /**
     * @desc Open the revoke confirmation for an invitation.
     * @param {Object} item - invitation
     * @returns {void}
     */
    openRevoke(item) {
      this.deleteDialog = { show: true, id: item.id || item._id, email: item.email };
    },
    /**
     * @desc Confirm revoke: delete then refresh and close.
     * @returns {Promise<void>}
     */
    async confirmRevoke() {
      try {
        await useInvitationsStore().deleteInvitation(this.deleteDialog.id);
        await this.fetchInvitations();
      } catch {
        // error is surfaced via the view's own error banner (invitations store)
      } finally {
        this.deleteDialog.show = false;
      }
    },
    /**
     * @desc Build the one-time signup link for a freshly created invitation.
     * @param {string|undefined} token - invitation token from the create response
     * @returns {string|null} the absolute signup link, or null without a token
     */
    signupLink(token) {
      if (!token) return null;
      const base = (this.config.app?.url || window.location.origin).replace(/\/+$/, '');
      return `${base}/signup?inviteToken=${encodeURIComponent(token)}`;
    },
    /**
     * @desc Copy the one-time signup link. Feedback is a local label flip
     * ('Copy link' → 'Copied') — the global snackbar is interceptor-only and
     * a clipboard write is not an HTTP call.
     * @returns {Promise<void>}
     */
    async copyCreatedLink() {
      try {
        await navigator.clipboard.writeText(this.createDialog.createdLink);
        this.createDialog.copied = true;
      } catch {
        // Clipboard unavailable (permissions / insecure context): the link
        // stays visible above for manual selection.
      }
    },
    /**
     * @desc Re-send the invitation email (single global in-flight guard — only
     * one resend at a time across all rows). The POST response toasts via the
     * axios interceptor; errors land in the banner.
     * @param {Object} item - invitation row
     * @returns {Promise<void>}
     */
    async resendInvite(item) {
      const id = item.id || item._id;
      if (!id || this.resendingId) return;
      this.resendingId = id;
      try {
        await useInvitationsStore().resendInvitation(id);
      } catch {
        // error is surfaced via the view's own error banner (invitations store)
      } finally {
        this.resendingId = null;
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
