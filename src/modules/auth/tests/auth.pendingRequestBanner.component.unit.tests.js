import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';

const storeMock = vi.hoisted(() => ({
  isLoggedIn: true,
  user: { currentOrganization: null },
  pendingRequests: [{ organizationId: { name: 'Acme' } }],
}));
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => storeMock,
}));

const inactiveModules = vi.hoisted(() => new Set());
vi.mock('../../../lib/helpers/modules', () => ({
  isModuleActive: (name) => !inactiveModules.has(name),
}));

import AuthPendingRequestBanner from '../components/pendingRequestBanner.component.vue';

/**
 * Mount the banner with Vuetify (snackbar teleported to body).
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountBanner = () =>
  mount(AuthPendingRequestBanner, {
    global: {
      plugins: [createVuetify()],
      stubs: { VSnackbar: { template: '<div><slot /><slot name="actions" /></div>' } },
    },
  });

describe('auth.pendingRequestBanner.component', () => {
  beforeEach(() => {
    inactiveModules.clear();
    sessionStorage.clear();
  });

  it('shows the pending organization name and the "Create your own" link while organizations is on', () => {
    const wrapper = mountBanner();
    expect(wrapper.text()).toContain('Acme');
    expect(wrapper.vm.visible).toBe(true);
    expect(wrapper.text()).toContain('Create your own');
  });

  it('hides the "Create your own" link when the organizations module is off', () => {
    inactiveModules.add('organizations');
    const wrapper = mountBanner();
    expect(wrapper.vm.canCreateOrganization).toBe(false);
    expect(wrapper.text()).not.toContain('Create your own');
  });

  it('dismisses and remembers it for the session', async () => {
    const wrapper = mountBanner();
    wrapper.vm.dismiss();
    expect(wrapper.vm.visible).toBe(false);
    expect(sessionStorage.getItem('pendingRequestBannerDismissed')).toBe('true');
  });
});
