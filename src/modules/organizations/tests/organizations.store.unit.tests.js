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

describe('Organizations Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default state', () => {
    const store = useOrganizationsStore();
    expect(store.currentOrganization).toBeNull();
    expect(store.organizations).toEqual([]);
    expect(store.members).toEqual([]);
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

      expect(store.organizations).toEqual(mockOrgs);
      expect(result).toEqual(mockOrgs);
    });
  });

  describe('createOrganization', () => {
    it('should create and set current organization', async () => {
      const store = useOrganizationsStore();
      const newOrg = { id: '1', name: 'New Org' };

      axios.post.mockResolvedValueOnce({ data: { data: newOrg } });

      const result = await store.createOrganization({ name: 'New Org' });

      expect(store.currentOrganization).toEqual(newOrg);
      expect(result).toEqual(newOrg);
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
  });

  describe('inviteMember', () => {
    it('should send invite and return data', async () => {
      const store = useOrganizationsStore();
      const mockInvite = { id: 'inv1', email: 'test@example.com' };

      axios.post.mockResolvedValueOnce({ data: { data: mockInvite } });

      const result = await store.inviteMember('org1', 'test@example.com');

      expect(result).toEqual(mockInvite);
    });
  });

  describe('searchOrganizationsByDomain', () => {
    it('should return domain-matched organizations', async () => {
      const store = useOrganizationsStore();
      const mockResults = [{ id: '1', name: 'Test Org' }];

      axios.get.mockResolvedValueOnce({ data: { data: mockResults } });

      const result = await store.searchOrganizationsByDomain();

      expect(result).toEqual(mockResults);
    });

    it('should return empty array when no data', async () => {
      const store = useOrganizationsStore();

      axios.get.mockResolvedValueOnce({ data: { data: null } });

      const result = await store.searchOrganizationsByDomain();

      expect(result).toEqual([]);
    });
  });
});
