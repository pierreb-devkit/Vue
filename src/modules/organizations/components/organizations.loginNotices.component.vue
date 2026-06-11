<template>
  <!-- Suggested workspace join — top-right, persistent until acted on -->
  <v-snackbar
    v-if="suggestedJoin"
    v-model="suggested.visible"
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
        :loading="suggested.loading"
        @click="requestAccess"
      >
        Request access
      </v-btn>
      <v-btn variant="text" size="small" icon="$close" :disabled="suggested.loading" @click="dismissSuggested" />
    </template>
  </v-snackbar>

  <v-snackbar
    v-model="suggested.feedback.visible"
    location="top right"
    :color="suggested.feedback.color"
    :timeout="4000"
  >
    {{ suggested.feedback.text }}
  </v-snackbar>

  <!-- Pending-invitations nudge — centered, once per login session -->
  <v-snackbar v-model="nudgeVisible" location="center" color="info" :timeout="8000" multi-line data-test="pending-invitations-nudge">
    <span class="text-body-medium">
      <v-icon icon="fa-solid fa-envelope-open-text" size="small" class="mr-1" />
      You have <strong>{{ count }}</strong> pending organization invitation{{ count > 1 ? 's' : '' }}
    </span>
    <template #actions>
      <v-btn
        variant="text"
        size="small"
        class="text-none"
        to="/users/organizations"
        data-test="pending-invitations-nudge-view"
        @click="dismissNudge"
      >
        View
      </v-btn>
      <v-btn variant="text" size="small" icon="$close" @click="dismissNudge" />
    </template>
  </v-snackbar>
</template>

<script>
/**
 * Module dependencies.
 */
import config from '@/config';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';

/**
 * Benign terminal error messages returned by the backend.
 * These are NOT product errors — they indicate a resolved or pre-existing state.
 * Each entry is a lowercased substring of the real backend message string (source shown).
 * @type {string[]}
 */
const BENIGN_MESSAGES = [
  // organizations.membership.service.js L160: 'Already a member of this organization'
  'already a member',
  // organizations.membership.service.js L161: 'A pending request already exists'
  'a pending request already exists',
  // organizations.membership.service.js L165: 'You already have a pending request. Please wait for it to be reviewed before requesting to join another organization.'
  'you already have a pending request',
  // 404 is handled by the status fast-path in isBenign() — no string entry needed
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
  // organizations.controller.js L211: 404 → 'No Organization with that identifier has been found'
  if (status === 404) {
    return 'That workspace no longer exists.';
  }
  // organizations.membership.service.js L160: 'Already a member of this organization'
  if (desc.includes('already a member')) {
    return "You're already a member of that workspace.";
  }
  // L161: 'A pending request already exists'
  // L165: 'You already have a pending request...' (cross-org one-pending cap)
  return 'Request already sent. Awaiting approval.';
}

/**
 * Component definition.
 *
 * App-level login notices: the single owner of the transient post-login
 * organization snackbars, mounted once in app.vue.
 * - Suggested workspace join (top-right): driven by the auth-store
 *   `suggestedJoin` payload + v-if; Request-access CTA with the benign-error
 *   taxonomy; persistent dismiss via `dismissSuggestedJoin`.
 * - Pending-invitations nudge (centered): shown right after login (once per
 *   login session) when the user has pending owner_add invitations to accept.
 *   The durable surface stays the persistent list on /users/organizations —
 *   this is only the transient prompt pointing at it.
 */
export default {
  name: 'OrganizationsLoginNotices',

  data: () => ({
    /**
     * @desc Suggested-join banner state.
     */
    suggested: {
      // visible:true is correct — the snackbar only renders when suggestedJoin is
      // non-null (v-if guard above); safe for a future v-if→v-show refactor.
      visible: true,
      loading: false,
      feedback: {
        visible: false,
        color: 'success',
        text: '',
      },
    },
    /**
     * @desc Pending-invitations nudge state.
     */
    nudge: {
      /**
       * @desc Once-per-session guard: set on the first logged-in trigger so the
       * watcher never re-fetches/re-nudges within the same login session.
       * Reset on logout so the next login re-arms the nudge.
       */
      announced: false,
      dismissed: false,
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
    /**
     * @desc Whether the user is logged in.
     * @returns {boolean}
     */
    isLoggedIn() {
      return useAuthStore().isLoggedIn;
    },
    /**
     * @desc Count of the user's pending owner_add invitations.
     * @returns {number}
     */
    count() {
      return (useOrganizationsStore().pendingInvitations || []).length;
    },
    /**
     * @desc Controls nudge snackbar visibility — only after the post-login fetch
     * has run (announced), with at least one pending invitation, until acted on.
     * Accepting an invitation elsewhere drains the shared store list, hiding
     * the nudge automatically.
     * @returns {boolean}
     */
    nudgeVisible: {
      get() {
        return this.nudge.announced && this.count > 0 && !this.nudge.dismissed;
      },
      set(val) {
        if (!val) this.dismissNudge();
      },
    },
  },

  watch: {
    /**
     * @desc Fetch the user's pending invitations when they log in (or on
     * initial load when already logged in). Fires once per login session
     * via the `announced` flag; logout re-arms it. The suggested-join banner
     * is untouched here — its visibility is driven by the auth-store payload.
     * @param {boolean} loggedIn - Whether the user is logged in
     */
    isLoggedIn: {
      immediate: true,
      async handler(loggedIn) {
        if (!loggedIn) {
          this.nudge.announced = false;
          this.nudge.dismissed = false;
          return;
        }
        if (!config.organizations || this.nudge.announced) return;
        this.nudge.announced = true;
        try {
          await useOrganizationsStore().fetchMyPendingInvitations();
        } catch {
          // best-effort — silently ignore (the durable list self-heals)
        }
      },
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
      // Double-submit guard: v-btn :loading does NOT block @click in Vuetify 4.
      if (!this.suggestedJoin || this.suggested.loading) return;
      this.suggested.loading = true;
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
        this.suggested.loading = false;
      }
    },

    /**
     * @desc Dismiss the suggested-join banner permanently (persisted via auth store).
     * @returns {void}
     */
    dismissSuggested() {
      useAuthStore().dismissSuggestedJoin();
    },

    /**
     * @desc Show a feedback snackbar with the given color and message.
     * @param {'success'|'info'|'error'} color
     * @param {string} text
     * @returns {void}
     */
    showFeedback(color, text) {
      this.suggested.feedback = { visible: true, color, text };
    },

    /**
     * @desc Dismiss the nudge for the current login session.
     * @returns {void}
     */
    dismissNudge() {
      this.nudge.dismissed = true;
    },
  },
};
</script>
