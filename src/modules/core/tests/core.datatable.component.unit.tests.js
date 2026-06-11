import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import _ from 'lodash-es';
import CoreDatatable from '../components/core.datatable.component.vue';

vi.mock('../components/user.avatar.component.vue', () => ({
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
    vi.useFakeTimers();
    setActivePinia(createPinia());
    vuetify = createVuetify({ components, directives });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Regression: plugin registered lodash as `_` on globalProperties but `_` is
  // reserved by Vue 3's template compiler — `_ctx._` resolves to the internal
  // context, not lodash. Fix: register as `lodash` so `lodash.get(...)` works.
  it('renders item values via lodash.get without throwing (regression: globalProperties._ → globalProperties.lodash)', () => {
    const headers = [{ text: 'First Name', value: 'firstName' }];
    const items = [{ _id: '1', firstName: 'John' }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, fetchAction: vi.fn().mockResolvedValue() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('John');
  });

  it('renders capitalize kind header', () => {
    const headers = [{ text: 'Role', value: 'role', kind: 'capitalize' }];
    const items = [{ _id: '1', role: 'admin' }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, fetchAction: vi.fn().mockResolvedValue() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('admin');
  });

  it('renders tags kind header with multiple chips', () => {
    const headers = [{ text: 'Roles', value: 'roles', kind: 'tags' }];
    const items = [{ _id: '1', roles: ['admin', 'user'] }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, fetchAction: vi.fn().mockResolvedValue() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('admin');
    expect(wrapper.text()).toContain('user');
  });

  it('shows empty state when items is empty', () => {
    const wrapper = mount(CoreDatatable, {
      props: { headers: [{ text: 'Name', value: 'name' }], items: [], fetchAction: vi.fn().mockResolvedValue() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.text()).toContain('No items found');
  });

  it('calls fetchAction on mount with pagination params', async () => {
    const fetchAction = vi.fn().mockResolvedValue();
    mount(CoreDatatable, {
      props: { headers: [{ text: 'Name', value: 'name' }], items: [], fetchAction },
      global: globalOpts(vuetify),
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchAction).toHaveBeenCalled();
  });

  it('does not throw when fetchAction is not provided', () => {
    expect(() => {
      mount(CoreDatatable, {
        props: { headers: [{ text: 'Name', value: 'name' }], items: [] },
        global: globalOpts(vuetify),
      });
    }).not.toThrow();
  });

  // Card-level #toolbar slot — renders inside the v-card-title, left of the search
  // field. Named `toolbar` (not `actions`) to avoid colliding with the dynamic
  // per-row slots resolved via `header.slotName || header.value`.
  it('renders the #toolbar slot content in the card title', () => {
    const wrapper = mount(CoreDatatable, {
      props: { headers: [{ text: 'Name', value: 'name' }], items: [], fetchAction: vi.fn().mockResolvedValue() },
      slots: { toolbar: '<button data-test="toolbar-action">Add</button>' },
      global: globalOpts(vuetify),
    });
    const action = wrapper.find('[data-test="toolbar-action"]');
    expect(action.exists()).toBe(true);
    expect(action.element.closest('.v-card-title')).not.toBeNull();
  });

  it('does not collide with a per-row #actions slot (toolbar stays out of the rows)', () => {
    const headers = [
      { text: 'Name', value: 'name' },
      { text: 'Actions', value: 'actions', kind: 'slot', slotName: 'actions' },
    ];
    const items = [{ _id: '1', name: 'John' }];
    const wrapper = mount(CoreDatatable, {
      props: { headers, items, fetchAction: vi.fn().mockResolvedValue() },
      slots: {
        toolbar: '<button data-test="toolbar-action">Add</button>',
        actions: '<span data-test="row-action">edit</span>',
      },
      global: globalOpts(vuetify),
    });
    // Row slot renders in the table body, toolbar slot in the card title — both present, independent.
    expect(wrapper.find('[data-test="row-action"]').element.closest('tbody')).not.toBeNull();
    expect(wrapper.find('[data-test="toolbar-action"]').element.closest('.v-card-title')).not.toBeNull();
  });
});
