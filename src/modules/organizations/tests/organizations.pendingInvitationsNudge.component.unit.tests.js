import { describe, it, expect, beforeEach, vi } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PendingInvitationsNudge from '../components/organizations.pendingInvitationsNudge.component.vue';

// Mock config service (consumed by the auth + organizations stores)
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));
vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn(), ability: { rules: [], can: vi.fn() } }));

const stubs = {
  'v-snackbar': { template: '<div data-test="snackbar-stub"><slot /><slot name="actions" /></div>' },
  'v-btn': { template: '<button v-bind="$attrs" :to="$attrs.to"><slot /></button>', inheritAttrs: false },
  'v-icon': { template: '<i />' },
};

/**
 * Mount the nudge with real pinia stores so the isLoggedIn watch is reactive.
 * isLoggedIn derives from `!!authStore.cookieExpire` — flip it to simulate login.
 * @param {Object} [opts]
 * @param {Array} [opts.invitations] - Rows fetchMyPendingInvitations resolves with
 * @param {boolean} [opts.loggedIn] - Whether the user starts logged in
 * @returns {Promise<{ wrapper, authStore, orgStore, fetchMock }>}
 */
async function mountNudge({ invitations = [], loggedIn = false } = {}) {
  const { useAuthStore } = await import('../../auth/stores/auth.store');
  const { useOrganizationsStore } = await import('../stores/organizations.store');
  const authStore = useAuthStore();
  const orgStore = useOrganizationsStore();
  const fetchMock = vi.fn().mockImplementation(() => {
    orgStore.pendingInvitations = invitations;
    return Promise.resolve(invitations);
  });
  orgStore.fetchMyPendingInvitations = fetchMock;
  if (loggedIn) authStore.cookieExpire = Date.now() + 100000;
  const wrapper = shallowMount(PendingInvitationsNudge, {
    global: { stubs },
  });
  await flushPromises();
  return { wrapper, authStore, orgStore, fetchMock };
}

describe('organizations.pendingInvitationsNudge.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows after login when the fetch returns pending invitations', async () => {
    const { wrapper, authStore, fetchMock } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
    });

    // Logged out: nothing fetched, nothing visible.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(wrapper.vm.visible).toBe(false);

    // Login → fetch fires, nudge becomes visible with the count.
    authStore.cookieExpire = Date.now() + 100000;
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.vm.visible).toBe(true);
  });

  it('does not show when the fetch returns no pending invitations', async () => {
    const { wrapper, fetchMock } = await mountNudge({ invitations: [], loggedIn: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.count).toBe(0);
    expect(wrapper.vm.visible).toBe(false);
  });

  it('View action routes to /users/organizations and dismisses', async () => {
    const { wrapper } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(wrapper.vm.visible).toBe(true);

    const view = wrapper.find('[data-test="pending-invitations-nudge-view"]');
    expect(view.exists()).toBe(true);
    expect(view.attributes('to')).toBe('/users/organizations');

    await view.trigger('click');
    expect(wrapper.vm.dismissed).toBe(true);
    expect(wrapper.vm.visible).toBe(false);
  });

  it('snackbar v-model set(false) (timeout/close) dismisses', async () => {
    const { wrapper } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(wrapper.vm.visible).toBe(true);
    wrapper.vm.visible = false;
    expect(wrapper.vm.dismissed).toBe(true);
    expect(wrapper.vm.visible).toBe(false);
  });

  it('fires once per login session (guarded), and re-arms after logout → login', async () => {
    const { wrapper, authStore, fetchMock } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Same session: a re-invocation of the handler is guarded by the announced flag.
    await wrapper.vm.$options.watch.isLoggedIn.handler.call(wrapper.vm, true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Dismiss, then logout: the nudge re-arms for the next session.
    wrapper.vm.dismiss();
    authStore.cookieExpire = 0;
    await flushPromises();
    expect(wrapper.vm.visible).toBe(false);
    expect(wrapper.vm.announced).toBe(false);
    expect(wrapper.vm.dismissed).toBe(false);

    // New login session → fetch + nudge again.
    authStore.cookieExpire = Date.now() + 100000;
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(wrapper.vm.visible).toBe(true);
  });

  it('stays hidden until the post-login fetch has run (announced gate)', async () => {
    const { useOrganizationsStore } = await import('../stores/organizations.store');
    const orgStore = useOrganizationsStore();
    // Stale rows in the store from a previous view should not flash the nudge pre-login.
    orgStore.pendingInvitations = [{ id: 'stale', role: 'member' }];
    orgStore.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    const wrapper = shallowMount(PendingInvitationsNudge, { global: { stubs } });
    await flushPromises();
    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.vm.visible).toBe(false);
  });

  it('survives a failing fetch (best-effort, stays hidden)', async () => {
    const { useAuthStore } = await import('../../auth/stores/auth.store');
    const { useOrganizationsStore } = await import('../stores/organizations.store');
    const authStore = useAuthStore();
    const orgStore = useOrganizationsStore();
    orgStore.fetchMyPendingInvitations = vi.fn().mockRejectedValue(new Error('boom'));
    authStore.cookieExpire = Date.now() + 100000;
    const wrapper = shallowMount(PendingInvitationsNudge, { global: { stubs } });
    await flushPromises();
    expect(orgStore.fetchMyPendingInvitations).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.visible).toBe(false);
  });

  it('drains automatically when invitations are accepted elsewhere (shared store)', async () => {
    const { wrapper, orgStore } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(wrapper.vm.visible).toBe(true);
    // Accepting the invitation on /users/organizations filters the shared list.
    orgStore.pendingInvitations = [];
    expect(wrapper.vm.visible).toBe(false);
  });
});
