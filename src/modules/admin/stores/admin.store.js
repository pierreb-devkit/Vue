/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import { assign } from 'lodash-es';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import model from '../../../lib/middlewares/model';

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
  // Only expose messages that look like safe user-facing messages
  if (msg && msg.length < 200 && !/collection|index|path|stack|Error:|at /.test(msg)) {
    return msg;
  }
  return 'Failed to load data. Please try again.';
};

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
    readiness: [],
  }),

  actions: {
    async getUsers(params) {
      this.error = null;
      try {
        const res = await axios.get(`${apiBase()}/admin/users/page/${params}`);
        this.users = res.data.data;
      } catch (err) {
        this.error = sanitizeApiError(err);
        console.log(err);
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
        console.log(err);
      }
    },

    async updateUser(params, formData) {
      this.error = null;
      try {
        const obj = model.clean({ ...this.user, ...formData }, whitelists);
        const res = await axios.put(`${apiBase()}/admin/users/${params.id}`, obj);
        assign(this.user, res.data.data);
      } catch (err) {
        this.error = sanitizeApiError(err);
        console.log(err);
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
        console.log(err);
        throw err;
      }
    },

    resetUser() {
      this.user = defaultUser();
    },

    /**
     * @desc Fetch SaaS readiness checklist from the admin API.
     * @returns {Promise<void>}
     */
    async getReadiness() {
      try {
        const res = await axios.get(`${apiBase()}/admin/readiness`);
        this.readiness = res.data.data;
      } catch (err) {
        this.readiness = [];
        this.error = sanitizeApiError(err);
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
        console.log(err);
      }
    },
  },
});

/**
 * Exports.
 */
export default useAdminStore;
