import { describe, test, expect, vi, beforeEach } from 'vitest';
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
  'v-container': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-card-title': { template: '<div><slot /></div>' },
  'v-card-text': { template: '<div><slot /></div>' },
  'v-card-actions': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button v-bind="$attrs"><slot /></button>' },
  'v-dialog': { template: '<div><slot /></div>' },
  'v-text-field': { template: '<div />' },
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

  test('deleteAccount method calls axios.delete and redirects to /signin on success', async () => {
    const axios = (await import('../../../lib/services/axios')).default;
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
    axios.delete.mockResolvedValue({});

    await wrapper.vm.deleteAccount();

    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/users'));
    expect(authStore.signout).toHaveBeenCalled();
    expect(routerPush).toHaveBeenCalledWith('/signin');
  });

  test('deleteAccount closes dialog on error (swallows exception)', async () => {
    const axios = (await import('../../../lib/services/axios')).default;

    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    wrapper.vm.confirmDeleteAccount = true;
    wrapper.vm.deleteConfirmInput = 'DELETE';
    axios.delete.mockRejectedValue(new Error('Server error'));

    await wrapper.vm.deleteAccount();

    expect(wrapper.vm.confirmDeleteAccount).toBe(false);
    expect(wrapper.vm.deleteConfirmInput).toBe('');
  });
});
