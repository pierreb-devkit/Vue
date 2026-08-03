import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createVuetify } from 'vuetify';
import axios from '../../../lib/services/axios';

/**
 * Race-condition regression suite for #4437.
 *
 * `auth.signup.view.unit.tests.js` mocks `useAuthStore` with a static `{ auth: false }`
 * object — the component's `auth` computed never changes, so a `watch.auth` handler would
 * never fire at all, masking the bug entirely. This suite instead runs the REAL Pinia auth
 * store so `authStore.auth` flips via genuine reactivity, reproducing the actual defect:
 * a `watch.auth` handler is a "pre"-flush job scheduled the instant `signup()` sets
 * `this.auth = true`, which lands on an EARLIER microtask than `validate()`'s own
 * `await authStore.signup()` continuation — so it could navigate away before `validate()`
 * reaches the `emailVerificationRequired` branch and sets `signupStep = 'emailVerification'`.
 *
 * Only network/analytics/ability are mocked here; the auth store, its real signup()
 * action, and the component's real Vue reactivity all run unmocked.
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
 * @desc Stub axios so signup()/fetchServerConfig() network calls are mock-controlled per test.
 * @returns {{default: {post: Function, get: Function}}} axios module shape
 */
vi.mock('../../../lib/services/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

/**
 * @desc Stub the CASL ability helper consumed by core.store.js's refreshNav() (called from signup()).
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
 * @desc Stub the analytics helpers invoked by auth.store.js's signup() action.
 * @returns {{capture: Function, identify: Function, reset: Function}} analytics module shape
 */
vi.mock('../../../lib/helpers/analytics', () => ({
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}));

/**
 * @desc Stub the organizations store. signup.view.vue only reaches it via the stubbed
 * AuthOrganizationSetupComponent, which this suite never instantiates.
 * @returns {{useOrganizationsStore: Function}} organizations store module shape
 */
vi.mock('../../organizations/stores/organizations.store', () => ({
  useOrganizationsStore: () => ({ createOrganization: vi.fn() }),
}));

import AuthSignupView from '../views/signup.view.vue';

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
 * Mount the real signup view against the real (unmocked) auth store.
 * @param {object} [routeQuery] - Optional $route.query override.
 * @returns {import('@vue/test-utils').VueWrapper} mounted wrapper
 */
const mountView = (routeQuery = {}) =>
  mount(AuthSignupView, {
    global: {
      plugins: [createVuetify()],
      mocks: { config: mockConfig, $route: { query: routeQuery }, $router: { push: vi.fn() } },
      stubs: { RouterLink: true, VForm: makeFormStub(), AuthOrganizationSetupComponent: true },
    },
  });

describe('auth.signup.view — auth-watcher race (#4437, real store)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('organizations disabled + emailVerificationRequired: shows the verification step and never navigates', async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: { sign: { in: true, up: true }, organizations: { enabled: false } } },
    });
    axios.post.mockResolvedValueOnce({
      data: { user: { email: 'race@example.com', roles: ['user'] }, tokenExpiresIn: 123, emailVerificationRequired: true },
    });

    const wrapper = mountView();
    await flushPromises();

    wrapper.vm.email = 'race@example.com';
    wrapper.vm.password = 'password123';

    await wrapper.vm.validate();
    await flushPromises();

    expect(wrapper.vm.signupStep).toBe('emailVerification');
    expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
  });

  it('serverConfig null (failed config fetch) + emailVerificationRequired: shows the verification step and never navigates', async () => {
    axios.get.mockRejectedValueOnce(new Error('config fetch failed'));
    axios.post.mockResolvedValueOnce({
      data: { user: { email: 'race2@example.com', roles: ['user'] }, tokenExpiresIn: 123, emailVerificationRequired: true },
    });

    const wrapper = mountView();
    await flushPromises();
    expect(wrapper.vm.serverConfig).toBeNull();

    wrapper.vm.email = 'race2@example.com';
    wrapper.vm.password = 'password123';

    await wrapper.vm.validate();
    await flushPromises();

    expect(wrapper.vm.signupStep).toBe('emailVerification');
    expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
  });
});
