/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { assign } from 'lodash-es';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import model from '../../../lib/middlewares/model';
import { createLogger } from '../../../lib/helpers/logger';

const logger = createLogger('admin');

/**
 * Whitelists.
 */
const whitelists = ['firstName', 'lastName', 'bio', 'position', 'email', 'avatar', 'roles'];

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
const defaultUser = () => ({
  firstName: '',
  lastName: '',
  bio: '',
  position: '',
  email: '',
  avatar: '',
  roles: [],
  memberships: [],
  updated: '',
  created: '',
});

/**
 * Store definition.
 */
export const useAdminStore = defineStore('admin', {
  state: () => ({
    user: defaultUser(),
    users: [],
    organizations: [],
    error: null,
    currentBreadcrumb: null,
    readiness: [],
    auditLogs: [],
    auditTotal: 0,
    auditPage: 1,
  }),

  actions: {
    async getUsers(params) {
      this.error = null;
      try {
        const res = await axios.get(`${apiBase()}/admin/users/page/${params}`);
        this.users = res.data.data;
      } catch (err) {
        this.error = sanitizeApiError(err);
        console.error(err);
      }
    },

    async getUser(params) {
      this.error = null;
      try {
        const res = await axios.get(`${apiBase()}/admin/users/${params.id}`);
        this.user = res.data.data;
      } catch (err) {
        this.error = sanitizeApiError(err);
        this.resetUser();
        console.error(err);
      }
    },

    /**
     * @desc Update a user via the admin API using a partial patch.
     * Only the fields present in `formData` (after whitelist sanitization) are sent,
     * so callers must provide every field they want persisted. Merging with the
     * local `this.user` placeholder is intentionally avoided to prevent empty
     * defaults from wiping persisted fields (e.g. role-toggle from the list view).
     * @param {{ id: string }} params - Route params, must contain the target user id.
     * @param {Object} [formData] - Partial user payload (whitelisted fields only).
     * @returns {Promise<void>}
     */
    async updateUser(params, formData) {
      this.error = null;
      try {
        const obj = model.clean(formData || {}, whitelists);
        const res = await axios.put(`${apiBase()}/admin/users/${params.id}`, obj);
        assign(this.user, res.data.data);
      } catch (err) {
        this.error = sanitizeApiError(err);
        console.error(err);
        throw err;
      }
    },

    async deleteUser(params) {
      this.error = null;
      try {
        await axios.delete(`${apiBase()}/admin/users/${params.id}`);
        this.resetUser();
      } catch (err) {
        this.error = sanitizeApiError(err);
        console.error(err);
        throw err;
      }
    },

    resetUser() {
      this.user = defaultUser();
    },

    setBreadcrumb(payload) {
      this.currentBreadcrumb = payload ? { ...payload } : null;
    },

    clearBreadcrumb() {
      this.currentBreadcrumb = null;
    },

    /**
     * @desc Fetch SaaS readiness checklist from the admin API.
     * @returns {Promise<void>}
     */
    async getReadiness() {
      this.error = null;
      try {
        const res = await axios.get(`${apiBase()}/admin/readiness`);
        this.readiness = res.data.data;
      } catch (err) {
        this.readiness = [];
        this.error = sanitizeApiError(err);
        logger.error(err);
      }
    },

    async getOrganizations(params) {
      this.error = null;
      try {
        const url = params ? `${apiBase()}/admin/organizations/page/${params}` : `${apiBase()}/admin/organizations`;
        const res = await axios.get(url);
        this.organizations = res.data.data;
      } catch (err) {
        this.error = sanitizeApiError(err);
        console.error(err);
      }
    },

    /**
     * @desc Fetch paginated audit logs from the admin API.
     * Response shape: res.data = { type, message, data: { data: Array, total, page, perPage } }
     * (standard responses.success() wrapper around AuditRepository.list() result).
     * @param {Object} [params] - Query parameters.
     * @param {string} [params.action] - Filter by action type.
     * @param {string} [params.userId] - Filter by user ID.
     * @param {number} [params.page] - Page number (1-based).
     * @param {number} [params.perPage] - Items per page.
     * @returns {Promise<void>}
     */
    async getAuditLogs({ action, userId, page, perPage } = {}) {
      this.error = null;
      try {
        const query = new URLSearchParams();
        if (action) query.set('action', action);
        if (userId) query.set('userId', userId);
        if (page) query.set('page', String(page));
        if (perPage) query.set('perPage', String(perPage));
        const qs = query.toString();
        const url = `${apiBase()}/audit${qs ? '?' + qs : ''}`;
        const res = await axios.get(url);
        this.auditLogs = res.data.data?.data || [];
        this.auditTotal = res.data.data?.total || 0;
        this.auditPage = res.data.data?.page || 1;
      } catch (err) {
        this.auditLogs = [];
        this.auditTotal = 0;
        this.error = sanitizeApiError(err);
        logger.error(err);
      }
    },
  },
});

/**
 * Exports.
 */
export default useAdminStore;
