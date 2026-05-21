import { describe, it, expect, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { useAdminStore } from '../stores/admin.store';
import AdminUserView from '../views/admin.user.view.vue';

// Mock axios
vi.mock('../../../lib/services/axios', () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

// Mock config helper
vi.mock('../../../lib/services/config', () => ({
  default: {
    api: { protocol: 'http', host: 'localhost', port: '3000', base: 'api' },
    cookie: { prefix: 'devkit' },
    vuetify: { theme: { flat: true, rounded: 'rounded-lg' } },
  },
}));

const vuetifyStubs = {
  'v-container': { template: '<div><slot /></div>' },
  'v-row': { template: '<div><slot /></div>' },
  'v-col': { template: '<div><slot /></div>' },
  'v-card': { template: '<div><slot /></div>' },
  'v-btn': { template: '<button><slot /></button>' },
  'v-icon': { template: '<i />' },
  PageHeader: true,
  accountUserProfileComponent: true,
  coreConfirmDialog: true,
};

const mountView = (routeId = 'u1', initialUser = null) => {
  setActivePinia(createPinia());
  const store = useAdminStore();
  // pre-seed the store user when the test wants the breadcrumb to fire on mount
  if (initialUser) store.user = initialUser;
  store.resetUser = vi.fn();
  store.getUser = vi.fn().mockResolvedValue();
  store.updateUser = vi.fn().mockResolvedValue();
  store.deleteUser = vi.fn().mockResolvedValue();
  return shallowMount(AdminUserView, {
    global: {
      mocks: {
        $route: { params: { id: routeId } },
        $router: { push: vi.fn() },
        config: { vuetify: { theme: { flat: true, rounded: 'rounded-lg' } } },
      },
      stubs: vuetifyStubs,
    },
  });
};

describe('admin.user.view — template chrome', () => {
  it('does NOT render its own <v-container> (admin layout owns chrome)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.user.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).not.toMatch(/<v-container/);
  });

  it('does NOT render its own <PageHeader> (admin layout supplies breadcrumb)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.user.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).not.toMatch(/<PageHeader/);
  });

  it('uses coreConfirmDialog (no inline <v-dialog>)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../views/admin.user.view.vue'), 'utf8');
    const tmpl = sfc.split('<script>')[0];
    expect(tmpl).toMatch(/<coreConfirmDialog/);
    expect(tmpl).not.toMatch(/<v-dialog/);
  });
});

describe('admin.user.view — breadcrumb publishing', () => {
  let wrapper;
  afterEach(() => { if (wrapper) wrapper.unmount(); });

  it('publishes the breadcrumb to the admin store when user data arrives', async () => {
    wrapper = mountView('u1', { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' });
    await flushPromises();
    const store = useAdminStore();
    expect(store.currentBreadcrumb).toBeTruthy();
    expect(store.currentBreadcrumb.title).toMatch(/Jane\s+Doe/);
    expect(store.currentBreadcrumb.titleClass).toBe('text-capitalize');
  });

  it('falls back to email when first/last name are missing', async () => {
    wrapper = mountView('u1', { email: 'noname@example.com' });
    await flushPromises();
    const store = useAdminStore();
    expect(store.currentBreadcrumb.title).toBe('noname@example.com');
  });

  it('clears the breadcrumb on unmount', async () => {
    wrapper = mountView('u1', { firstName: 'Jane', lastName: 'Doe' });
    await flushPromises();
    const store = useAdminStore();
    expect(store.currentBreadcrumb).toBeTruthy();
    wrapper.unmount();
    wrapper = null;
    expect(store.currentBreadcrumb).toBeNull();
  });
});

describe('admin.user.view — delete flow', () => {
  let wrapper;
  afterEach(() => { if (wrapper) wrapper.unmount(); });

  it('calls deleteUser and navigates to /admin/users on remove()', async () => {
    wrapper = mountView('u1', { firstName: 'Jane' });
    await flushPromises();
    await wrapper.vm.remove();
    const store = useAdminStore();
    expect(store.deleteUser).toHaveBeenCalledWith({ id: 'u1' });
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/admin/users');
  });
});
