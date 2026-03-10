import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useOrganizationsStore } from '../stores/organizations.store';
import axios from '../../../lib/services/axios';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock ability helpers
vi.mock('../../../lib/helpers/ability', () => ({
  ability: { rules: [], can: vi.fn(() => true), update: vi.fn() },
  updateAbilities: vi.fn(),
}));

describe('Organizations Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = useOrganizationsStore();
    expect(store.currentOrganization).toBeNull();
    expect(store.organizations).toEqual([]);
    expect(store.members).toEqual([]);
  });

  it('should reset organization and members', () => {
    const store = useOrganizationsStore();
    store.currentOrganization = { id: '1', name: 'Test' };
    store.members = [{ id: 'm1' }];

    store.resetOrganization();

    expect(store.currentOrganization).toBeNull();
    expect(store.members).toEqual([]);
  });

  describe('fetchOrganizations', () => {
    it('should fetch and set organizations', async () => {
      const store = useOrganizationsStore();
      const mockOrgs = [
        { id: '1', name: 'Org 1' },
        { id: '2', name: 'Org 2' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockOrgs } });

      await store.fetchOrganizations();

      expect(store.organizations).toEqual(mockOrgs);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organizations'));
    });

    it('should handle fetchOrganizations error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Network error'));

      await store.fetchOrganizations();

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchOrganization', () => {
    it('should fetch and set a single organization', async () => {
      const store = useOrganizationsStore();
      const mockOrg = { id: '1', name: 'Org 1', description: 'Test org' };

      axios.get.mockResolvedValueOnce({ data: { data: mockOrg } });

      await store.fetchOrganization('1');

      expect(store.currentOrganization).toEqual(mockOrg);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organizations/1'));
    });

    it('should handle fetchOrganization error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Not found'));

      await store.fetchOrganization('999');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('createOrganization', () => {
    it('should create a new organization', async () => {
      const store = useOrganizationsStore();
      const newOrg = { name: 'New Org', description: 'A new org' };
      const mockResponse = { data: { data: { id: '3', ...newOrg } } };

      axios.post.mockResolvedValueOnce(mockResponse);

      await store.createOrganization(newOrg);

      expect(store.currentOrganization).toEqual(mockResponse.data.data);
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/organizations'), newOrg);
    });

    it('should handle createOrganization error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Validation error'));

      await store.createOrganization({ name: '' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('updateOrganization', () => {
    it('should update an existing organization', async () => {
      const store = useOrganizationsStore();
      const updatedOrg = { id: '1', name: 'Updated Org', description: 'Updated' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedOrg } });

      await store.updateOrganization('1', { name: 'Updated Org', description: 'Updated' });

      expect(store.currentOrganization).toEqual(updatedOrg);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/1'),
        { name: 'Updated Org', description: 'Updated' },
      );
    });

    it('should handle updateOrganization error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Failed'));

      await store.updateOrganization('1', { name: '' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('deleteOrganization', () => {
    it('should delete an organization and update state', async () => {
      const store = useOrganizationsStore();
      store.currentOrganization = { id: '1', name: 'Org' };
      store.organizations = [
        { id: '1', name: 'Org' },
        { id: '2', name: 'Org 2' },
      ];

      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      await store.deleteOrganization('1');

      expect(store.currentOrganization).toBeNull();
      expect(store.organizations).toEqual([{ id: '2', name: 'Org 2' }]);
    });

    it('should handle deleteOrganization error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Forbidden'));

      await store.deleteOrganization('1');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('switchOrganization', () => {
    it('should switch organization and update abilities', async () => {
      const store = useOrganizationsStore();
      store.organizations = [
        { id: '1', name: 'Org 1' },
        { id: '2', name: 'Org 2' },
      ];

      const mockResponse = {
        data: {
          abilities: [{ action: 'read', subject: 'Task' }],
          user: { id: 'u1', name: 'User' },
          tokenExpiresIn: 99999,
        },
      };

      axios.post.mockResolvedValueOnce(mockResponse);

      await store.switchOrganization('2');

      expect(store.currentOrganization).toEqual({ id: '2', name: 'Org 2' });
      expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/organizations/2/switch'));
    });

    it('should handle switchOrganization error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Failed'));

      await store.switchOrganization('1');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('fetchMembers', () => {
    it('should fetch and set members', async () => {
      const store = useOrganizationsStore();
      const mockMembers = [
        { id: 'm1', email: 'a@b.com', role: 'admin' },
        { id: 'm2', email: 'c@d.com', role: 'member' },
      ];

      axios.get.mockResolvedValueOnce({ data: { data: mockMembers } });

      await store.fetchMembers('org1');

      expect(store.members).toEqual(mockMembers);
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/organizations/org1/members'));
    });

    it('should handle fetchMembers error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.get.mockRejectedValueOnce(new Error('Failed'));

      await store.fetchMembers('org1');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('inviteMember', () => {
    it('should invite a member', async () => {
      const store = useOrganizationsStore();
      const inviteData = { email: 'new@member.com', role: 'member' };
      const mockResult = { id: 'inv1', email: 'new@member.com', status: 'pending' };

      axios.post.mockResolvedValueOnce({ data: { data: mockResult } });

      const result = await store.inviteMember('org1', inviteData);

      expect(result).toEqual(mockResult);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org1/members/invite'),
        inviteData,
      );
    });

    it('should handle inviteMember error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockRejectedValueOnce(new Error('Already a member'));

      await store.inviteMember('org1', { email: 'existing@member.com', role: 'member' });

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('changeMemberRole', () => {
    it('should change a member role and update local state', async () => {
      const store = useOrganizationsStore();
      store.members = [
        { id: 'm1', email: 'a@b.com', role: 'member' },
        { id: 'm2', email: 'c@d.com', role: 'member' },
      ];
      const updatedMember = { id: 'm1', email: 'a@b.com', role: 'admin' };

      axios.put.mockResolvedValueOnce({ data: { data: updatedMember } });

      await store.changeMemberRole('org1', 'm1', 'admin');

      expect(store.members[0]).toEqual(updatedMember);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/org1/members/m1'),
        { role: 'admin' },
      );
    });

    it('should handle changeMemberRole error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.put.mockRejectedValueOnce(new Error('Forbidden'));

      await store.changeMemberRole('org1', 'm1', 'admin');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('removeMember', () => {
    it('should remove a member and update local state', async () => {
      const store = useOrganizationsStore();
      store.members = [
        { id: 'm1', email: 'a@b.com', role: 'member' },
        { id: 'm2', email: 'c@d.com', role: 'admin' },
      ];

      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      await store.removeMember('org1', 'm1');

      expect(store.members).toEqual([{ id: 'm2', email: 'c@d.com', role: 'admin' }]);
      expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/organizations/org1/members/m1'));
    });

    it('should handle removeMember error', async () => {
      const store = useOrganizationsStore();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.delete.mockRejectedValueOnce(new Error('Forbidden'));

      await store.removeMember('org1', 'm1');

      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });
});
