/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { capture } from '../../../lib/helpers/analytics';
import { createLogger } from '../../../lib/helpers/logger';

const logger = createLogger('invitations');

/**
 * Sanitize API error messages to avoid leaking internal details (stack traces, DB paths, etc.).
 * @param {unknown} err - The caught error object.
 * @returns {string} A safe, user-facing error message.
 */
const sanitizeApiError = (err) => {
  const msg = err?.response?.data?.message || '';
  if (msg && msg.length <= 200 && !/\b(collection|stack)\b|Error:|^\s*at\s+|\/[a-z]+\/|\.[jt]s:\d+/.test(msg)) {
    return msg;
  }
  return 'Failed to load data. Please try again.';
};

/**
 * Build the base API URL from config.
 * @returns {string} The base API URL.
 */
const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * Store definition — platform signup invitations (admin management + account
 * "Referrals" surface). Talks to the canonical `/api/invitations` mount served
 * by the standalone Node `invitations` module (the legacy `/api/auth/invitations`
 * alias is being retired). Replaces the invitation actions previously hosted in
 * `admin.store.js` as part of the invitations↔org decouple (P6).
 */
export const useInvitationsStore = defineStore('invitations', {
  state: () => ({
    invitations: [],
    error: null,
  }),

  actions: {
    /**
     * @desc Load all signup invitations (admin). Backend returns the full list
     * (no server pagination), newest first, with token stripped.
     * @returns {Promise<void>}
     */
    async getInvitations() {
      this.error = null;
      try {
        const res = await axios.get(`${apiBase()}/invitations`);
        this.invitations = res.data.data;
      } catch (err) {
        this.invitations = [];
        this.error = sanitizeApiError(err);
        logger.error(err);
      }
    },

    /**
     * @desc Create + email a platform signup invitation for an email. Used by
     * both the admin management tab and the account "Referrals" tab — the
     * backend CASL policy decides who is allowed (platform admins today;
     * regular users once the referral ability is granted in a later phase).
     * Re-emits the `invitation_created` analytics event so the funnel parity is
     * preserved after the org `invitation_sent` capture is dropped (P7).
     * @param {string} email
     * @returns {Promise<Object>} the created invitation
     */
    async createInvitation(email) {
      this.error = null;
      try {
        const res = await axios.post(`${apiBase()}/invitations`, { email });
        capture('invitation_created', { source: 'platform' });
        return res.data.data;
      } catch (err) {
        this.error = sanitizeApiError(err);
        logger.error(err);
        throw err;
      }
    },

    /**
     * @desc Revoke a signup invitation by id.
     * @param {string} id
     * @returns {Promise<void>}
     */
    async deleteInvitation(id) {
      this.error = null;
      try {
        await axios.delete(`${apiBase()}/invitations/${id}`);
      } catch (err) {
        this.error = sanitizeApiError(err);
        logger.error(err);
        throw err;
      }
    },
  },
});

/**
 * Exports.
 */
export default useInvitationsStore;
