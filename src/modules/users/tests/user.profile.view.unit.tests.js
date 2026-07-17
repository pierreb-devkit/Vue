import { describe, it, test, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { shallowMount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import UserProfileView from '../views/user.profile.view.vue';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock config service
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn() }));

const sharedStubs = {
  userProfileComponent: { template: '<div data-test="user-profile-component" />', name: 'UserProfileComponent' },
  coreConfirmDialog: { template: '<div data-test="core-confirm-dialog" />', name: 'CoreConfirmDialog' },
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button v-bind="$attrs"><slot /></button>' },
  'v-spacer': { template: '<div />' },
};

const sharedMocks = ($router = { push: vi.fn() }) => ({
  $router,
  $route: { path: '/users/profile' },
  config: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    vuetify: { theme: { rounded: 'rounded-lg', flat: true } },
  },
});

describe('user.profile.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  test('renders the userProfileComponent', () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });
    expect(wrapper.findComponent({ name: 'UserProfileComponent' }).exists()).toBe(true);
  });

  test('renders the danger zone Delete Account card', () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });
    expect(wrapper.html()).toContain('Delete Account');
  });

  test('confirmDeleteAccount defaults to false', () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });
    expect(wrapper.vm.confirmDeleteAccount).toBe(false);
  });

  test('deleteAccount calls the users store, signs out, and redirects to /signin on success', async () => {
    const routerPush = vi.fn();

    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks({ push: routerPush }),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.signout = vi.fn().mockResolvedValue();
    wrapper.vm.usersStore.deleteAccount = vi.fn().mockResolvedValue();

    await wrapper.vm.deleteAccount();

    expect(wrapper.vm.usersStore.deleteAccount).toHaveBeenCalled();
    expect(authStore.signout).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/signin');
  });

  test('deleteAccount closes dialog on error (swallows exception)', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    wrapper.vm.confirmDeleteAccount = true;
    wrapper.vm.usersStore.deleteAccount = vi.fn().mockRejectedValue(new Error('Server error'));

    await wrapper.vm.deleteAccount();

    expect(wrapper.vm.confirmDeleteAccount).toBe(false);
  });

  test('updateProfile calls the users store then refreshes abilities', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.refreshAbilities = vi.fn().mockResolvedValue();
    wrapper.vm.usersStore.updateProfile = vi.fn().mockResolvedValue({});

    const formData = { firstName: 'Jane', lastName: 'Smith', bio: 'Dev', position: 'Engineer' };
    await wrapper.vm.updateProfile(formData);

    expect(wrapper.vm.usersStore.updateProfile).toHaveBeenCalledWith(formData);
    expect(authStore.refreshAbilities).toHaveBeenCalled();
  });

  test('updateProfile swallows a store error (interceptor handles the snackbar)', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    wrapper.vm.usersStore.updateProfile = vi.fn().mockRejectedValue(new Error('Server error'));

    await expect(wrapper.vm.updateProfile({ firstName: 'Jane' })).resolves.toBeUndefined();
  });
});

describe('user.profile.view — no direct axios import (routed through users.store)', () => {
  it('does not import axios directly from the view (UI → Store → API layering)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.profile.view.vue'), 'utf8');
    expect(sfc).not.toMatch(/import axios/);
    expect(sfc).toMatch(/import \{ useUsersStore \} from '\.\.\/stores\/users\.store'/);
  });
});

describe('user.profile.view — template chrome', () => {
  it('wraps content in <v-row class="pa-2 mt-0"> + <v-col cols="12"> + <v-card color="surface">', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.profile.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<v-row[^>]*class="[^"]*pa-2\s+mt-0/);
    expect(tmpl).toMatch(/<v-col\s+cols="12"/);
    expect(tmpl).toMatch(/<v-card[^>]*color="surface"/);
  });
});

describe('user.profile.view — confirm dialog', () => {
  it('uses coreConfirmDialog for Delete Account (no inline v-dialog)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.profile.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<coreConfirmDialog/);
    expect(tmpl).not.toMatch(/<v-dialog/);
  });

  it('drops the deleteConfirmInput data field (coreConfirmDialog manages typed state)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/user.profile.view.vue'), 'utf8');
    expect(sfc).not.toMatch(/deleteConfirmInput/);
  });
});
