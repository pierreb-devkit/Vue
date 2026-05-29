<template>
  <v-container fluid>
    <v-row class="pa-2 mt-0">
      <v-col cols="12" class="d-flex justify-end">
        <v-btn color="primary" variant="flat" :class="config.vuetify.theme.rounded" class="text-none" @click="openCreate">
          <v-icon start icon="fa-solid fa-envelope"></v-icon>
          Invite
        </v-btn>
      </v-col>
      <v-col cols="12">
        <coreDataTableComponent :headers="inviteHeaders" :items="invitations" :fetch-action="fetchInvitations" :search="false">
          <template #status="{ item }">
            <v-chip :color="inviteStatus(item).color" size="small" variant="tonal">{{ inviteStatus(item).label }}</v-chip>
          </template>
          <template #invitedBy="{ item }">
            {{ item.invitedBy?.email || '—' }}
          </template>
          <template #actions="{ item }">
            <v-btn
              icon="fa-solid fa-trash"
              size="small"
              variant="text"
              color="error"
              :disabled="!!item.usedAt"
              @click="openRevoke(item)"
            ></v-btn>
          </template>
        </coreDataTableComponent>
      </v-col>
    </v-row>

    <!-- Create invite dialog -->
    <v-dialog v-model="createDialog.show" max-width="460">
      <v-card :class="config.vuetify.theme.rounded">
        <v-card-title>Invite a user</v-card-title>
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
import { useAdminStore } from '../stores/admin.store';
import coreDataTableComponent from '../../core/components/core.datatable.component.vue';
import coreConfirmDialog from '../../core/components/core.confirmDialog.component.vue';

/**
 * Component definition — admin invitations management tab.
 */
export default {
  name: 'AdminInvitations',
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
      createDialog: { show: false, email: '', valid: false, loading: false },
      deleteDialog: { show: false, id: null, email: '' },
      rules: {
        required: (v) => !!v || 'Required',
        mail: (v) => /\S+@\S+\.\S+/.test(v) || 'E-mail must be valid',
      },
    };
  },
  computed: {
    /**
     * @desc The invitations list from the admin store.
     * @returns {Array}
     */
    invitations() {
      return useAdminStore().invitations;
    },
  },
  methods: {
    /**
     * @desc Load the invitations list (passed to the datatable's fetch-action).
     * @returns {Promise<void>}
     */
    async fetchInvitations() {
      await useAdminStore().getInvitations();
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
     * @desc Open the create-invite dialog (reset fields).
     * @returns {void}
     */
    openCreate() {
      this.createDialog = { show: true, email: '', valid: false, loading: false };
    },
    /**
     * @desc Submit a new invitation, then refresh the list and close the dialog.
     * @returns {Promise<void>}
     */
    async submitInvite() {
      this.createDialog.loading = true;
      try {
        await useAdminStore().createInvitation(this.createDialog.email);
        await this.fetchInvitations();
        this.createDialog.show = false;
      } catch {
        // error is surfaced via the admin layout banner (store.error)
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
        await useAdminStore().deleteInvitation(this.deleteDialog.id);
        await this.fetchInvitations();
      } catch {
        // error surfaced via store.error
      } finally {
        this.deleteDialog.show = false;
      }
    },
  },
};
</script>
