import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// Default token() simulates a realistic successful /auth/token refresh: the
// backend already reflects the just-created/joined org, so currentOrganization
// gets populated if it wasn't already set. Individual #4459 guard tests
// override this per-case to simulate a soft-refresh that does NOT (yet)
// populate it.
const tokenMock = vi.hoisted(() => vi.fn().mockImplementation(async () => {
  if (authStoreMock.user && !authStoreMock.user.currentOrganization) {
    authStoreMock.user = { ...authStoreMock.user, currentOrganization: 'org-9' };
  }
}));
const createOrganizationMock = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'org-9' }));
const authStoreMock = vi.hoisted(() => ({ user: null, token: tokenMock }));

/**
 * Reset tokenMock to the default "realistic successful refresh" implementation
 * described above (used by beforeEach blocks across this file).
 */
const resetTokenMockToSuccess = () => {
  tokenMock.mockReset().mockImplementation(async () => {
    if (authStoreMock.user && !authStoreMock.user.currentOrganization) {
      authStoreMock.user = { ...authStoreMock.user, currentOrganization: 'org-9' };
    }
  });
};

vi.mock('../../auth/stores/auth.store', () => ({
  useAuthStore: () => authStoreMock,
}));
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({ createOrganization: createOrganizationMock }),
}));

import OrganizationCreateView from '../views/organization.create.view.vue';

