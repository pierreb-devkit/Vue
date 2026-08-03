import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import axios from '../../../lib/services/axios';

/**
 * Race-condition regression suite for #4533 (sibling of #4437 / PR #4528).
 *
 * `auth.signin.view.unit.tests.js` mocks `useAuthStore` with a static store object — the
 * component's `auth` computed (now removed) never changed, so a `watch.auth` handler would
 * never fire at all, masking the bug entirely. This suite instead runs the REAL Pinia auth
 * store so `authStore.auth` flips via genuine reactivity, reproducing the mechanism #4437
 * removed from signup: a `watch.auth` handler is a "pre"-flush job scheduled the instant
 * `signin()` sets `this.auth = true`, which lands on an EARLIER microtask than `validate()`'s
 * own `await authStore.signin()` continuation — decoupling navigation from the flow that
 * caused it. Unlike #4437, signin's `validate()` never navigated at all (the watcher was the
 * sole navigator), so the fix moves navigation into `validate()`'s success path explicitly.
 *
 * Only network/analytics/ability are mocked here; the auth store, its real signin() action,
 * and the component's real Vue reactivity all run unmocked.
 */
/**
 * @desc Real API endpoint config consumed directly by auth.store.js (protocol/host/port + cookie prefix).
 * @returns {{default: object}} minimal config shape needed by the real auth store
 */
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
    cookie: { prefix: 'devkit' },
  },
}));

/**
 * @desc Stub axios so signin()/fetchServerConfig() network calls are mock-controlled per test.
 * @returns {{default: {post: Function, get: Function}}} axios module shape
 */
vi.mock('../../../lib/services/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

/**
 * @desc Stub the CASL ability helper consumed by core.store.js's refreshNav() (called from signin()).
 * @returns {{ability: {can: Function}, updateAbilities: Function}} ability module shape
 */
vi.mock('../../../lib/helpers/ability', () => ({
  ability: {
    /**
     * @desc Always deny — refreshNav()'s guarded-route branch is not exercised by this suite.
     * @returns {boolean} false
     */
    can: () => false,
  },
  updateAbilities: vi.fn(),
}));

/**
 * @desc Stub the analytics helpers invoked by auth.store.js's signin() action.
 * @returns {{capture: Function, identify: Function, reset: Function}} analytics module shape
 */
vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}));

import AuthSigninView from '../views/signin.view.vue';

const mockConfig = {
  api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api', endPoints: { auth: 'auth' } },
  cookie: { prefix: 'devkit' },
  sign: { route: '/tasks', in: true, up: true },
  vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
};

/**
 * Build a VForm stub whose validate() resolves with the given validity.
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
 * Mount the real signin view against the real (unmocked) auth store.
 * @param {object} [routeQuery] - Optional $route.query override.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (routeQuery = {}) =>
  mount(AuthSigninView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $route: { query: routeQuery }, $router: { push: vi.fn() } },
      stubs: { RouterLink: true, VForm: makeFormStub() },
    },
  });

describe('auth.signin.view — auth-watcher race (#4533, real store)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    axios.get.mockReset();
    axios.post.mockReset();
    axios.get.mockResolvedValue({ data: { data: { sign: { in: true, up: true } } } });
  });

  it('successful signin with no redirect query: navigates exactly once to the default route', async () => {
    axios.post.mockResolvedValueOnce({
      data: { user: { email: 'race@example.com', roles: ['user'] }, tokenExpiresIn: 123 },
    });

    const wrapper = mountView();
    await flushPromises();

    wrapper.vm.email = 'race@example.com';
    wrapper.vm.password = 'password123';

    await wrapper.vm.validate();
    await flushPromises();

    expect(wrapper.vm.$router.push).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks');
  });

  it('successful signin with ?redirect=/somewhere: navigates exactly once to the redirect', async () => {
    axios.post.mockResolvedValueOnce({
      data: { user: { email: 'race2@example.com', roles: ['user'] }, tokenExpiresIn: 123 },
    });

    const wrapper = mountView({ redirect: '/somewhere' });
    await flushPromises();

    wrapper.vm.email = 'race2@example.com';
    wrapper.vm.password = 'password123';

    await wrapper.vm.validate();
    await flushPromises();

    expect(wrapper.vm.$router.push).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/somewhere');
  });

  it('successful signin with a non-"/"-prefixed redirect: ignores it and navigates to the default route (open-redirect guard)', async () => {
    axios.post.mockResolvedValueOnce({
      data: { user: { email: 'race3@example.com', roles: ['user'] }, tokenExpiresIn: 123 },
    });

    const wrapper = mountView({ redirect: 'https://evil.example.com' });
    await flushPromises();

    wrapper.vm.email = 'race3@example.com';
    wrapper.vm.password = 'password123';

    await wrapper.vm.validate();
    await flushPromises();

    expect(wrapper.vm.$router.push).toHaveBeenCalledTimes(1);
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/tasks');
  });

  it('failed signin (auth stays false): never navigates', async () => {
    axios.post.mockRejectedValueOnce(new Error('invalid credentials'));

    const wrapper = mountView();
    await flushPromises();

    wrapper.vm.email = 'race4@example.com';
    wrapper.vm.password = 'wrongpassword';

    await wrapper.vm.validate();
    await flushPromises();

    expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
  });
});
