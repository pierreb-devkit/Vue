/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { useAuthStore } from '../../auth/stores/auth.store';
import { updateAbilities } from '../../../lib/helpers/ability';

/**
 * @desc Build the base API URL from config.
 * @returns {string} Base API URL
 */
const apiBase = () => `${config.api.protocol}://${config.api.host}:${config.api.port}/${config.api.base}`;

/**
 * Store definition.
 */
export const useOrganizationsStore = defineStore('organizations', {
  state: () => ({
    currentOrganization: null,
    organizations: [],
    members: [],
  }),

  actions: {
    /**
     * @desc Fetch all organizations for the current user.
     * @returns {Promise<Array>} Resolved list of organizations
     */
    async fetchOrganizations() {
      const api = apiBase();
      try {
        const res = await axios.get(`${api}/organizations`);
        this.organizations = res.data.data;
        return this.organizations;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Fetch a single organization by ID.
     * @param {string} organizationId - The organization ID
     * @returns {Promise<Object>} Resolved organization object
     */
    async fetchOrganization(organizationId) {
      const api = apiBase();
      try {
        const res = await axios.get(`${api}/organizations/${organizationId}`);
        this.currentOrganization = res.data.data;
        return this.currentOrganization;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Create a new organization.
     * @param {Object} data - Organization data (name, description, etc.)
     * @returns {Promise<Object>} Resolved created organization
     */
    async createOrganization(data) {
      const api = apiBase();
      try {
        const res = await axios.post(`${api}/organizations`, data);
        this.currentOrganization = res.data.data;
        return this.currentOrganization;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Update an existing organization.
     * @param {string} organizationId - The organization ID
     * @param {Object} data - Updated organization data
     * @returns {Promise<Object>} Resolved updated organization
     */
    async updateOrganization(organizationId, data) {
      const api = apiBase();
      try {
        const res = await axios.put(`${api}/organizations/${organizationId}`, data);
        this.currentOrganization = res.data.data;
        return this.currentOrganization;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Delete an organization.
     * @param {string} organizationId - The organization ID
     * @returns {Promise<void>}
     */
    async deleteOrganization(organizationId) {
      const api = apiBase();
      try {
        await axios.delete(`${api}/organizations/${organizationId}`);
        this.currentOrganization = null;
        this.organizations = this.organizations.filter((org) => org.id !== organizationId && org._id !== organizationId);
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Switch active organization context, refreshing JWT and abilities.
     * @param {string} organizationId - The organization ID to switch to
     * @returns {Promise<void>}
     */
    async switchOrganization(organizationId) {
      const api = apiBase();
      try {
        const res = await axios.post(`${api}/organizations/${organizationId}/switch`);
        this.currentOrganization = this.organizations.find((org) => org.id === organizationId || org._id === organizationId) || null;
        // Update JWT abilities if returned
        if (res.data.abilities) {
          updateAbilities(res.data.abilities);
        }
        // Refresh user data in auth store
        const authStore = useAuthStore();
        if (res.data.user) {
          authStore.user = res.data.user;
        }
        if (res.data.tokenExpiresIn) {
          authStore.cookieExpire = res.data.tokenExpiresIn;
          localStorage.setItem(`${config.cookie.prefix}CookieExpire`, res.data.tokenExpiresIn);
        }
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Fetch members of an organization.
     * @param {string} organizationId - The organization ID
     * @returns {Promise<Array>} Resolved list of members
     */
    async fetchMembers(organizationId) {
      const api = apiBase();
      try {
        const res = await axios.get(`${api}/organizations/${organizationId}/members`);
        this.members = res.data.data;
        return this.members;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Invite a new member to an organization.
     * @param {string} organizationId - The organization ID
     * @param {Object} data - Invite data (email, role)
     * @returns {Promise<Object>} Resolved invite result
     */
    async inviteMember(organizationId, data) {
      const api = apiBase();
      try {
        const res = await axios.post(`${api}/organizations/${organizationId}/members/invite`, data);
        return res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Change a member's role within an organization.
     * @param {string} organizationId - The organization ID
     * @param {string} memberId - The member ID
     * @param {string} role - The new role to assign
     * @returns {Promise<Object>} Resolved updated member
     */
    async changeMemberRole(organizationId, memberId, role) {
      const api = apiBase();
      try {
        const res = await axios.put(`${api}/organizations/${organizationId}/members/${memberId}`, { role });
        // Update member in local state
        const index = this.members.findIndex((m) => m.id === memberId || m._id === memberId);
        if (index !== -1) {
          this.members[index] = res.data.data;
        }
        return res.data.data;
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Remove a member from an organization.
     * @param {string} organizationId - The organization ID
     * @param {string} memberId - The member ID to remove
     * @returns {Promise<void>}
     */
    async removeMember(organizationId, memberId) {
      const api = apiBase();
      try {
        await axios.delete(`${api}/organizations/${organizationId}/members/${memberId}`);
        this.members = this.members.filter((m) => m.id !== memberId && m._id !== memberId);
      } catch (err) {
        console.log(err);
      }
    },

    /**
     * @desc Reset the current organization and members state.
     * @returns {void}
     */
    resetOrganization() {
      this.currentOrganization = null;
      this.members = [];
    },
  },
});

/**
 * Exports.
 */
export default useOrganizationsStore;
