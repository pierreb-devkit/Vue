import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

// v-snackbar uses visualViewport which is not available in jsdom
if (typeof globalThis.visualViewport === 'undefined') {
  globalThis.visualViewport = { addEventListener: vi.fn(), removeEventListener: vi.fn(), width: 1024, height: 768 };
}

const storeMock = vi.hoisted(() => ({
  isLoggedIn: false,
  user: null,
  serverConfig: null,
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => storeMock,
}));

import AuthAdminMailerWarning from '../components/adminMailerWarning.component.vue';

/**
 * Mount the admin mailer warning component with Vuetify installed.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountComponent = () =>
  mount(AuthAdminMailerWarning, {
    global: {
      plugins: [createVuetify()],
    },
  });

describe('auth.adminMailerWarning.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    storeMock.isLoggedIn = false;
    storeMock.user = null;
    storeMock.serverConfig = null;
    sessionStorage.removeItem('adminMailerWarningDismissed');
  });

  it('does not show when user is not logged in', () => {
    storeMock.isLoggedIn = false;
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(false);
  });

  it('does not show when user is not admin', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { roles: ['user'] };
    storeMock.serverConfig = { mail: { configured: false } };
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(false);
  });

  it('does not show when mail is configured', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { roles: ['admin'] };
    storeMock.serverConfig = { mail: { configured: true } };
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(false);
  });

  it('shows when admin is logged in and mail is not configured', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { roles: ['admin'] };
    storeMock.serverConfig = { mail: { configured: false } };
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(true);
    expect(wrapper.vm.visible).toBe(true);
  });

  it('shows when admin is logged in and serverConfig is null', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { roles: ['admin'] };
    storeMock.serverConfig = null;
    const wrapper = mountComponent();

    expect(wrapper.vm.shouldShow).toBe(true);
    expect(wrapper.vm.visible).toBe(true);
  });

  it('hides when dismissed and persists in sessionStorage', () => {
    storeMock.isLoggedIn = true;
    storeMock.user = { roles: ['admin'] };
    storeMock.serverConfig = { mail: { configured: false } };
    const wrapper = mountComponent();

    expect(wrapper.vm.visible).toBe(true);

    wrapper.vm.dismiss();

    expect(wrapper.vm.visible).toBe(false);
    expect(sessionStorage.getItem('adminMailerWarningDismissed')).toBe('true');
  });
});
