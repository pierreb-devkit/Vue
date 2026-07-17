import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { useUserHeaderActions } from '@/lib/composables/useUserHeaderActions';

// authStoreState is a mutable hoisted object so individual tests can toggle
// isLoggedIn before mounting.
const authStoreState = vi.hoisted(() => ({ isLoggedIn: false }));
vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreState,
}));

const fetchOrganizationsMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({ fetchOrganizations: fetchOrganizationsMock }),
}));

import OrganizationsHeaderAction from '../components/organizations.headerAction.component.vue';

describe('organizations.headerAction.component — registry behavior', () => {
  beforeEach(() => {
    const { extras } = useUserHeaderActions();
    extras.value = [];
    authStoreState.isLoggedIn = false;
    fetchOrganizationsMock.mockReset();
    fetchOrganizationsMock.mockResolvedValue([]);
  });

  afterEach(() => {
    const { extras } = useUserHeaderActions();
    extras.value = [];
  });

  it('registers the organizations switcher unconditionally on mount', async () => {
    mount(OrganizationsHeaderAction);
    await flushPromises();
    const { extras } = useUserHeaderActions();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeTruthy();
  });

  it('unregisters the switcher on unmount', async () => {
    const wrapper = mount(OrganizationsHeaderAction);
    await flushPromises();
    const { extras } = useUserHeaderActions();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeTruthy();
    wrapper.unmount();
    expect(extras.value.find((e) => e._id === 'organizations-switcher')).toBeUndefined();
  });

  it('pre-loads organizations as soon as isLoggedIn is true on mount', async () => {
    authStoreState.isLoggedIn = true;
    mount(OrganizationsHeaderAction);
    await flushPromises();
    expect(fetchOrganizationsMock).toHaveBeenCalledOnce();
  });

  it('does not fetch organizations when not logged in', async () => {
    authStoreState.isLoggedIn = false;
    mount(OrganizationsHeaderAction);
    await flushPromises();
    expect(fetchOrganizationsMock).not.toHaveBeenCalled();
  });

  it('logs (does not silently swallow) a fetchOrganizations failure', async () => {
    authStoreState.isLoggedIn = true;
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchOrganizationsMock.mockRejectedValueOnce(new Error('network down'));

    mount(OrganizationsHeaderAction);
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
