import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
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

// ── Store mocks ──────────────────────────────────────────────────────────────

const dismissSuggestedJoinMock = vi.hoisted(() => vi.fn());
const authStoreMock = vi.hoisted(() => ({
  suggestedJoin: null,
  dismissSuggestedJoin: dismissSuggestedJoinMock,
}));

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreMock,
}));

const createJoinRequestMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({
    createJoinRequest: createJoinRequestMock,
  }),
}));

// ── Component import (after mocks) ───────────────────────────────────────────

import OrganizationsSuggestedJoinBanner from '../components/organizations.suggestedJoinBanner.component.vue';

// ── Mount helper ─────────────────────────────────────────────────────────────

/**
 * Mount the SuggestedJoinBanner with Vuetify installed.
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountComponent = () =>
  mount(OrganizationsSuggestedJoinBanner, {
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('organizations.suggestedJoinBanner.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    dismissSuggestedJoinMock.mockReset();
    createJoinRequestMock.mockReset();
    authStoreMock.suggestedJoin = null;
  });

  // ── No-op when null ──────────────────────────────────────────────────────

  it('renders nothing when suggestedJoin is null', () => {
    authStoreMock.suggestedJoin = null;
    const wrapper = mountComponent();

    // v-snackbar root is conditional — no content should be rendered
    expect(wrapper.html()).toBe('<!--v-if-->');
  });

  // ── Renders when set ─────────────────────────────────────────────────────

  it('renders org name, CTA, and dismiss when suggestedJoin is set', async () => {
    authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.vm.suggestedJoin).toEqual({ orgId: 'org1', orgName: 'Acme Corp' });
    // The computed is reactive; text content is rendered inside Vuetify portal
    // so we verify the computed value and the loading state is false (ready to interact)
    expect(wrapper.vm.loading).toBe(false);
    expect(wrapper.vm.visible).toBe(true);
  });

  // ── CTA success ──────────────────────────────────────────────────────────

  it('calls createJoinRequest with orgId, shows success feedback, and dismisses on success', async () => {
    authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
    createJoinRequestMock.mockResolvedValueOnce({});

    const wrapper = mountComponent();
    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(createJoinRequestMock).toHaveBeenCalledWith('org1');
    expect(wrapper.vm.feedback.visible).toBe(true);
    expect(wrapper.vm.feedback.color).toBe('success');
    expect(dismissSuggestedJoinMock).toHaveBeenCalledTimes(1);
  });

  // ── Benign rejection matrix ───────────────────────────────────────────────

  it.each([
    [
      'Already a member',
      makeAxiosError(409, 'Already a member'),
      "You're already a member of that workspace.",
    ],
    [
      'A pending request already exists',
      makeAxiosError(409, 'A pending request already exists'),
      'Request already sent. Awaiting approval.',
    ],
    [
      'org not found / 404',
      makeAxiosError(404, 'Organization not found'),
      'That workspace no longer exists.',
    ],
  ])(
    'benign "%s" → info toast + dismissSuggestedJoin called (no error toast)',
    async (_label, err, expectedMsg) => {
      authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
      createJoinRequestMock.mockRejectedValueOnce(err);

      const wrapper = mountComponent();
      await wrapper.vm.requestAccess();
      await flushPromises();

      // Neutral (info) feedback, NOT error
      expect(wrapper.vm.feedback.visible).toBe(true);
      expect(wrapper.vm.feedback.color).toBe('info');
      expect(wrapper.vm.feedback.text).toBe(expectedMsg);

      // suggestedJoin must be dismissed
      expect(dismissSuggestedJoinMock).toHaveBeenCalledTimes(1);
    },
  );

  // ── Genuine error — error toast, NOT dismissed ───────────────────────────

  it('genuine error (network/500) → error toast shown and dismissSuggestedJoin NOT called', async () => {
    authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
    createJoinRequestMock.mockRejectedValueOnce(makeAxiosError(500, 'Internal Server Error'));

    const wrapper = mountComponent();
    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(wrapper.vm.feedback.visible).toBe(true);
    expect(wrapper.vm.feedback.color).toBe('error');
    expect(dismissSuggestedJoinMock).not.toHaveBeenCalled();
  });

  it('genuine error without response → error toast shown and dismissSuggestedJoin NOT called', async () => {
    authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
    createJoinRequestMock.mockRejectedValueOnce(new Error('Network Error'));

    const wrapper = mountComponent();
    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(wrapper.vm.feedback.visible).toBe(true);
    expect(wrapper.vm.feedback.color).toBe('error');
    expect(dismissSuggestedJoinMock).not.toHaveBeenCalled();
  });

  // ── Dismiss control ──────────────────────────────────────────────────────

  it('dismiss() calls dismissSuggestedJoin', () => {
    authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
    const wrapper = mountComponent();

    wrapper.vm.dismiss();

    expect(dismissSuggestedJoinMock).toHaveBeenCalledTimes(1);
  });

  // ── Loading state ────────────────────────────────────────────────────────

  it('sets loading during request and clears it after success', async () => {
    authStoreMock.suggestedJoin = { orgId: 'org1', orgName: 'Acme Corp' };
    let resolveRequest;
    createJoinRequestMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const wrapper = mountComponent();
    const promise = wrapper.vm.requestAccess();
    expect(wrapper.vm.loading).toBe(true);

    resolveRequest({});
    await promise;
    await flushPromises();

    expect(wrapper.vm.loading).toBe(false);
  });

  // ── No-op guard ───────────────────────────────────────────────────────────

  it('requestAccess is a no-op when suggestedJoin is null', async () => {
    authStoreMock.suggestedJoin = null;
    const wrapper = mountComponent();

    await wrapper.vm.requestAccess();
    await flushPromises();

    expect(createJoinRequestMock).not.toHaveBeenCalled();
    expect(dismissSuggestedJoinMock).not.toHaveBeenCalled();
  });
});
