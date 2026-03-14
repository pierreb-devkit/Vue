import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOrganizationsStore } from '../stores/organizations.store';
import axios from '../../../lib/services/axios';
import { updateAbilities } from '../../../lib/helpers/ability';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

// Mock auth store
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    cookieExpire: null,
  })),
}));

// Mock ability helper
vi.mock('../../../lib/helpers/ability', () => ({
  updateAbilities: vi.fn(),
}));

const API = 'http://localhost:3000/api';

describe('Organizations Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useOrganizationsStore();
    expect(store.currentOrganization).toBeNull();
    expect(store.viewedOrganization).toBeNull();
    expect(store.organizations).toEqual([]);
    expect(store.members).toEqual([]);
    expect(store.adminPendingRequests).toEqual([]);
  });

  describe('fetchOrganizations', () => {
    it('should fetch and set organizations', async () => {
      const store = useOrganizationsStore();
      const mockOrgs = [
        { id: '1', name: 'Org1' },
        { id: '2', name: 'Org2' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockOrgs } });

      const result = await store.fetchOrganizations();

      expect(axios.get).toHaveBeenCalledWith(`${API}/organizations`);
      expect(store.organizations).toEqual(mockOrgs);
      expect(result).toEqual(mockOrgs);
    });
  });

  describe('fetchOrganization', () => {
    it('should fetch a single organization by ID', async () => {
      const store = useOrganizationsStore();
      const mockOrg = { id: '1', name: 'Org1' };

      axios.get.mockResolvedValueOnce({ data: { data: mockOrg } });

      const result = await store.fetchOrganization('1');

      expect(axios.get).toHaveBeenCalledWith(`${API}/organizations/1`);
      expect(store.viewedOrganization).toEqual(mockOrg);
      expect(result).toEqual(mockOrg);
    });
  });

  describe('createOrganization', () => {
    it('should create, set current organization, and add to list', async () => {
      const store = useOrganizationsStore();
      const newOrg = { id: '1', name: 'New Org' };

      axios.post.mockResolvedValueOnce({ data: { data: newOrg } });

      const result = await store.createOrganization({ name: 'New Org' });

      expect(axios.post).toHaveBeenCalledWith(`${API}/organizations`, { name: 'New Org' });
      expect(store.currentOrganization).toEqual(newOrg);
      expect(store.organizations).toContainEqual(newOrg);
      expect(result).toEqual(newOrg);
    });
  });

  describe('updateOrganization', () => {
    it('should update viewedOrganization and sync organizations list', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Old' }];
      const updatedOrg = { id: '1', name: 'Updated Org' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedOrg } });

      const result = await store.updateOrganization('1', { name: 'Updated Org' });

      expect(axios.put).toHaveBeenCalledWith(`${API}/organizations/1`, { name: 'Updated Org' });
      expect(store.viewedOrganization).toEqual(updatedOrg);
      expect(store.organizations[0]).toEqual(updatedOrg);
      expect(result).toEqual(updatedOrg);
    });

    it('should also update currentOrganization when it matches', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Old' }];
      store.currentOrganization = { id: '1', name: 'Old' };
      const updatedOrg = { id: '1', name: 'Updated Org' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedOrg } });

      await store.updateOrganization('1', { name: 'Updated Org' });

      expect(store.currentOrganization).toEqual(updatedOrg);
    });

    it('should update currentOrganization when matching by _id', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ _id: 'a', name: 'Old' }];
      store.currentOrganization = { _id: 'a', name: 'Old' };
      const updatedOrg = { _id: 'a', name: 'Updated' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedOrg } });

      await store.updateOrganization('a', { name: 'Updated' });

      expect(store.currentOrganization).toEqual(updatedOrg);
    });
  });

  describe('deleteOrganization', () => {
    it('should delete and clear current if matching by id', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Org1' }, { id: '2', name: 'Org2' }];
      store.currentOrganization = { id: '1', name: 'Org1' };

      axios.delete.mockResolvedValueOnce({});

      await store.deleteOrganization('1');

      expect(axios.delete).toHaveBeenCalledWith(`${API}/organizations/1`);
      expect(store.currentOrganization).toBeNull();
      expect(store.organizations).toEqual([{ id: '2', name: 'Org2' }]);
    });

    it('should delete and clear current if matching by _id', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ _id: 'a', name: 'OrgA' }];
      store.currentOrganization = { _id: 'a', name: 'OrgA' };

      axios.delete.mockResolvedValueOnce({});

      await store.deleteOrganization('a');

      expect(store.currentOrganization).toBeNull();
      expect(store.organizations).toEqual([]);
    });

    it('should filter adminPendingRequests when deleting an org', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Org1' }];
      store.adminPendingRequests = [
        { organizationId: '1', organizationName: 'Org1', count: 2 },
        { organizationId: '2', organizationName: 'Org2', count: 1 },
      ];

      axios.delete.mockResolvedValueOnce({});

      await store.deleteOrganization('1');

      expect(store.adminPendingRequests).toEqual([
        { organizationId: '2', organizationName: 'Org2', count: 1 },
      ]);
    });

    it('should not clear current if different org deleted', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Org1' }, { id: '2', name: 'Org2' }];
      store.currentOrganization = { id: '2', name: 'Org2' };

      axios.delete.mockResolvedValueOnce({});

      await store.deleteOrganization('1');

      expect(store.currentOrganization).toEqual({ id: '2', name: 'Org2' });
      expect(store.organizations).toEqual([{ id: '2', name: 'Org2' }]);
    });
  });

  describe('switchOrganization', () => {
    it('should switch organization and update abilities', async () => {
      const store = useOrganizationsStore();
      const switchedOrg = { id: '1', name: 'Org1' };
      store.organizations = [switchedOrg];

      axios.post.mockResolvedValueOnce({
        data: { data: { abilities: ['read', 'write'], user: { name: 'User1' }, tokenExpiresIn: 3600 } },
      });

      await store.switchOrganization('1');

      expect(axios.post).toHaveBeenCalledWith(`${API}/organizations/1/switch`);
      expect(store.currentOrganization).toEqual(switchedOrg);
      expect(updateAbilities).toHaveBeenCalledWith(['read', 'write']);
    });

    it('should fall back to organizations list when no data returned', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Org1' }];

      axios.post.mockResolvedValueOnce({ data: {} });

      await store.switchOrganization('1');

      expect(store.currentOrganization).toEqual({ id: '1', name: 'Org1' });
    });

    it('should set null when org not found in list', async () => {
      const store = useOrganizationsStore();
      store.organizations = [];

      axios.post.mockResolvedValueOnce({ data: {} });

      await store.switchOrganization('999');

      expect(store.currentOrganization).toBeNull();
    });
  });

  describe('fetchMembers', () => {
    it('should fetch members without params', async () => {
      const store = useOrganizationsStore();
      const mockMembers = [{ id: 'm1', name: 'Member1' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockMembers } });

      const result = await store.fetchMembers('org1');

      expect(axios.get).toHaveBeenCalledWith(`${API}/organizations/org1/members`);
      expect(store.members).toEqual(mockMembers);
      expect(result).toEqual(mockMembers);
    });

    it('should fetch members with pagination params', async () => {
      const store = useOrganizationsStore();
      const mockMembers = [{ id: 'm1' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockMembers } });

      await store.fetchMembers('org1', { page: '1', perPage: '10', search: 'john' });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(`${API}/organizations/org1/members?`),
      );
    });

    it('should handle partial params', async () => {
      const store = useOrganizationsStore();

      axios.get.mockResolvedValueOnce({ data: { data: [] } });

      await store.fetchMembers('org1', { page: '1' });

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
      );
    });
  });

  describe('changeMemberRole', () => {
    it('should change role and update member in local state', async () => {
      const store = useOrganizationsStore();
      store.members = [{ id: 'm1', role: 'member' }, { id: 'm2', role: 'member' }];
      const updatedMember = { id: 'm1', role: 'admin' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedMember } });

      const result = await store.changeMemberRole('org1', 'm1', 'admin');

      expect(axios.put).toHaveBeenCalledWith(`${API}/organizations/org1/members/m1`, { role: 'admin' });
      expect(store.members[0]).toEqual(updatedMember);
      expect(result).toEqual(updatedMember);
    });

    it('should not update local state if member not found', async () => {
      const store = useOrganizationsStore();
      store.members = [{ id: 'm2', role: 'member' }];
      const updatedMember = { id: 'm1', role: 'admin' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedMember } });

      const result = await store.changeMemberRole('org1', 'm1', 'admin');

      expect(store.members).toEqual([{ id: 'm2', role: 'member' }]);
      expect(result).toEqual(updatedMember);
    });
  });

  describe('removeMember', () => {
    it('should remove member from local state', async () => {
      const store = useOrganizationsStore();
      store.members = [{ id: 'm1' }, { id: 'm2' }];

      axios.delete.mockResolvedValueOnce({});

      await store.removeMember('org1', 'm1');

      expect(axios.delete).toHaveBeenCalledWith(`${API}/organizations/org1/members/m1`);
      expect(store.members).toEqual([{ id: 'm2' }]);
    });
  });

  describe('leaveOrganization', () => {
    it('should remove organization from list and clear current if matching', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: '1', name: 'Org1' },
        { id: '2', name: 'Org2' },
      ];
      store.currentOrganization = { id: '1', name: 'Org1' };

      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await store.leaveOrganization('1');

      expect(store.organizations).toEqual([{ id: '2', name: 'Org2' }]);
      expect(store.currentOrganization).toBeNull();
    });

    it('should not clear current organization if different', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: '1', name: 'Org1' },
        { id: '2', name: 'Org2' },
      ];
      store.currentOrganization = { id: '2', name: 'Org2' };

      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await store.leaveOrganization('1');

      expect(store.organizations).toEqual([{ id: '2', name: 'Org2' }]);
      expect(store.currentOrganization).toEqual({ id: '2', name: 'Org2' });
    });

    it('should filter adminPendingRequests when leaving an org', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ id: '1', name: 'Org1' }];
      store.adminPendingRequests = [
        { organizationId: '1', organizationName: 'Org1', count: 3 },
        { organizationId: '2', organizationName: 'Org2', count: 1 },
      ];

      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await store.leaveOrganization('1');

      expect(store.adminPendingRequests).toEqual([
        { organizationId: '2', organizationName: 'Org2', count: 1 },
      ]);
    });

    it('should clear current when matching by _id', async () => {
      const store = useOrganizationsStore();
      store.organizations = [{ _id: 'a', name: 'OrgA' }];
      store.currentOrganization = { _id: 'a', name: 'OrgA' };

      axios.post.mockResolvedValueOnce({ data: { success: true } });

      await store.leaveOrganization('a');

      expect(store.currentOrganization).toBeNull();
      expect(store.organizations).toEqual([]);
    });
  });

  describe('resetOrganization', () => {
    it('should reset viewed organization and members', () => {
      const store = useOrganizationsStore();
      store.viewedOrganization = { id: '1', name: 'Org1' };
      store.members = [{ id: 'm1' }];

      store.resetOrganization();

      expect(store.viewedOrganization).toBeNull();
      expect(store.members).toEqual([]);
    });
  });

  describe('createJoinRequest', () => {
    it('should create a join request', async () => {
      const store = useOrganizationsStore();
      const mockRequest = { id: 'req1', status: 'pending' };

      axios.post.mockResolvedValueOnce({ data: { data: mockRequest } });

      const result = await store.createJoinRequest('org1');

      expect(axios.post).toHaveBeenCalledWith(`${API}/organizations/org1/requests`);
      expect(result).toEqual(mockRequest);
    });
  });

  describe('fetchPendingRequests', () => {
    it('should fetch pending requests', async () => {
      const store = useOrganizationsStore();
      const mockRequests = [{ id: 'req1' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockRequests } });

      const result = await store.fetchPendingRequests('org1');

      expect(axios.get).toHaveBeenCalledWith(`${API}/organizations/org1/requests`);
      expect(result).toEqual(mockRequests);
    });

    it('should return empty array when no data', async () => {
      const store = useOrganizationsStore();

      axios.get.mockResolvedValueOnce({ data: { data: null } });

      const result = await store.fetchPendingRequests('org1');

      expect(result).toEqual([]);
    });
  });

  describe('approveRequest', () => {
    it('should approve a request and refresh admin pending', async () => {
      const store = useOrganizationsStore();
      const mockApproved = { id: 'req1', status: 'approved' };

      axios.put.mockResolvedValueOnce({ data: { data: mockApproved } });
      // Mock fetchAdminPendingRequests (called internally)
      axios.get.mockResolvedValueOnce({ data: { data: [] } });

      const result = await store.approveRequest('org1', 'req1');

      expect(axios.put).toHaveBeenCalledWith(`${API}/organizations/org1/requests/req1/approve`);
      expect(result).toEqual(mockApproved);
    });
  });

  describe('rejectRequest', () => {
    it('should reject a request and refresh admin pending', async () => {
      const store = useOrganizationsStore();
      const mockRejected = { id: 'req1', status: 'rejected' };

      axios.put.mockResolvedValueOnce({ data: { data: mockRejected } });
      // Mock fetchAdminPendingRequests (called internally)
      axios.get.mockResolvedValueOnce({ data: { data: [] } });

      const result = await store.rejectRequest('org1', 'req1');

      expect(axios.put).toHaveBeenCalledWith(`${API}/organizations/org1/requests/req1/reject`);
      expect(result).toEqual(mockRejected);
    });
  });

  describe('fetchMyRequests', () => {
    it('should fetch user requests', async () => {
      const store = useOrganizationsStore();
      const mockRequests = [{ id: 'req1' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockRequests } });

      const result = await store.fetchMyRequests();

      expect(axios.get).toHaveBeenCalledWith(`${API}/membership-requests/mine`);
      expect(result).toEqual(mockRequests);
    });

    it('should return empty array when no data', async () => {
      const store = useOrganizationsStore();

      axios.get.mockResolvedValueOnce({ data: { data: null } });

      const result = await store.fetchMyRequests();

      expect(result).toEqual([]);
    });
  });

  describe('inviteMember', () => {
    it('should send invite and return data', async () => {
      const store = useOrganizationsStore();
      const mockInvite = { id: 'inv1', email: 'test@example.com' };

      axios.post.mockResolvedValueOnce({ data: { data: mockInvite } });

      const result = await store.inviteMember('org1', 'test@example.com');

      expect(axios.post).toHaveBeenCalledWith(`${API}/organizations/org1/invites`, { email: 'test@example.com' });
      expect(result).toEqual(mockInvite);
    });
  });

  describe('getInvite', () => {
    it('should get invite by token', async () => {
      const store = useOrganizationsStore();
      const mockInvite = { id: 'inv1', organization: 'org1' };

      axios.get.mockResolvedValueOnce({ data: { data: mockInvite } });

      const result = await store.getInvite('token123');

      expect(axios.get).toHaveBeenCalledWith(`${API}/invites/token123`);
      expect(result).toEqual(mockInvite);
    });
  });

  describe('acceptInvite', () => {
    it('should accept invite by token', async () => {
      const store = useOrganizationsStore();
      const mockResult = { id: 'inv1', status: 'accepted' };

      axios.post.mockResolvedValueOnce({ data: { data: mockResult } });

      const result = await store.acceptInvite('token123');

      expect(axios.post).toHaveBeenCalledWith(`${API}/invites/token123/accept`);
      expect(result).toEqual(mockResult);
    });
  });

  describe('searchOrganizationsByDomain', () => {
    it('should return domain-matched organizations', async () => {
      const store = useOrganizationsStore();
      const mockResults = [{ id: '1', name: 'Test Org' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockResults } });

      const result = await store.searchOrganizationsByDomain();

      expect(axios.get).toHaveBeenCalledWith(`${API}/organizations/search`);
      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no data', async () => {
      const store = useOrganizationsStore();

      axios.get.mockResolvedValueOnce({ data: { data: null } });

      const result = await store.searchOrganizationsByDomain();

      expect(result).toEqual([]);
    });
  });

  describe('fetchAdminPendingRequests', () => {
    it('should aggregate pending requests across orgs', async () => {
      const store = useOrganizationsStore();

      // fetchOrganizations call
      axios.get.mockResolvedValueOnce({
        data: { data: [{ _id: 'org1', name: 'Org1' }, { _id: 'org2', name: 'Org2' }] },
      });
      // fetchPendingRequests for org1
      axios.get.mockResolvedValueOnce({ data: { data: [{ id: 'req1' }] } });
      // fetchPendingRequests for org2
      axios.get.mockResolvedValueOnce({ data: { data: [] } });

      await store.fetchAdminPendingRequests();

      expect(store.adminPendingRequests).toEqual([
        { organizationId: 'org1', organizationName: 'Org1', count: 1 },
      ]);
    });

    it('should handle empty orgs list', async () => {
      const store = useOrganizationsStore();

      axios.get.mockResolvedValueOnce({ data: { data: [] } });

      await store.fetchAdminPendingRequests();

      expect(store.adminPendingRequests).toEqual([]);
    });
  });
});
