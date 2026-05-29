import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import AdminInvitations from '../views/admin.invitations.view.vue';

vi.mock('../../../lib/services/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  },
}));

const stubs = {
  coreDataTableComponent: true,
  coreConfirmDialog: true,
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button><slot /></button>' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-text-field': true,
  'v-form': { template: '<form><slot /></form>' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-icon': true,
};

const mountView = () =>
  shallowMount(AdminInvitations, {
    global: {
      mocks: { config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } } } },
      stubs,
    },
  });

describe('admin.invitations.view', () => {
  let store;
  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAdminStore();
    store.getInvitations = vi.fn().mockResolvedValue();
    store.createInvitation = vi.fn().mockResolvedValue({ id: '9', email: 'x@y.co' });
    store.deleteInvitation = vi.fn().mockResolvedValue();
  });

  it('exposes invitations from the admin store', () => {
    store.invitations = [{ id: '1', email: 'a@b.co', usedAt: null, expiresAt: null }];
    const wrapper = mountView();
    expect(wrapper.vm.invitations).toEqual([{ id: '1', email: 'a@b.co', usedAt: null, expiresAt: null }]);
  });

  it('fetchInvitations delegates to the store', async () => {
    const wrapper = mountView();
    await wrapper.vm.fetchInvitations();
    expect(store.getInvitations).toHaveBeenCalled();
  });

  it('inviteStatus derives Accepted / Expired / Pending', () => {
    const wrapper = mountView();
    expect(wrapper.vm.inviteStatus({ usedAt: '2026-01-01' }).label).toBe('Accepted');
    expect(wrapper.vm.inviteStatus({ usedAt: null, expiresAt: '2000-01-01' }).label).toBe('Expired');
    expect(wrapper.vm.inviteStatus({ usedAt: null, expiresAt: '2999-01-01' }).label).toBe('Pending');
  });

  it('submitInvite calls createInvitation then refreshes the list', async () => {
    const wrapper = mountView();
    wrapper.vm.createDialog.email = 'new@b.co';
    await wrapper.vm.submitInvite();
    expect(store.createInvitation).toHaveBeenCalledWith('new@b.co');
    expect(store.getInvitations).toHaveBeenCalled();
    expect(wrapper.vm.createDialog.show).toBe(false);
  });

  it('confirmRevoke calls deleteInvitation then refreshes', async () => {
    const wrapper = mountView();
    wrapper.vm.deleteDialog = { show: true, id: '7', email: 'z@z.co' };
    await wrapper.vm.confirmRevoke();
    expect(store.deleteInvitation).toHaveBeenCalledWith('7');
    expect(store.getInvitations).toHaveBeenCalled();
    expect(wrapper.vm.deleteDialog.show).toBe(false);
  });
});
