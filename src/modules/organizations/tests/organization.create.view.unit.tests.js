import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const refreshAbilitiesMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const createOrganizationMock = vi.hoisted(() => vi.fn().mockResolvedValue({ id: 'org-9' }));
const authStoreMock = vi.hoisted(() => ({ user: null, refreshAbilities: refreshAbilitiesMock }));

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
    refreshAbilitiesMock.mockReset().mockResolvedValue();
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
    expect(refreshAbilitiesMock).toHaveBeenCalled();
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
