import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import _ from 'lodash';
import CoreDatatable from '../components/core.datatable.component.vue';

vi.mock('../../users/stores/users.store', () => ({
  useUsersStore: () => ({ getUsers: vi.fn().mockResolvedValue([]) }),
}));

vi.mock('../../users/components/user.avatar.component.vue', () => ({
  default: { name: 'UserAvatarComponent', template: '<span />' },
}));

const dayjs = () => ({ format: () => '' });
const mockConfig = { vuetify: { theme: { flat: false } } };

const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  config: {
    globalProperties: { lodash: _, dayjs, config: mockConfig },
  },
});

describe('core.datatable.component', () => {
  let vuetify;

  beforeEach(() => {
    setActivePinia(createPinia());
    vuetify = createVuetify({ components, directives });
  });

  // Regression: template used `lodash.get` but plugin only registers `_` on
  // globalProperties — causing TypeError when items first loaded.
  it('renders item values via _.get without throwing (regression: lodash.get → _.get)', () => {
    const headers = [{ text: 'First Name', value: 'firstName' }];
    const items = [{ _id: '1', firstName: 'John' }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, request: 'getUsers' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('John');
  });

  it('renders capitalize kind header', () => {
    const headers = [{ text: 'Role', value: 'role', kind: 'capitalize' }];
    const items = [{ _id: '1', role: 'admin' }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, request: 'getUsers' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('admin');
  });

  it('renders tags kind header with multiple chips', () => {
    const headers = [{ text: 'Roles', value: 'roles', kind: 'tags' }];
    const items = [{ _id: '1', roles: ['admin', 'user'] }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, request: 'getUsers' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('admin');
    expect(wrapper.text()).toContain('user');
  });

  it('shows empty state when items is empty', () => {
    const wrapper = mount(CoreDatatable, {
      props: { headers: [{ text: 'Name', value: 'name' }], items: [], request: 'getUsers' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('No Items found');
  });
});
