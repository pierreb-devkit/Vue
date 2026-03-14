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
    viewedOrganization: null,
    organizations: [],
    members: [],
    adminPendingRequests: [],
  }),

  actions: {
    /**
     * @desc Fetch all organizations for the current user.
     * @returns {Promise<Array>} Resolved list of organizations
     */
    async fetchOrganizations() {
      const api = apiBase();
      const res = await axios.get(`${api}/organizations`);
      this.organizations = res.data.data;
      return this.organizations;
    },

    /**
     * @desc Fetch a single organization by ID.
     * @param {string} organizationId - The organization ID
     * @returns {Promise<Object>} Resolved organization object
     */
    async fetchOrganization(organizationId) {
      const api = apiBase();
      const res = await axios.get(`${api}/organizations/${organizationId}`);
      this.viewedOrganization = res.data.data;
      return this.viewedOrganization;
    },

    /**
     * @desc Create a new organization.
     * @param {Object} data - Organization data (name, description, etc.)
     * @returns {Promise<Object>} Resolved created organization
     */
    async createOrganization(data) {
      const api = apiBase();
      const res = await axios.post(`${api}/organizations`, data);
      const created = res.data.data;
      this.currentOrganization = created;
      this.organizations = [created, ...this.organizations];
      return created;
    },

    /**
     * @desc Update an existing organization.
     * @param {string} organizationId - The organization ID
     * @param {Object} data - Updated organization data
     * @returns {Promise<Object>} Resolved updated organization
     */
    async updateOrganization(organizationId, data) {
      const api = apiBase();
      const res = await axios.put(`${api}/organizations/${organizationId}`, data);
      const updated = res.data.data;
      this.viewedOrganization = updated;
      this.organizations = this.organizations.map((org) => ((org.id === organizationId || org._id === organizationId) ? updated : org));
      if (this.currentOrganization && (this.currentOrganization.id === organizationId || this.currentOrganization._id === organizationId)) {
        this.currentOrganization = updated;
      }
      return updated;
    },

    /**
     * @desc Delete an organization.
     * @param {string} organizationId - The organization ID
     * @returns {Promise<void>}
     */
    async deleteOrganization(organizationId) {
      const api = apiBase();
      await axios.delete(`${api}/organizations/${organizationId}`);
      this.adminPendingRequests = this.adminPendingRequests.filter(
        (request) => request.organizationId !== organizationId,
      );
      if (
        this.currentOrganization
        && (this.currentOrganization.id === organizationId || this.currentOrganization._id === organizationId)
      ) {
        this.currentOrganization = null;
        this.resetOrganization();
        const authStore = useAuthStore();
        if (authStore.user) authStore.user.currentOrganization = null;
      }
      this.organizations = this.organizations.filter((org) => org.id !== organizationId && org._id !== organizationId);
    },

    /**
     * @desc Switch active organization context, refreshing JWT and abilities.
     * @param {string} organizationId - The organization ID to switch to
     * @returns {Promise<void>}
     */
    async switchOrganization(organizationId) {
      const api = apiBase();
      const res = await axios.post(`${api}/organizations/${organizationId}/switch`);
      this.currentOrganization =
        res.data?.data
        || this.organizations.find((org) => org.id === organizationId || org._id === organizationId)
        || null;
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
    },

    /**
     * @desc Fetch members of an organization.
     * @param {string} organizationId - The organization ID
     * @param {string} params - Pagination params (page&perPage&search)
     * @returns {Promise<Array>} Resolved list of members
     */
    async fetchMembers(organizationId, { page, perPage, search } = {}) {
      const api = apiBase();
      const query = new URLSearchParams();
      if (page) query.set('page', page);
      if (perPage) query.set('perPage', perPage);
      if (search) query.set('search', search);
      const qs = query.toString();
      const url = `${api}/organizations/${organizationId}/members${qs ? `?${qs}` : ''}`;
      const res = await axios.get(url);
      this.members = res.data.data;
      return this.members;
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
      const res = await axios.put(`${api}/organizations/${organizationId}/members/${memberId}`, { role });
      // Update member in local state
      const index = this.members.findIndex((m) => m.id === memberId || m._id === memberId);
      if (index !== -1) {
        this.members[index] = res.data.data;
      }
      return res.data.data;
    },

    /**
     * @desc Remove a member from an organization.
     * @param {string} organizationId - The organization ID
     * @param {string} memberId - The member ID to remove
     * @returns {Promise<void>}
     */
    async removeMember(organizationId, memberId) {
      const api = apiBase();
      await axios.delete(`${api}/organizations/${organizationId}/members/${memberId}`);
      this.members = this.members.filter((m) => m.id !== memberId && m._id !== memberId);
    },

    /**
     * @desc Leave an organization
     * @param {string} organizationId
     * @returns {Promise<void>}
     */
    async leaveOrganization(organizationId) {
      const api = apiBase();
      await axios.post(`${api}/organizations/${organizationId}/leave`);
      this.organizations = this.organizations.filter((org) => org.id !== organizationId && org._id !== organizationId);
      this.adminPendingRequests = this.adminPendingRequests.filter(
        (request) => request.organizationId !== organizationId,
      );
      if (this.currentOrganization && (this.currentOrganization.id === organizationId || this.currentOrganization._id === organizationId)) {
        this.currentOrganization = null;
        this.resetOrganization();
      }
    },

    /**
     * @desc Reset the current organization and members state.
     * @returns {void}
     */
    resetOrganization() {
      this.viewedOrganization = null;
      this.members = [];
    },

    /**
     * @desc Create a membership request to join an organization.
     * @param {string} organizationId - The organization ID to request joining
     * @returns {Promise<Object>} The created request
     */
    async createJoinRequest(organizationId) {
      const api = apiBase();
      const res = await axios.post(`${api}/organizations/${organizationId}/requests`);
      return res.data.data;
    },

    /**
     * @desc Fetch pending membership requests for an organization (owner/admin only).
     * @param {string} organizationId - The organization ID
     * @returns {Promise<Array>} List of pending requests
     */
    async fetchPendingRequests(organizationId) {
      const api = apiBase();
      const res = await axios.get(`${api}/organizations/${organizationId}/requests`);
      return res.data.data || [];
    },

    /**
     * @desc Approve a membership request.
     * @param {string} organizationId - The organization ID
     * @param {string} requestId - The request ID to approve
     * @returns {Promise<Object>} The approved request
     */
    async approveRequest(organizationId, requestId) {
      const api = apiBase();
      const res = await axios.put(`${api}/organizations/${organizationId}/requests/${requestId}/approve`);
      this.fetchAdminPendingRequests().catch(() => {});
      return res.data.data;
    },

    /**
     * @desc Reject a membership request.
     * @param {string} organizationId - The organization ID
     * @param {string} requestId - The request ID to reject
     * @returns {Promise<Object>} The rejected request
     */
    async rejectRequest(organizationId, requestId) {
      const api = apiBase();
      const res = await axios.put(`${api}/organizations/${organizationId}/requests/${requestId}/reject`);
      this.fetchAdminPendingRequests().catch(() => {});
      return res.data.data;
    },

    /**
     * @desc Fetch the authenticated user's own membership requests.
     * @returns {Promise<Array>} List of user's requests
     */
    async fetchMyRequests() {
      const api = apiBase();
      const res = await axios.get(`${api}/membership-requests/mine`);
      return res.data.data || [];
    },

    /**
     * @desc Search organizations matching the current user's email domain.
     * @returns {Promise<Array>}
     */
    async searchOrganizationsByDomain() {
      const api = apiBase();
      const res = await axios.get(`${api}/organizations/search`);
      return res.data.data || [];
    },

    /**
     * @desc Invite a member to an organization by email
     * @param {string} organizationId
     * @param {string} email
     * @returns {Promise<Object>} Resolved invite data
     */
    async inviteMember(organizationId, email) {
      const api = apiBase();
      const res = await axios.post(`${api}/organizations/${organizationId}/invites`, { email });
      return res.data.data;
    },

    /**
     * @desc Get invite details by token
     * @param {string} token
     * @returns {Promise<Object>} Resolved invite data
     */
    async getInvite(token) {
      const api = apiBase();
      const res = await axios.get(`${api}/invites/${token}`);
      return res.data.data;
    },

    /**
     * @desc Fetch pending request counts for all orgs where user is owner/admin.
     * @returns {Promise<void>}
     */
    async fetchAdminPendingRequests() {
      const orgs = await this.fetchOrganizations();
      const results = await Promise.allSettled(
        (orgs || []).map(async (org) => {
          const requests = await this.fetchPendingRequests(org._id || org.id);
          return requests.length > 0
            ? { organizationId: org._id || org.id, organizationName: org.name, count: requests.length }
            : null;
        }),
      );
      this.adminPendingRequests = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);
    },

    /**
     * @desc Accept an organization invite
     * @param {string} token
     * @returns {Promise<Object>} Resolved acceptance data
     */
    async acceptInvite(token) {
      const api = apiBase();
      const res = await axios.post(`${api}/invites/${token}/accept`);
      return res.data.data;
    },
  },
});

/**
 * Exports.
 */
export default useOrganizationsStore;
