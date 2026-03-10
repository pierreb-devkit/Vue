import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const createOrganizationMock = vi.hoisted(() => vi.fn());
vi.mock('../../organizations/stores/organizations.store', () => ({
  useOrganizationsStore: () => ({ createOrganization: createOrganizationMock }),
}));

import AuthOrganizationSetupComponent from '../components/auth.organizationSetup.component.vue';

const mockConfig = {
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

/**
 * Build a VForm component whose validate() resolves with the given validity.
 * @param {boolean} valid - Whether the form should pass validation.
 * @returns {object} Vue component definition
 */
const makeFormStub = (valid = true) => ({
  template: '<div><slot /></div>',
  methods: {
    validate: vi.fn().mockResolvedValue({ valid }),
    reset: vi.fn(),
  },
});

/**
 * Mount the organization setup component with Vuetify and stubbed form.
 * @param {object} formStub - VForm component definition controlling validation outcome.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountComponent = (formStub = makeFormStub()) =>
  mount(AuthOrganizationSetupComponent, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig },
      stubs: { VForm: formStub },
    },
  });

describe('auth.organizationSetup.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    createOrganizationMock.mockReset();
  });

  it('renders the organization name field and heading', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Create Your Organization');
    expect(wrapper.text()).toContain('Organization Name');
  });

  it('calls createOrganization with the entered name on submit', async () => {
    const mockOrg = { name: 'Test Org', _id: '123' };
    createOrganizationMock.mockResolvedValueOnce(mockOrg);

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Test Org';
    await wrapper.vm.submit();

    expect(createOrganizationMock).toHaveBeenCalledTimes(1);
    expect(createOrganizationMock).toHaveBeenCalledWith({ name: 'Test Org' });
  });

  it('emits created event with the organization on success', async () => {
    const mockOrg = { name: 'Test Org', _id: '123' };
    createOrganizationMock.mockResolvedValueOnce(mockOrg);

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Test Org';
    await wrapper.vm.submit();

    expect(wrapper.emitted('created')).toBeTruthy();
    expect(wrapper.emitted('created')[0]).toEqual([mockOrg]);
  });

  it('does not emit created when createOrganization returns falsy', async () => {
    createOrganizationMock.mockResolvedValueOnce(undefined);

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Test Org';
    await wrapper.vm.submit();

    expect(wrapper.emitted('created')).toBeFalsy();
  });

  it('does not call createOrganization when form is invalid', async () => {
    const wrapper = mountComponent(makeFormStub(false));
    await flushPromises();

    wrapper.vm.organizationName = '';
    await wrapper.vm.submit();

    expect(createOrganizationMock).not.toHaveBeenCalled();
  });

  it('sets loading state during submission', async () => {
    let resolveCreate;
    createOrganizationMock.mockReturnValueOnce(new Promise((resolve) => { resolveCreate = resolve; }));

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Test Org';
    const submitPromise = wrapper.vm.submit();

    // Wait for the form.validate() microtask to resolve before checking loading
    await flushPromises();
    expect(wrapper.vm.loading).toBe(true);

    resolveCreate({ name: 'Test Org', _id: '123' });
    await submitPromise;

    expect(wrapper.vm.loading).toBe(false);
  });
});