const mockConfig = {
  sign: { route: '/tasks' },
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

const push = vi.fn();

/**
 * Mount the create view. VForm is stubbed so `$refs.form.validate()` resolves
 * valid without wiring the full Vuetify validation lifecycle.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = () =>
  mount(OrganizationCreateView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $router: { push } },
      stubs: {
        PageHeader: true,
        VForm: {
          template: '<form><slot /></form>',
          methods: { validate: () => Promise.resolve({ valid: true }) },
        },
      },
    },
  });

// #4422 — the standalone create view is reached both from the org-required wall
// (first org) and from management (additional org). A first-org creator should
// land in the app (sign.route) like signup; an additional org keeps -> detail.
describe('organization.create.view — first-org redirect (#4422)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    resetTokenMockToSuccess();
    createOrganizationMock.mockReset().mockResolvedValue({ id: 'org-9' });
    authStoreMock.user = null;
  });

  it('sends a first-org creator into the app via sign.route', async () => {
    authStoreMock.user = { id: 'u1' }; // no currentOrganization → first org
    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();
    expect(createOrganizationMock).toHaveBeenCalledWith({ name: 'Acme', description: '' });
    expect(tokenMock).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/tasks');
  });

  it('sends an additional-org creator to the new org detail page', async () => {
    authStoreMock.user = { id: 'u1', currentOrganization: 'org-1' }; // already has an org
    const wrapper = mountView();
    wrapper.vm.name = 'Beta';
    await wrapper.vm.create();
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/users/organizations/org-9');
  });

  it('captures first-org state BEFORE create, so the backend setting it does not flip the redirect', async () => {
    // Simulate the backend attaching currentOrganization as a side effect of the
    // first create — the redirect must still use the pre-create (first-org) state.
    authStoreMock.user = { id: 'u1' };
    createOrganizationMock.mockImplementation(async () => {
      authStoreMock.user.currentOrganization = 'org-9';
      return { id: 'org-9' };
    });
    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();
    expect(push).toHaveBeenCalledWith('/tasks');
  });
});

// #4447 — the catch block only logged to the console, leaving the user with
// no feedback on a failed create. Surface the backend message via the error
// alert, mirroring organizationSetup.component.vue (f92003d5).
describe('organization.create.view — error surfacing (#4447)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    resetTokenMockToSuccess();
    createOrganizationMock.mockReset().mockResolvedValue({ id: 'org-9' });
    authStoreMock.user = { id: 'u1' };
  });

  it('sets error from response data message on createOrganization failure and resets loading', async () => {
    const apiError = { response: { data: { message: 'An organization with this name already exists' } } };
    createOrganizationMock.mockRejectedValueOnce(apiError);

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(wrapper.vm.error).toBe('An organization with this name already exists');
    expect(wrapper.vm.loading).toBe(false);
    expect(push).not.toHaveBeenCalled();
  });

  it('renders the error alert with the message in the DOM', async () => {
    const apiError = { response: { data: { message: 'An organization with this name already exists' } } };
    createOrganizationMock.mockRejectedValueOnce(apiError);

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('An organization with this name already exists');
  });

  it('falls back to err.message when a create failure has no response data message', async () => {
    createOrganizationMock.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(wrapper.vm.error).toBe('Network error');
  });

  it('falls back to a generic message when the error has no message', async () => {
    createOrganizationMock.mockRejectedValueOnce({});

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(wrapper.vm.error).toBe('Could not create organization. Please try again.');
  });

  it('clears a stale error at the start of a new create attempt', async () => {
    const wrapper = mountView();
    wrapper.vm.error = 'Could not create organization. Please try again.';

    createOrganizationMock.mockResolvedValueOnce({ id: 'org-9' });
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(wrapper.vm.error).toBeNull();
  });

  it('leaves no error on a successful create', async () => {
    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(wrapper.vm.error).toBeNull();
    expect(push).toHaveBeenCalled();
  });
});

// #4459 — token() never throws, so a transient blip after create() must not
// navigate on the assumption the refresh succeeded: the app-router org-guard
// would bounce the just-created org straight back to /organization-required.
// Mirrors organizations.required.view.vue's refresh()/acceptInvitation()
// currentOrganization check.
describe('organization.create.view — soft-refresh guard (#4459)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    createOrganizationMock.mockReset().mockResolvedValue({ id: 'org-9' });
    authStoreMock.user = { id: 'u1' }; // no currentOrganization → first org
  });

  it('stays on the page (no router push) when token() resolves without populating currentOrganization', async () => {
    // token() swallows failures internally — simulate that here: it resolves,
    // but the store's user still has no currentOrganization.
    tokenMock.mockReset().mockResolvedValue();

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(push).not.toHaveBeenCalled();
    expect(wrapper.vm.error).toBeTruthy();
    expect(wrapper.vm.pendingOrg).toEqual({ org: { id: 'org-9' }, isFirstOrg: true });
    expect(wrapper.vm.loading).toBe(false);
  });

  it('still navigates when the soft refresh populates currentOrganization', async () => {
    tokenMock.mockReset().mockImplementation(async () => {
      authStoreMock.user = { ...authStoreMock.user, currentOrganization: 'org-9' };
    });

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(push).toHaveBeenCalledWith('/tasks');
    expect(wrapper.vm.error).toBeNull();
    expect(wrapper.vm.pendingOrg).toBeNull();
  });

  it('retryRefresh re-attempts the soft refresh and navigates without recreating the organization', async () => {
    // First attempt: token() resolves but does not populate currentOrganization.
    tokenMock.mockReset().mockResolvedValueOnce();

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(push).not.toHaveBeenCalled();
    expect(createOrganizationMock).toHaveBeenCalledTimes(1);

    // Retry: this time the refresh succeeds.
    tokenMock.mockImplementation(async () => {
      authStoreMock.user = { ...authStoreMock.user, currentOrganization: 'org-9' };
    });
    await wrapper.vm.retryRefresh();
    await flushPromises();

    expect(createOrganizationMock).toHaveBeenCalledTimes(1); // organization not recreated
    expect(push).toHaveBeenCalledWith('/tasks');
    expect(wrapper.vm.error).toBeNull();
    expect(wrapper.vm.pendingOrg).toBeNull();
  });

  it('retryRefresh is a no-op with no pendingOrg', async () => {
    tokenMock.mockReset().mockResolvedValue();
    const wrapper = mountView();

    await wrapper.vm.retryRefresh();
    await flushPromises();

    expect(tokenMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  // Regression: the alert's `closable`/@click:close only ever cleared `error`,
  // never `pendingOrg`. Dismissing the banner instead of clicking its inline
  // Retry left the still-enabled primary "Create Organization" button wired to
  // create() — clicking it called createOrganization() a SECOND time with the
  // same data, duplicating the org server-side (the exact outcome the guard
  // was meant to prevent). The primary button must route to retryRefresh()
  // whenever pendingOrg is set, independent of whether the alert was dismissed.
  it('does not recreate the organization when the primary button is clicked after the alert is dismissed while pendingOrg is set', async () => {
    tokenMock.mockReset().mockResolvedValue(); // stalls: never populates currentOrganization

    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();

    expect(createOrganizationMock).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.pendingOrg).toEqual({ org: { id: 'org-9' }, isFirstOrg: true });

    // Dismiss the banner exactly as @click:close does: clear `error` only.
    wrapper.vm.error = null;
    await wrapper.vm.$nextTick();

    // The alert (and its inline Retry button) is now gone, but pendingOrg
    // persists — the primary button must have flipped to "Retry" already.
    const primaryButton = wrapper.find('[data-test="organization-create-primary-action"]');
    expect(primaryButton.text()).toBe('Retry');

    await primaryButton.trigger('click');
    await flushPromises();

    // Only the refresh retried — createOrganization was NOT called again.
    expect(createOrganizationMock).toHaveBeenCalledTimes(1);
    expect(tokenMock).toHaveBeenCalledTimes(2); // initial create() attempt + the retry
  });

  it('handlePrimaryAction routes to retryRefresh (not create) whenever pendingOrg is set', async () => {
    tokenMock.mockReset().mockResolvedValue();
    const wrapper = mountView();
    wrapper.vm.pendingOrg = { org: { id: 'org-9' }, isFirstOrg: true };

    await wrapper.vm.handlePrimaryAction();
    await flushPromises();

    expect(createOrganizationMock).not.toHaveBeenCalled();
    expect(tokenMock).toHaveBeenCalledTimes(1);
  });

  it('handlePrimaryAction falls through to create() when there is no pendingOrg', async () => {
    tokenMock.mockReset().mockImplementation(async () => {
      authStoreMock.user = { ...authStoreMock.user, currentOrganization: 'org-9' };
    });
    const wrapper = mountView();
    wrapper.vm.name = 'Acme';

    await wrapper.vm.handlePrimaryAction();
    await flushPromises();

    expect(createOrganizationMock).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/tasks');
  });

  it('renders the primary button as "Retry" (disabled/loading bound to retrying) while pendingOrg is set', async () => {
    tokenMock.mockReset().mockResolvedValue();
    const wrapper = mountView();
    wrapper.vm.name = 'Acme';
    await wrapper.vm.create();
    await flushPromises();
    await wrapper.vm.$nextTick();

    const primaryButton = wrapper.find('[data-test="organization-create-primary-action"]');
    expect(primaryButton.exists()).toBe(true);
    expect(primaryButton.text()).toBe('Retry');
    expect(primaryButton.attributes('disabled')).toBeFalsy();
  });
});
