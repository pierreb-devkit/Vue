import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const createOrganizationMock = vi.hoisted(() => vi.fn());
vi.mock('../stores/organizations.store', () => ({
  useOrganizationsStore: () => ({
    createOrganization: createOrganizationMock,
  }),
}));

import OrganizationsSignupSetupComponent from '../components/organizations.signupSetup.component.vue';

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
 * @param {object} props - Component props (e.g. defaultName).
 * @param {object} [config] - `this.config` override (defaults to the shared mockConfig).
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountComponent = (formStub = makeFormStub(), props = {}, config = mockConfig) =>
  mount(OrganizationsSignupSetupComponent, {
    props,
    global: {
      plugins: [createVuetify()],
      mocks: { config },
      stubs: { VForm: formStub },
    },
  });

describe('organizations.signupSetup.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    createOrganizationMock.mockReset();
  });

  it('renders the organization name field and heading', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('Set up your workspace');
    expect(wrapper.text()).toContain('Organization Name');
  });

  it('shows a friendly helper line explaining why a workspace is needed', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('keeps your projects and teammates together');
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

  // --- error alert UX (T9) ---

  it('initializes error as null', () => {
    const wrapper = mountComponent();
    expect(wrapper.vm.error).toBeNull();
  });

  it('sets error from response data message on createOrganization failure', async () => {
    const apiError = { response: { data: { message: 'Name already taken' } } };
    createOrganizationMock.mockRejectedValueOnce(apiError);

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Duplicate Org';
    await wrapper.vm.submit();

    expect(wrapper.vm.error).toBe('Name already taken');
  });

  it('falls back to err.message when no response data message', async () => {
    const apiError = new Error('Network error');
    createOrganizationMock.mockRejectedValueOnce(apiError);

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Test Org';
    await wrapper.vm.submit();

    expect(wrapper.vm.error).toBe('Network error');
  });

  it('falls back to generic message when error has no message', async () => {
    createOrganizationMock.mockRejectedValueOnce({});

    const wrapper = mountComponent();
    await flushPromises();

    wrapper.vm.organizationName = 'Test Org';
    await wrapper.vm.submit();

    expect(wrapper.vm.error).toBe('Could not create organization. Please try again.');
  });

  it('clears error at the start of a new submit', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    // First submission fails
    createOrganizationMock.mockRejectedValueOnce(new Error('First error'));
    wrapper.vm.organizationName = 'Test Org';
    await wrapper.vm.submit();
    expect(wrapper.vm.error).toBe('First error');

    // Second submission succeeds — error must be cleared
    createOrganizationMock.mockResolvedValueOnce({ name: 'Test Org', _id: '456' });
    await wrapper.vm.submit();
    expect(wrapper.vm.error).toBeNull();
  });

  // --- no suggested-organization branch (the API stopped sending it) ---

  it('renders only the create form: no suggested organization prop, no join request', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(OrganizationsSignupSetupComponent.props).not.toHaveProperty('suggestedOrganization');
    expect(OrganizationsSignupSetupComponent.emits).toEqual(['created']);
    expect(wrapper.text()).not.toContain('Request to join');
  });

  // --- config-driven item noun (#4474) ---

  it('defaults the workspace helper text to "projects" when config.app.itemNoun is unset', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(wrapper.text()).toContain('keeps your projects and teammates together');
  });

  it('uses the configured item noun in the workspace helper text', async () => {
    const overrideConfig = { ...mockConfig, app: { itemNoun: 'boards' } };
    const wrapper = mountComponent(makeFormStub(), {}, overrideConfig);
    await flushPromises();

    expect(wrapper.text()).toContain('keeps your boards and teammates together');
    expect(wrapper.text()).not.toContain('keeps your projects and teammates together');
  });
});
