import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { reactive } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { useUserHeaderActions } from '@/lib/composables/useUserHeaderActions';

// authStoreState is a mutable hoisted object so individual tests can toggle
// isLoggedIn before mounting. `vi.hoisted`'s factory runs before this file's
// own imports are initialized, so it must stay import-free — `reactive()` is
// applied just below instead, once `reactive` (imported above) is available,
// so post-mount `isLoggedIn` flips are tracked by the component's `watch`,
// the same way the real Pinia-backed store would be.
let authStoreState = vi.hoisted(() => ({ isLoggedIn: false }));
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
}));

const fetchOrganizationsMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({ fetchOrganizations: fetchOrganizationsMock }),
}));

authStoreState = reactive(authStoreState);

import OrganizationsHeaderAction from '../components/organizations.headerAction.component.vue';

describe('organizations.headerAction.component — registry behavior', () => {
  // Tracked so `afterEach` can always unmount — now that authStoreState is
  // reactive, a wrapper left mounted across tests keeps its `watch` alive and
  // subscribed, double-counting fetchOrganizations calls in later tests.
  let wrapper;

  beforeEach(() => {
    const { extras } = useUserHeaderActions();
    extras.value = [];
    authStoreState.isLoggedIn = false;
    fetchOrganizationsMock.mockReset();
    fetchOrganizationsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    const { extras } = useUserHeaderActions();
    extras.value = [];
  });

  it('registers the organizations switcher unconditionally on mount', async () => {
    wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();
    const { extras } = useUserHeaderActions();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeTruthy();
  });

  it('unregisters the switcher on unmount', async () => {
    wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();
    const { extras } = useUserHeaderActions();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeTruthy();
    wrapper.unmount();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeUndefined();
  });

  it('pre-loads organizations as soon as isLoggedIn is true on mount', async () => {
    authStoreState.isLoggedIn = true;
    wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();
    expect(fetchOrganizationsMock).toHaveBeenCalledOnce();
  });

  it('does not fetch organizations when not logged in', async () => {
    authStoreState.isLoggedIn = false;
    wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();
    expect(fetchOrganizationsMock).not.toHaveBeenCalled();
  });

  it('logs (does not silently swallow) a fetchOrganizations failure', async () => {
    authStoreState.isLoggedIn = true;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchOrganizationsMock.mockRejectedValueOnce(new Error('network down'));

    wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('fetches organizations when isLoggedIn flips false→true AFTER mount (reactive watch, not just immediate-on-mount) and keeps the switcher registered', async () => {
    authStoreState.isLoggedIn = false;
    wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();
    expect(fetchOrganizationsMock).not.toHaveBeenCalled();
    const { extras } = useUserHeaderActions();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeTruthy();

    authStoreState.isLoggedIn = true;
    await flushPromises();
    expect(fetchOrganizationsMock).toHaveBeenCalledOnce();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeTruthy();
  });
});
