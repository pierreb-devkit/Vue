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
  userEmailPreferencesComponent: {
    template: '<div data-test="user-email-preferences-component" />',
    name: 'UserEmailPreferencesComponent',
    props: ['user', 'saving'],
  },
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

  test('renders the userEmailPreferencesComponent', () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });
    expect(wrapper.findComponent({ name: 'UserEmailPreferencesComponent' }).exists()).toBe(true);
  });

  test('updateEmailPreferences calls the users store and merges the response into authStore.user (never depends on refreshAbilities)', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };
    authStore.refreshAbilities = vi.fn().mockResolvedValue();
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn().mockResolvedValue({ emailPreferences: { onboarding: false, news: true } });

    const prefs = { onboarding: false, news: true };
    await wrapper.vm.updateEmailPreferences(prefs);

    expect(wrapper.vm.usersStore.updateEmailPreferences).toHaveBeenCalledWith(prefs);
    expect(authStore.user.emailPreferences).toEqual({ onboarding: false, news: true });
    expect(authStore.refreshAbilities).not.toHaveBeenCalled();
  });

  test('updateEmailPreferences writes the toggle optimistically — the new value is already on authStore.user while the PUT is still pending', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };

    let resolvePut;
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn(() => new Promise((resolve) => { resolvePut = resolve; }));

    const pending = wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });

    // Still pending — the optimistic write already flipped the switch.
    expect(authStore.user.emailPreferences).toEqual({ onboarding: false, news: true });

    resolvePut({});
    await pending;
  });

  test('updateEmailPreferences falls back to the sent values when the PUT response omits emailPreferences', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn().mockResolvedValue({});

    await wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });

    expect(authStore.user.emailPreferences).toEqual({ onboarding: false, news: true });
  });

  test('updateEmailPreferences reverts authStore.user.emailPreferences on failure (interceptor handles the snackbar)', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn().mockRejectedValue(new Error('Server error'));

    await expect(wrapper.vm.updateEmailPreferences({ onboarding: false, news: true })).resolves.toBeUndefined();

    expect(authStore.user.emailPreferences).toEqual({ onboarding: true, news: true });
  });

  test('savingEmailPreferences defaults to false and is passed to userEmailPreferencesComponent as "saving"', () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    expect(wrapper.vm.savingEmailPreferences).toBe(false);
    expect(wrapper.findComponent({ name: 'UserEmailPreferencesComponent' }).props('saving')).toBe(false);
  });

  test('updateEmailPreferences sets savingEmailPreferences while the PUT is pending, then clears it on success', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };

    let resolvePut;
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn(
      () => new Promise((resolve) => { resolvePut = resolve; }),
    );

    const pending = wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });

    expect(wrapper.vm.savingEmailPreferences).toBe(true);

    resolvePut({ emailPreferences: { onboarding: false, news: true } });
    await pending;

    expect(wrapper.vm.savingEmailPreferences).toBe(false);
  });

  test('updateEmailPreferences clears savingEmailPreferences even when the PUT fails', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };

    let rejectPut;
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn(
      () => new Promise((_resolve, reject) => { rejectPut = reject; }),
    );

    const pending = wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });
    expect(wrapper.vm.savingEmailPreferences).toBe(true);

    rejectPut(new Error('Server error'));
    await pending;

    expect(wrapper.vm.savingEmailPreferences).toBe(false);
  });

  test('updateEmailPreferences ignores a re-entrant call while the first PUT is still pending (a second toggle cannot start)', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };

    let rejectFirst;
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn(
      () => new Promise((_resolve, reject) => { rejectFirst = reject; }),
    );

    const firstPending = wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });
    expect(authStore.user.emailPreferences).toEqual({ onboarding: false, news: true });

    // Attempted while the first PUT is still in flight — must be a no-op, not a second request.
    await wrapper.vm.updateEmailPreferences({ onboarding: false, news: false });
    expect(wrapper.vm.usersStore.updateEmailPreferences).toHaveBeenCalledTimes(1);
    expect(authStore.user.emailPreferences).toEqual({ onboarding: false, news: true });

    // The first PUT now fails and reverts — nothing from the blocked second call to clobber.
    rejectFirst(new Error('Server error'));
    await firstPending;

    expect(authStore.user.emailPreferences).toEqual({ onboarding: true, news: true });
    expect(wrapper.vm.savingEmailPreferences).toBe(false);
  });

  test('updateEmailPreferences reverts to absent emailPreferences on failure when the user never had any', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1' };
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn().mockRejectedValue(new Error('Server error'));

    await wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });

    expect(authStore.user.emailPreferences).toBeUndefined();
  });

  test('updateEmailPreferences drops a stale PUT response if a different user signed in while it was pending (shared-device race)', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };

    let resolvePut;
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn(
      () => new Promise((resolve) => { resolvePut = resolve; }),
    );

    const pending = wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });

    // A different user signs in on the same tab before the PUT settles.
    authStore.user = { _id: 'u2', emailPreferences: { onboarding: true, news: false } };

    resolvePut({ emailPreferences: { onboarding: false, news: true } });
    await pending;

    // u1's stale response must not touch u2's state.
    expect(authStore.user).toEqual({ _id: 'u2', emailPreferences: { onboarding: true, news: false } });
  });

  test('updateEmailPreferences drops a stale revert if a different user signed in while the PUT was pending', async () => {
    const wrapper = shallowMount(UserProfileView, {
      global: {
        mocks: sharedMocks(),
        stubs: sharedStubs,
      },
    });

    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const authStore = useAuthStore();
    authStore.user = { _id: 'u1', emailPreferences: { onboarding: true, news: true } };

    let rejectPut;
    wrapper.vm.usersStore.updateEmailPreferences = vi.fn(
      () => new Promise((_resolve, reject) => { rejectPut = reject; }),
    );

    const pending = wrapper.vm.updateEmailPreferences({ onboarding: false, news: true });

    // A different user signs in on the same tab before the PUT settles.
    authStore.user = { _id: 'u2', emailPreferences: { onboarding: true, news: false } };

    rejectPut(new Error('Server error'));
    await pending;

    // u1's failed save must not revert u2's (unrelated) state.
    expect(authStore.user).toEqual({ _id: 'u2', emailPreferences: { onboarding: true, news: false } });
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
