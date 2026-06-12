import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, shallowMount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// v-snackbar uses visualViewport which is not available in jsdom
if (typeof globalThis.visualViewport === 'undefined') {
  globalThis.visualViewport = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    width: 1024,
    height: 768,
  };
}

// Mock config service (consumed by the auth + organizations stores)
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
  },
}));

// Mock generated @/config — used directly by the component for feature flags
// (isLoggedIn watcher gates on config.organizations being truthy).
// Without this mock, a clean checkout without src/config/index.js would fail to
// import the SFC and the nudge logic would be silently skipped.
vi.mock('@/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
    organizations: { enabled: true },
  },
}));
vi.mock('../../../lib/helpers/ability', () => ({ updateAbilities: vi.fn(), ability: { rules: [], can: vi.fn() } }));

// ── Component + store imports (real pinia stores, mocked per-instance) ───────

import OrganizationsLoginNotices from '../components/organizations.loginNotices.component.vue';
import { useAuthStore } from '../../auth/stores/auth.store';
import { useOrganizationsStore } from '../stores/organizations.store';

// ── Suggested-join harness ────────────────────────────────────────────────────

/**
 * Prime the real stores for the suggested-join tests: set the suggestedJoin
 * payload and replace the actions the component calls with vi.fn() mocks.
 * @param {{ orgId: string, orgName: string } | null} suggestedJoin
 * @returns {{ authStore, orgStore, dismissSuggestedJoinMock, createJoinRequestMock }}
 */
function setupSuggestedStores(suggestedJoin) {
  const authStore = useAuthStore();
  const orgStore = useOrganizationsStore();
  authStore.suggestedJoin = suggestedJoin;
  const dismissSuggestedJoinMock = vi.fn();
  authStore.dismissSuggestedJoin = dismissSuggestedJoinMock;
  const createJoinRequestMock = vi.fn();
  orgStore.createJoinRequest = createJoinRequestMock;
  return { authStore, orgStore, dismissSuggestedJoinMock, createJoinRequestMock };
}

/**
 * Mount the loginNotices component with Vuetify installed (full mount).
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = () =>
  mount(OrganizationsLoginNotices, {
    global: {
      plugins: [createVuetify()],
    },
  });

/**
 * Build a fake axios-style rejection for a given HTTP status + description.
 * @param {number} status
 * @param {string} description
 * @returns {Error}
 */
function makeAxiosError(status, description) {
  const err = new Error(description);
  err.response = { status, data: { description } };
  return err;
}

// ── Nudge harness ─────────────────────────────────────────────────────────────

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
  const authStore = useAuthStore();
  const orgStore = useOrganizationsStore();
  const fetchMock = vi.fn().mockImplementation(() => {
    orgStore.pendingInvitations = invitations;
    return Promise.resolve(invitations);
  });
  orgStore.fetchMyPendingInvitations = fetchMock;
  if (loggedIn) authStore.cookieExpire = Date.now() + 100000;
  const wrapper = shallowMount(OrganizationsLoginNotices, {
    global: { stubs },
  });
  await flushPromises();
  return { wrapper, authStore, orgStore, fetchMock };
}

// ── Tests — suggested workspace join ─────────────────────────────────────────

