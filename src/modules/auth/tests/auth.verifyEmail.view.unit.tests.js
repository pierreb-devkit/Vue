import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';

const verifyEmailMock = vi.hoisted(() => vi.fn());
const tokenMock = vi.hoisted(() => vi.fn().mockResolvedValue());
const fetchServerConfigMock = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const storeMock = vi.hoisted(() => ({
  verifyEmail: verifyEmailMock,
  token: tokenMock,
  fetchServerConfig: fetchServerConfigMock,
  isLoggedIn: false,
  user: null,
  serverConfig: null,
}));
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => storeMock,
}));

import AuthVerifyEmailView from '../views/verifyEmail.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  sign: { route: '/tasks', in: true, up: true },
  vuetify: { theme: { flat: true, maxWidth: '1200px' } },
  cookie: { prefix: 'devkit' },
};

/**
 * Mount the verify-email view with Vuetify and mocked route params.
 * @param {string} token - Verification token injected via route params.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (token = 'verify-token-abc') =>
  mount(AuthVerifyEmailView, {
    global: {
      plugins: [createVuetify()],
      mocks: {
        config: mockConfig,
        $route: { params: { token }, query: {} },
        $router: { push: vi.fn() },
      },
      stubs: { RouterLink: true },
    },
  });

describe('auth.verifyEmail.view', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    verifyEmailMock.mockReset();
    tokenMock.mockReset().mockResolvedValue();
    fetchServerConfigMock.mockReset().mockResolvedValue(null);
    storeMock.isLoggedIn = false;
    storeMock.user = null;
    storeMock.serverConfig = null;
    localStorage.clear();
  });

  it('calls verifyEmail with the token from route params on creation', async () => {
    verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });
    const wrapper = mountView('my-verify-token');

    // Wait for the async created hook
    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
    expect(verifyEmailMock).toHaveBeenCalledWith('my-verify-token');
  });

  it('sets success state when verification succeeds', async () => {
    verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });
    const wrapper = mountView();

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.success).toBe(true);
    expect(wrapper.vm.error).toBe(false);
    expect(wrapper.vm.loading).toBe(false);
  });

  it('sets error state when verification fails', async () => {
    const err = new Error('Invalid token');
    err.response = { data: { message: 'Token expired' } };
    verifyEmailMock.mockRejectedValueOnce(err);

    const wrapper = mountView();

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.error).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('Token expired');
    expect(wrapper.vm.success).toBe(false);
    expect(wrapper.vm.loading).toBe(false);
  });

  it('shows a fallback error message when response has no message', async () => {
    verifyEmailMock.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = mountView();

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.error).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('Verification failed. The token may be invalid or expired.');
  });

  it('sets error when no token is provided', async () => {
    const wrapper = mount(AuthVerifyEmailView, {
      global: {
        plugins: [createVuetify()],
        mocks: {
          config: mockConfig,
          $route: { params: {}, query: {} },
          $router: { push: vi.fn() },
        },
        stubs: { RouterLink: true },
      },
    });

    await wrapper.vm.$nextTick();
    await vi.dynamicImportSettled();

    expect(wrapper.vm.error).toBe(true);
    expect(wrapper.vm.errorMessage).toBe('No verification token provided.');
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  describe('post-verification redirect', () => {
    it('redirects to /organization-required when logged in with no org and orgs enabled', async () => {
      storeMock.isLoggedIn = true;
      storeMock.user = { emailVerified: true };
      storeMock.serverConfig = { organizations: { enabled: true } };
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.success).toBe(true);
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/organization-required');
    });

    it('redirects to home route when logged in with an org', async () => {
      storeMock.isLoggedIn = true;
      storeMock.user = { emailVerified: true, currentOrganization: { _id: '123' } };
      storeMock.serverConfig = { organizations: { enabled: true } };
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks');
    });

    it('does not redirect when not logged in', async () => {
      storeMock.isLoggedIn = false;
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.success).toBe(true);
      expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
    });

    // #4447 — the refreshAbilities() -> token() swap (#4431) dropped the
    // "stay on page if the refresh fails" bail-out, since token() never
    // throws. A failed soft-refresh leaves the store without a populated
    // user; the view must stay on the verified-success page instead of
    // showing "Redirecting..." and navigating on stale state.
    it('stays on page when the post-verification soft-refresh fails to populate a user', async () => {
      storeMock.isLoggedIn = true;
      storeMock.user = null; // token() swallowed a failure, left no user
      storeMock.serverConfig = { organizations: { enabled: true } };
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(tokenMock).toHaveBeenCalledTimes(1);
      expect(wrapper.vm.success).toBe(true);
      expect(wrapper.vm.redirecting).toBe(false);
      expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('Your email has been verified successfully. You can now sign in.');
    });

    // The verification link opens in a NEW TAB, so the original `?redirect=` query
    // (present on signup.view.vue when the user clicked a paid pricing plan) is
    // gone here — only the localStorage record persisted by signup.view.vue
    // survives (#4675, postAuthRedirect.js).
    it('honors the persisted redirect when logged in with an org', async () => {
      localStorage.setItem('devkitPostAuthRedirect', JSON.stringify({ path: '/pricing', ts: Date.now() }));
      storeMock.isLoggedIn = true;
      storeMock.user = { emailVerified: true, currentOrganization: { _id: '123' } };
      storeMock.serverConfig = { organizations: { enabled: true } };
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/pricing');
      // Single-use — consumed, not left behind for a later, unrelated auth event.
      expect(localStorage.getItem('devkitPostAuthRedirect')).toBeNull();
    });

    it('ignores an expired persisted redirect and falls back to config.sign.route', async () => {
      localStorage.setItem('devkitPostAuthRedirect', JSON.stringify({ path: '/pricing', ts: Date.now() - (25 * 60 * 60 * 1000) }));
      storeMock.isLoggedIn = true;
      storeMock.user = { emailVerified: true, currentOrganization: { _id: '123' } };
      storeMock.serverConfig = { organizations: { enabled: true } };
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks');
    });

    it('never honors a persisted redirect on the organization-required branch (org views unchanged)', async () => {
      localStorage.setItem('devkitPostAuthRedirect', JSON.stringify({ path: '/pricing', ts: Date.now() }));
      storeMock.isLoggedIn = true;
      storeMock.user = { emailVerified: true };
      storeMock.serverConfig = { organizations: { enabled: true } };
      verifyEmailMock.mockResolvedValueOnce({ message: 'Email verified' });

      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/organization-required');
    });
  });

  describe('signinLinkTo ("Back to Sign In" carries the redirect forward)', () => {
    // Common case: guest signup with ?redirect=/pricing, verification link opens in
    // a new tab where the browser isn't authenticated yet — handlePostVerificationRedirect
    // stays put (`isLoggedIn` false) and the guest must click "Back to Sign In" to
    // actually authenticate. Without forwarding the persisted redirect on this OWN
    // internal link, that intent would be silently dropped by signin.view.vue's
    // created() clearing an unqueried record (#4675).
    it('forwards a still-valid persisted redirect as ?redirect= on the /signin link', async () => {
      localStorage.setItem('devkitPostAuthRedirect', JSON.stringify({ path: '/pricing', ts: Date.now() }));
      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.signinLinkTo).toEqual({ path: '/signin', query: { redirect: '/pricing' } });
      // Peeking must not consume it — still there for signin.view.vue's created() to re-save.
      expect(localStorage.getItem('devkitPostAuthRedirect')).not.toBeNull();
    });

    it('carries no redirect query when no record is persisted', async () => {
      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.signinLinkTo).toEqual({ path: '/signin', query: {} });
    });

    it('carries no redirect query when the persisted record is expired', async () => {
      localStorage.setItem('devkitPostAuthRedirect', JSON.stringify({ path: '/pricing', ts: Date.now() - (25 * 60 * 60 * 1000) }));
      const wrapper = mountView();
      await wrapper.vm.$nextTick();
      await vi.dynamicImportSettled();

      expect(wrapper.vm.signinLinkTo).toEqual({ path: '/signin', query: {} });
    });
  });
});
