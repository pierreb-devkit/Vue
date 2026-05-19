<template>
  <template v-if="suggestedJoin">
    <v-snackbar
      v-model="visible"
      location="top right"
      color="info"
      :timeout="-1"
      multi-line
    >
      <span class="text-body-medium">
        <v-icon icon="fa-solid fa-building" size="small" class="mr-1" />
        There may already be a workspace for <strong>{{ suggestedJoin.orgName }}</strong>. Request access?
      </span>
      <template #actions>
        <v-btn
          variant="text"
          size="small"
          class="text-none"
          :loading="loading"
          @click="requestAccess"
        >
          Request access
        </v-btn>
        <v-btn variant="text" size="small" icon="$close" @click="dismiss" />
      </template>
    </v-snackbar>

    <v-snackbar
      v-model="feedback.visible"
      location="top right"
      :color="feedback.color"
      :timeout="4000"
    >
      {{ feedback.text }}
    </v-snackbar>
  </template>
</template>

<script>
/**
 * Module dependencies.
 */
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';

/**
 * Benign terminal error messages returned by the backend.
 * These are NOT product errors — they indicate a resolved or pre-existing state.
 * @type {string[]}
 */
const BENIGN_MESSAGES = [
  'already a member',
  'a pending request already exists',
  'pending request already exists',
  'organization not found',
];

/**
 * Determine whether a thrown axios error is a benign terminal state.
 * Benign = 404 (org deleted) OR message matches a known terminal phrase.
 * @param {unknown} err - The caught error
 * @returns {boolean}
 */
function isBenign(err) {
  if (!err || !err.response) return false;
  const { status, data } = err.response;
  if (status === 404) return true;
  const desc = (data?.description || '').toLowerCase();
  return BENIGN_MESSAGES.some((phrase) => desc.includes(phrase));
}

/**
 * Human-readable neutral message for each benign state.
 * @param {unknown} err - The caught error
 * @returns {string}
 */
function benignMessage(err) {
  const status = err?.response?.status;
  const desc = (err?.response?.data?.description || '').toLowerCase();
  if (status === 404 || desc.includes('organization not found')) {
    return 'That workspace no longer exists.';
  }
  if (desc.includes('already a member')) {
    return "You're already a member of that workspace.";
  }
  // pending request / one-pending-cap
  return 'Request already sent. Awaiting approval.';
}

/**
 * Component definition.
 */
export default {
  name: 'OrganizationsSuggestedJoinBanner',

  data: () => ({
    visible: true,
    loading: false,
    feedback: {
      visible: false,
      color: 'success',
      text: '',
    },
  }),

  computed: {
    /**
     * @desc The suggestedJoin payload from the auth store ({ orgId, orgName } | null).
     * @returns {{ orgId: string, orgName: string } | null}
     */
    suggestedJoin() {
      return useAuthStore().suggestedJoin;
    },
  },

  methods: {
    /**
     * @desc Request to join the suggested organization.
     * Success → success toast + dismiss.
     * Benign rejection → neutral info toast + dismiss.
     * Genuine error → error toast, do NOT dismiss (user can retry).
     * @returns {Promise<void>}
     */
    async requestAccess() {
      if (!this.suggestedJoin) return;
      this.loading = true;
      const organizationsStore = useOrganizationsStore();
      try {
        await organizationsStore.createJoinRequest(this.suggestedJoin.orgId);
        this.showFeedback('success', 'Request sent. An admin will review it shortly.');
        useAuthStore().dismissSuggestedJoin();
      } catch (err) {
        if (isBenign(err)) {
          this.showFeedback('info', benignMessage(err));
          useAuthStore().dismissSuggestedJoin();
        } else {
          this.showFeedback('error', 'Something went wrong. Please try again.');
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * @desc Dismiss the banner permanently (persisted via auth store).
     * @returns {void}
     */
    dismiss() {
      useAuthStore().dismissSuggestedJoin();
    },

    /**
     * @desc Show a feedback snackbar with the given color and message.
     * @param {'success'|'info'|'error'} color
     * @param {string} text
     * @returns {void}
     */
    showFeedback(color, text) {
      this.feedback = { visible: true, color, text };
    },
  },
};
</script>