describe('organizations.loginNotices.component — suggested join', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // ── No-op when null ──────────────────────────────────────────────────────

  it('renders nothing when suggestedJoin is null', () => {
    setupSuggestedStores(null);
    const wrapper = mountComponent();

    // Primary banner is v-if guarded — no CTA or org name should be present
    expect(wrapper.vm.suggestedJoin).toBe(null);
    expect(wrapper.vm.suggested.visible).toBe(true);
    // Feedback snackbar is outside the guard but hidden (feedback.visible=false)
    expect(wrapper.vm.suggested.feedback.visible).toBe(false);
  });

  // ── Renders when set ─────────────────────────────────────────────────────

  it('renders org name, CTA, and dismiss when suggestedJoin is set', async () => {
    setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.vm.suggestedJoin).toEqual({ orgId: 'org1', orgName: 'Acme Corp' });
    // The computed is reactive; text content is rendered inside Vuetify portal
    // so we verify the computed value and the loading state is false (ready to interact)
    expect(wrapper.vm.suggested.loading).toBe(false);
    expect(wrapper.vm.suggested.visible).toBe(true);
  });

  // ── CTA success ──────────────────────────────────────────────────────────

  it('calls createJoinRequest with orgId, shows success feedback, and dismisses on success', async () => {
    const { dismissSuggestedJoinMock, createJoinRequestMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    createJoinRequestMock.mockResolvedValueOnce({});

    const wrapper = mountComponent();
    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(createJoinRequestMock).toHaveBeenCalledWith('org1');
    expect(wrapper.vm.suggested.feedback.visible).toBe(true);
    expect(wrapper.vm.suggested.feedback.color).toBe('success');
    expect(dismissSuggestedJoinMock).toHaveBeenCalledTimes(1);
  });

  // ── Benign rejection matrix ───────────────────────────────────────────────
  // Uses the REAL backend error strings (capitalized as thrown by the Node service).
  // Sources: organizations.membership.service.js L160, L161, L165;
  //          organizations.controller.js L211 (404).

  it.each([
    [
      'already a member (same-org active)',
      // membership.service.js L160: 'Already a member of this organization'
      makeAxiosError(422, 'Already a member of this organization'),
      "You're already a member of that workspace.",
    ],
    [
      'same-org pending request exists',
      // membership.service.js L161: 'A pending request already exists'
      makeAxiosError(422, 'A pending request already exists'),
      'Request already sent. Awaiting approval.',
    ],
    [
      'cross-org one-pending cap',
      // membership.service.js L165: 'You already have a pending request. Please wait...'
      makeAxiosError(422, 'You already have a pending request. Please wait for it to be reviewed before requesting to join another organization.'),
      'Request already sent. Awaiting approval.',
    ],
    [
      'org not found / 404',
      // organizations.controller.js L211: 'No Organization with that identifier has been found'
      makeAxiosError(404, 'No Organization with that identifier has been found'),
      'That workspace no longer exists.',
    ],
  ])(
    'benign "%s" → info toast + dismissSuggestedJoin called (no error toast)',
    async (_label, err, expectedMsg) => {
      const { dismissSuggestedJoinMock, createJoinRequestMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
      createJoinRequestMock.mockRejectedValueOnce(err);

      const wrapper = mountComponent();
      await wrapper.vm.requestAccess();
      await flushPromises();

      // Neutral (info) feedback, NOT error
      expect(wrapper.vm.suggested.feedback.visible).toBe(true);
      expect(wrapper.vm.suggested.feedback.color).toBe('info');
      expect(wrapper.vm.suggested.feedback.text).toBe(expectedMsg);

      // suggestedJoin must be dismissed
      expect(dismissSuggestedJoinMock).toHaveBeenCalledTimes(1);
    },
  );

  // ── Genuine error — error toast, NOT dismissed ───────────────────────────

  it('genuine error (network/500) → error toast shown and dismissSuggestedJoin NOT called', async () => {
    const { dismissSuggestedJoinMock, createJoinRequestMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    createJoinRequestMock.mockRejectedValueOnce(makeAxiosError(500, 'Internal Server Error'));

    const wrapper = mountComponent();
    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(wrapper.vm.suggested.feedback.visible).toBe(true);
    expect(wrapper.vm.suggested.feedback.color).toBe('error');
    expect(dismissSuggestedJoinMock).not.toHaveBeenCalled();
  });

  it('genuine error without response → error toast shown and dismissSuggestedJoin NOT called', async () => {
    const { dismissSuggestedJoinMock, createJoinRequestMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    createJoinRequestMock.mockRejectedValueOnce(new Error('Network Error'));

    const wrapper = mountComponent();
    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(wrapper.vm.suggested.feedback.visible).toBe(true);
    expect(wrapper.vm.suggested.feedback.color).toBe('error');
    expect(dismissSuggestedJoinMock).not.toHaveBeenCalled();
  });

  // ── Dismiss control ──────────────────────────────────────────────────────

  it('dismissSuggested() calls dismissSuggestedJoin', () => {
    const { dismissSuggestedJoinMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    const wrapper = mountComponent();

    wrapper.vm.dismissSuggested();

    expect(dismissSuggestedJoinMock).toHaveBeenCalledTimes(1);
  });

  // ── Loading state ────────────────────────────────────────────────────────

  it('sets loading during request and clears it after success', async () => {
    const { createJoinRequestMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    let resolveRequest;
    createJoinRequestMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const wrapper = mountComponent();
    const promise = wrapper.vm.requestAccess();
    expect(wrapper.vm.suggested.loading).toBe(true);

    resolveRequest({});
    await promise;
    await flushPromises();

    expect(wrapper.vm.suggested.loading).toBe(false);
  });

  // ── Double-submit guard ───────────────────────────────────────────────────

  it('concurrent double-click calls createJoinRequest exactly once', async () => {
    // Vuetify 4 v-btn :loading does NOT block @click — guard must be in code.
    const { createJoinRequestMock } = setupSuggestedStores({ orgId: 'org1', orgName: 'Acme Corp' });
    let resolveRequest;
    createJoinRequestMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const wrapper = mountComponent();
    // Fire two concurrent calls without awaiting the first
    const first = wrapper.vm.requestAccess();
    const second = wrapper.vm.requestAccess(); // mid-flight, loading=true → no-op
    resolveRequest({});
    await Promise.all([first, second]);
    await flushPromises();

    expect(createJoinRequestMock).toHaveBeenCalledTimes(1);
  });

  // ── No-op guard ───────────────────────────────────────────────────────────

  it('requestAccess is a no-op when suggestedJoin is null', async () => {
    const { dismissSuggestedJoinMock, createJoinRequestMock } = setupSuggestedStores(null);
    const wrapper = mountComponent();

    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(createJoinRequestMock).not.toHaveBeenCalled();
    expect(dismissSuggestedJoinMock).not.toHaveBeenCalled();
  });
});

// ── Tests — pending-invitations nudge ────────────────────────────────────────

describe('organizations.loginNotices.component — pending-invitations nudge', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows after login when the fetch returns pending invitations', async () => {
    const { wrapper, authStore, fetchMock } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
    });

    // Logged out: nothing fetched, nothing visible.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(wrapper.vm.nudgeVisible).toBe(false);

    // Login → fetch fires, nudge becomes visible with the count.
    authStore.cookieExpire = Date.now() + 100000;
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.vm.nudgeVisible).toBe(true);
  });

  it('does not show when the fetch returns no pending invitations', async () => {
    const { wrapper, fetchMock } = await mountNudge({ invitations: [], loggedIn: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.count).toBe(0);
    expect(wrapper.vm.nudgeVisible).toBe(false);
  });

  it('View action routes to /users/organizations and dismisses', async () => {
    const { wrapper } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(wrapper.vm.nudgeVisible).toBe(true);

    const view = wrapper.find('[data-test="pending-invitations-nudge-view"]');
    expect(view.exists()).toBe(true);
    expect(view.attributes('to')).toBe('/users/organizations');

    await view.trigger('click');
    expect(wrapper.vm.nudge.dismissed).toBe(true);
    expect(wrapper.vm.nudgeVisible).toBe(false);
  });

  it('snackbar v-model set(false) (timeout/close) dismisses', async () => {
    const { wrapper } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(wrapper.vm.nudgeVisible).toBe(true);
    wrapper.vm.nudgeVisible = false;
    expect(wrapper.vm.nudge.dismissed).toBe(true);
    expect(wrapper.vm.nudgeVisible).toBe(false);
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
    wrapper.vm.dismissNudge();
    authStore.cookieExpire = 0;
    await flushPromises();
    expect(wrapper.vm.nudgeVisible).toBe(false);
    expect(wrapper.vm.nudge.announced).toBe(false);
    expect(wrapper.vm.nudge.dismissed).toBe(false);

    // New login session → fetch + nudge again.
    authStore.cookieExpire = Date.now() + 100000;
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(wrapper.vm.nudgeVisible).toBe(true);
  });

  it('stays hidden until the post-login fetch has run (announced gate)', async () => {
    const orgStore = useOrganizationsStore();
    // Stale rows in the store from a previous view should not flash the nudge pre-login.
    orgStore.pendingInvitations = [{ id: 'stale', role: 'member' }];
    orgStore.fetchMyPendingInvitations = vi.fn().mockResolvedValue([]);
    const wrapper = shallowMount(OrganizationsLoginNotices, { global: { stubs } });
    await flushPromises();
    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.vm.nudgeVisible).toBe(false);
  });

  it('survives a failing fetch (best-effort, stays hidden)', async () => {
    const authStore = useAuthStore();
    const orgStore = useOrganizationsStore();
    orgStore.fetchMyPendingInvitations = vi.fn().mockRejectedValue(new Error('boom'));
    authStore.cookieExpire = Date.now() + 100000;
    const wrapper = shallowMount(OrganizationsLoginNotices, { global: { stubs } });
    await flushPromises();
    expect(orgStore.fetchMyPendingInvitations).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.nudgeVisible).toBe(false);
  });

  it('drains automatically when invitations are accepted elsewhere (shared store)', async () => {
    const { wrapper, orgStore } = await mountNudge({
      invitations: [{ id: 'inv1', role: 'member', organizationId: { name: 'Acme' } }],
      loggedIn: true,
    });
    expect(wrapper.vm.nudgeVisible).toBe(true);
    // Accepting the invitation on /users/organizations filters the shared list.
    orgStore.pendingInvitations = [];
    expect(wrapper.vm.nudgeVisible).toBe(false);
  });
});
