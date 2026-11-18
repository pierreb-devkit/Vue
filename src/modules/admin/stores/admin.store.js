/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { assign } from 'lodash-es';
import axios from '../../../lib/services/axios';
import { apiBase } from '../../../lib/services/config';
import model from '../../../lib/middlewares/model';
import { createLogger } from '../../../lib/helpers/logger';
import { sanitizeApiError } from '../../../lib/helpers/apiError';

const logger = createLogger('admin');

/** Latest Overview request per source; an older answer that lands late is ignored. */
const statsRuns = {};

/**
 * Whitelists.
 */
const whitelists = ['firstName', 'lastName', 'bio', 'position', 'email', 'avatar', 'roles'];

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
    stats: { users: null, organizations: null, audit: null, recent: null },
    statsErrors: [],
    auditLogs: [],
    auditTotal: 0,
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

    /**
     * @desc Set (or clear) the current breadcrumb published by an admin sub-view.
     *       A shallow copy is stored so callers cannot mutate the store state directly.
     *       Pass `null` to clear (identical effect to `clearBreadcrumb()`).
     * @param {{ title: string, titleClass?: string } | null} payload - Breadcrumb data, or null to clear.
     * @returns {void}
     */
    setBreadcrumb(payload) {
      this.currentBreadcrumb = payload ? { ...payload } : null;
    },

    /**
     * @desc Clear the current breadcrumb (reset to null). Called by admin sub-views on unmount.
     * @returns {void}
     */
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

    /**
     * @desc Load the Overview data. Each source loads on its own and shows as soon
     *       as it settles, so one slow or failing route leaves the others on screen;
     *       a failed source stays null and is named in `statsErrors`. A late answer
     *       from an older request never replaces a newer one.
     * @param {{ audit?: boolean, only?: string[] }} [options] - `audit: false` skips the
     *        activity sources; `only` reloads just those sources (retry), keeping the rest
     * @returns {Promise<void>}
     */
    async getStats({ audit = true, only } = {}) {
      const sources = {
        users: '/admin/users/stats',
        organizations: '/admin/organizations/stats',
        ...(audit ? { audit: '/audit/stats', recent: '/audit?perPage=6' } : {}),
      };
      const keys = only ? Object.keys(sources).filter((k) => only.includes(k)) : Object.keys(sources);
      this.error = null;
      if (!only) this.stats = { users: null, organizations: null, audit: null, recent: null };
      this.statsErrors = this.statsErrors.filter((k) => !keys.includes(k));
      await Promise.allSettled(
        keys.map(async (k) => {
          const run = (statsRuns[k] = (statsRuns[k] || 0) + 1);
          try {
            const res = await axios.get(`${apiBase()}${sources[k]}`);
            if (statsRuns[k] !== run) return;
            this.stats[k] = k === 'recent' ? res.data.data?.data || [] : res.data.data;
          } catch (err) {
            if (statsRuns[k] !== run) return;
            this.statsErrors.push(k);
            logger.error(err);
          }
        }),
      );
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
