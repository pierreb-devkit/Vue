import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const tokenMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const createOrganizationMock = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'org-9' }));
const authStoreMock = vi.hoisted(() => ({ user: null, token: tokenMock }));

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
    tokenMock.mockReset().mockResolvedValue();
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
    tokenMock.mockReset().mockResolvedValue();
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
