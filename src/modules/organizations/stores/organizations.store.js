/**
 * Module dependencies.
 */
import { defineStore } from 'pinia';
import posthog from 'posthog-js';
import axios from '../../../lib/services/axios';
import config from '../../../lib/services/config';
import { useAuthStore } from '../../auth/stores/auth.store';
import { updateAbilities } from '../../../lib/helpers/ability';
import { capture } from '../../../lib/helpers/analytics';

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
    // Pending owner_add invitations the current user must accept (source:'owner_add').
    // Fetched on mount of the My Organizations view — the durable, offline-safe surface.
    pendingInvitations: [],
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
      capture('org_created', { organization_id: created._id || created.id, name: created.name });
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
      const result = res.data.data || {};
      this.currentOrganization =
        this.organizations.find((org) => org.id === organizationId || org._id === organizationId)
        || null;
      // Update JWT abilities if returned
      if (result.abilities) {
        updateAbilities(result.abilities);
      }
      // Refresh user data in auth store
      const authStore = useAuthStore();
      if (result.user) {
        authStore.user = result.user;
      }
      if (result.tokenExpiresIn) {
        authStore.cookieExpire = result.tokenExpiresIn;
        localStorage.setItem(`${config.cookie.prefix}CookieExpire`, result.tokenExpiresIn);
      }

      // PostHog group on org switch
      if (posthog.__loaded && this.currentOrganization) {
        const org = this.currentOrganization;
        posthog.group('company', org.id || org._id, { name: org.name, plan: org.plan });
      }
    },

    /**
     * @desc Fetch members of an organization.
     * @param {string} organizationId - The organization ID
     * @param {Object} [params={}] - Pagination and filter params
     * @param {number|string} [params.page] - Page number
     * @param {number|string} [params.perPage] - Page size
     * @param {string} [params.search] - Member search term
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
        const authStore = useAuthStore();
        if (authStore.user) authStore.user.currentOrganization = null;
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
     * @desc Look up a single user by EXACT email to add them to an organization
     *       (owner/admin only). Not fuzzy — the caller types a full email. Returns
     *       `{ id, displayName, email }` on a match, or null when no account exists.
     * @param {string} organizationId - The organization the owner/admin manages
     * @param {string} email - The exact email to look up
     * @returns {Promise<{ id: string, displayName: string, email: string }|null>}
     */
    async searchUserByEmail(organizationId, email) {
      const api = apiBase();
      const query = new URLSearchParams({ email: (email || '').trim() });
      const res = await axios.get(`${api}/organizations/${organizationId}/members/search?${query.toString()}`);
      return res.data.data || null;
    },

    /**
     * @desc Add a user to an organization (owner/admin only). Creates a PENDING
     *       owner_add membership — the invited user is NOT immediately active and
     *       must accept via acceptMembership. Success/error toast is fired by the
     *       axios POST interceptor.
     * @param {string} organizationId - The organization to add the user to
     * @param {string} userId - The id of the user being added
     * @param {string} [role] - The role to grant on acceptance (member/admin)
     * @returns {Promise<Object>} The created pending membership
     */
    async addMember(organizationId, userId, role) {
      const api = apiBase();
      const body = role ? { userId, role } : { userId };
      const res = await axios.post(`${api}/organizations/${organizationId}/members`, body);
      capture('org_member_added', { organization_id: organizationId, role: role || 'member' });
      return res.data.data;
    },

    /**
     * @desc Fetch the current user's own pending owner_add invitations — memberships
     *       an owner/admin created for them that they must accept. Durable, offline-safe
     *       surface: fetched on mount so an invitee sees it on their next login.
     * @returns {Promise<Array>} The user's pending owner_add memberships
     */
    async fetchMyPendingInvitations() {
      const api = apiBase();
      const res = await axios.get(`${api}/membership-requests/mine/pending`);
      this.pendingInvitations = res.data.data || [];
      return this.pendingInvitations;
    },

    /**
     * @desc Accept a pending owner_add invitation (the invited user consents),
     *       flipping the membership PENDING → ACTIVE. Drops it from the local
     *       pending list on success. Success/error toast is fired by the axios PUT
     *       interceptor.
     * @param {string} membershipId - The pending membership to accept
     * @returns {Promise<Object>} The activated membership
     */
    async acceptMembership(membershipId) {
      const api = apiBase();
      const res = await axios.put(`${api}/membership-requests/${membershipId}/accept`);
      this.pendingInvitations = this.pendingInvitations.filter(
        (inv) => inv.id !== membershipId && inv._id !== membershipId,
      );
      return res.data.data;
    },

    /**
     * @desc Decline a pending owner_add invitation (the invited user refuses).
     *       The membership row is deleted server-side — the owner can re-invite
     *       later. Drops it from the local pending list on success. DELETE is not
     *       in the snackbar interceptor methods (post/put only), so the pending
     *       list refresh is the only success feedback — deliberate: declining is
     *       low-stakes and re-invitable. Errors still toast via the interceptor.
     * @param {string} membershipId - The pending membership to decline
     * @returns {Promise<Object>} The deleted membership
     */
    async declineMembership(membershipId) {
      const api = apiBase();
      const res = await axios.delete(`${api}/membership-requests/${membershipId}`);
      this.pendingInvitations = this.pendingInvitations.filter(
        (inv) => inv.id !== membershipId && inv._id !== membershipId,
      );
      return res.data.data;
    },
  },
});

/**
 * Exports.
 */
export default useOrganizationsStore;
