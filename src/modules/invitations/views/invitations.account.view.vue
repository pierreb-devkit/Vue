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
          <!-- #3833/#4500 open-signup state: with signup open, the server never
               claims/finalizes an invite token (invitation.accepted never fires),
               so soliciting invites here would normally promise a referral that
               can never convert — UNLESS the deployment explicitly opts in via
               user-facing invitations (userFacingInvitations), in which case the
               form is shown regardless of the signup state. Informational state
               only when open signup AND that opt-in is off; list stays below. -->
          <v-alert
            v-if="signupOpen && !userFacingInvitations"
            type="info"
            variant="tonal"
            density="compact"
            :class="config.vuetify.theme.rounded"
            data-test="referrals-open-signup-alert"
          >
            <span class="text-body-medium">Referral invitations are inactive on this deployment because public signup is open.</span>
          </v-alert>
          <template v-else>
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
            <!-- One-time copy-link: built from the create response only (the list
                 endpoint strips tokens). Local label-flip feedback — the global
                 snackbar is interceptor-only and a copy is not an HTTP call. -->
            <v-alert
              v-if="createdLink"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-4"
              :class="config.vuetify.theme.rounded"
              data-test="invite-created-link"
              closable
              @click:close="createdLink = null"
            >
              <div class="d-flex align-center flex-wrap ga-2">
                <span class="text-body-medium flex-grow-1">
                  Invitation sent. This signup link is shown only once:
                  <code class="text-body-small d-block mt-1">{{ createdLink }}</code>
                </span>
                <v-btn
                  color="success"
                  variant="tonal"
                  size="small"
                  :class="config.vuetify.theme.rounded"
                  class="text-none"
                  data-test="copy-invite-link"
                  @click="copyCreatedLink"
                >
                  <v-icon start icon="fa-solid fa-copy" size="x-small"></v-icon>
                  {{ linkCopied ? 'Copied' : 'Copy link' }}
                </v-btn>
              </div>
            </v-alert>
          </template>
        </v-card>
      </v-col>

      <!-- My referrals: summary header + the invitations list -->
      <v-col cols="12">
        <v-card color="surface" :flat="config.vuetify.theme.flat" :class="config.vuetify.theme.rounded" class="pa-6">
          <div class="d-flex align-center flex-wrap ga-2 mb-4">
            <v-icon icon="fa-solid fa-users" color="primary" class="mr-1"></v-icon>
            <span class="text-title-large">My referrals</span>
            <v-spacer></v-spacer>
            <!-- Counts derived from the list below (same derivation as the status chips) -->
            <div class="d-flex align-center flex-wrap ga-2" data-test="referrals-summary">
              <v-chip size="small" variant="tonal">{{ referralSummary.total }} invited</v-chip>
              <v-chip size="small" variant="tonal" color="success">{{ referralSummary.joined }} joined</v-chip>
              <v-chip size="small" variant="tonal" color="warning">{{ referralSummary.pending }} pending</v-chip>
              <v-chip v-if="referralSummary.expired" size="small" variant="tonal" color="error">{{ referralSummary.expired }} expired</v-chip>
              <v-chip v-if="referralSummary.revoked" size="small" variant="tonal">
                {{ referralSummary.revoked }} revoked
              </v-chip>
            </div>
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
import { useAuthStore } from '../../auth/stores/auth.store';
import { inviteStatus as deriveInviteStatus } from '../lib/invitations.status';
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
 * P8b frames this as the referrals experience: a summary header (counts by
 * status, derived from the same list the table shows). The credit grant path
 * lives server-side (billing referral service, #4504 removed the stale
 * "coming soon" placeholder once it shipped) — ZERO credit math/logic here.
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
      // One-time copy-link state — set from the create response only.
      createdLink: null,
      linkCopied: false,
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
    /**
     * @desc Referrals summary counts, derived from the invitations list through
     * the SAME per-row derivation as the table's status chips (`inviteStatus`)
     * so the header and the list can never disagree. Pure derivation — no
     * endpoint, no credit math (rewards are a later phase, #5).
     * @returns {{ total: number, joined: number, pending: number, expired: number, revoked: number }}
     */
    referralSummary() {
      return this.invitations.reduce(
        (counts, item) => {
          const { label } = this.inviteStatus(item);
          if (label === 'Accepted') counts.joined += 1;
          else if (label === 'Expired') counts.expired += 1;
          else if (label === 'Revoked') counts.revoked += 1;
          else counts.pending += 1;
          return counts;
        },
        { total: this.invitations.length, joined: 0, pending: 0, expired: 0, revoked: 0 },
      );
    },
    /**
     * @desc Whether the deployment has PUBLIC signup open, from the server auth
     * config (GET /api/auth/config → authStore.serverConfig.sign.up; loaded by the
     * global router guard for any logged-in navigation). When open, the referral
     * substrate is inert by design — a presented token is resolved but never
     * claimed/finalized — so the invite form is replaced by an informational
     * state. Uses strict equality (`=== true`) so an unknown/missing
     * serverConfig keeps the form shown (the backend policy is the actual gate).
     * @returns {boolean}
     */
    signupOpen() {
      return useAuthStore().serverConfig?.sign?.up === true;
    },
    /**
     * @desc Whether this deployment opts in to user-facing invitations (the
     * invite form stays available even with public signup open) from the
     * server auth config. Defaults to false — an unknown/missing exposure
     * (older backend, config not loaded yet) keeps today's behavior: the
     * form is gated behind `signupOpen` alone.
     * @returns {boolean}
     */
    userFacingInvitations() {
      return useAuthStore().serverConfig?.invitations?.userFacing === true;
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
     * @desc Submit a new invitation, surface the one-time signup link from the
     * create response (the list strips tokens), then refresh and reset the form.
     * @returns {Promise<void>}
     */
    async submitInvite() {
      if (this.inviteForm.valid !== true) return;
      this.inviteForm.loading = true;
      try {
        const created = await useInvitationsStore().createInvitation(this.inviteForm.email);
        this.createdLink = this.signupLink(created?.token);
        this.linkCopied = false;
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
     * @desc Copy the one-time signup link — local 'Copy link' → 'Copied' flip.
     * @returns {Promise<void>}
     */
    async copyCreatedLink() {
      try {
        await navigator.clipboard.writeText(this.createdLink);
        this.linkCopied = true;
      } catch {
        // Clipboard unavailable: the link stays visible for manual selection.
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
