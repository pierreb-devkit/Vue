import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount } from '@vue/test-utils';
import { useAdminStore } from '../stores/admin.store';
import AdminUsers from '../views/admin.users.view.vue';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
    whitelists: { users: { roles: ['user', 'admin'] } },
  },
}));

// Mock helpers
vi.mock('../../../lib/helpers/roleColor', () => ({ default: () => 'primary' }));
vi.mock('../../../lib/helpers/orgColor', () => ({ default: () => 'blue' }));

const vuetifyStubs = {
  coreDataTableComponent: true,
  'router-link': { template: '<a><slot /></a>' },
  'v-container': { template: '<div><slot /></div>' },
  'v-btn': { template: '<div><slot /></div>' },
  'v-menu': { template: '<div><slot /></div>' },
  'v-list': { template: '<div><slot /></div>' },
  'v-list-subheader': { template: '<div><slot /></div>' },
  'v-list-item': { template: '<div><slot /></div>' },
  'v-list-item-title': { template: '<div><slot /></div>' },
  'v-icon': { template: '<i />' },
  'v-chip': { template: '<span><slot /></span>' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-spacer': { template: '<div />' },
};

describe('admin.users.view', () => {
  let adminStore;
  let wrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    adminStore = useAdminStore();
    adminStore.getUsers = vi.fn().mockResolvedValue();
    adminStore.updateUser = vi.fn().mockResolvedValue();
    adminStore.deleteUser = vi.fn().mockResolvedValue();

    wrapper = shallowMount(AdminUsers, {
      global: {
        mocks: {
          $router: { push: vi.fn() },
          config: {
            vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
            whitelists: { users: { roles: ['user', 'admin'] } },
          },
        },
        stubs: vuetifyStubs,
      },
    });
  });

  it('should expose users from the admin store', () => {
    adminStore.users = [{ _id: '1', firstName: 'Alice' }];
    expect(wrapper.vm.users).toEqual([{ _id: '1', firstName: 'Alice' }]);
  });

  it('should fetch users via the store action', async () => {
    await wrapper.vm.fetchUsers('0&5&search');
    expect(adminStore.getUsers).toHaveBeenCalledWith('0&5&search');
  });

  it('should detect the active organization of a user', () => {
    const user = { currentOrganization: 'orgA' };
    expect(wrapper.vm.isUserActiveOrg(user, { organizationId: 'orgA' })).toBe(true);
    expect(wrapper.vm.isUserActiveOrg(user, { organizationId: 'orgB' })).toBe(false);
  });

  it('should handle nested object organizationId in isUserActiveOrg', () => {
    const user = { currentOrganization: { _id: 'orgA' } };
    expect(wrapper.vm.isUserActiveOrg(user, { organizationId: { _id: 'orgA' } })).toBe(true);
  });

  it('should toggle a role on a user (add then remove)', async () => {
    const user = { _id: 'u1', roles: ['user'] };
    await wrapper.vm.toggleUserRole(user, 'admin');
    expect(adminStore.updateUser).toHaveBeenCalledWith({ id: 'u1' }, { roles: ['user', 'admin'] });

    const userWithAdmin = { _id: 'u1', roles: ['user', 'admin'] };
    await wrapper.vm.toggleUserRole(userWithAdmin, 'admin');
    expect(adminStore.updateUser).toHaveBeenLastCalledWith({ id: 'u1' }, { roles: ['user'] });
  });

  it('should open the delete dialog with the user info', () => {
    wrapper.vm.openDeleteDialog({ _id: 'u1', firstName: 'Alice', lastName: 'Smith' });
    expect(wrapper.vm.deleteDialog.show).toBe(true);
    expect(wrapper.vm.deleteDialog.userId).toBe('u1');
    expect(wrapper.vm.deleteDialog.userName).toBe('Alice Smith');
  });

  it('should fall back to email when name is empty in openDeleteDialog', () => {
    wrapper.vm.openDeleteDialog({ _id: 'u2', email: 'alice@example.com' });
    expect(wrapper.vm.deleteDialog.userName).toBe('alice@example.com');
  });

  it('should confirm user deletion and close the dialog', async () => {
    wrapper.vm.deleteDialog = { show: true, userId: 'u1', userName: 'Alice' };
    await wrapper.vm.confirmDeleteUser();
    expect(adminStore.deleteUser).toHaveBeenCalledWith({ id: 'u1' });
    expect(wrapper.vm.deleteDialog.show).toBe(false);
  });
});

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

describe('admin.users.view — template chrome', () => {
  it('does NOT wrap its template in <v-container> (admin layout owns chrome)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.users.view.vue'), 'utf8');
    // Extract only the top-level <template>…</template> block (before <script>)
    const tmpl = sfc.split('<script>')[0] || '';
    expect(tmpl).not.toMatch(/<v-container/);
  });
});

describe('admin.users.view — confirm dialog', () => {
  it('uses coreConfirmDialog (no inline v-dialog)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.users.view.vue'), 'utf8');
    // Extract only the top-level <template>…</template> block (before <script>)
    const tmpl = sfc.split('<script>')[0] || '';
    expect(tmpl).toMatch(/<coreConfirmDialog/);
    expect(tmpl).not.toMatch(/<v-dialog/);
  });
});
