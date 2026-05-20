import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { describe, test, expect } from 'vitest';
import PageTabs from '../components/core.pageTabs.component.vue';

// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const vuetify = createVuetify({ components, directives });

const mockConfig = { vuetify: { theme: { flat: false, rounded: '' } } };

// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const globalOpts = {
  plugins: [vuetify],
  config: {
    globalProperties: { config: mockConfig },
  },
};

describe('core.pageTabs.component', () => {
  const tabs = [
    { value: 'one', label: 'One', icon: 'fa-solid fa-cube' },
    { value: 'two', label: 'Two', icon: 'fa-solid fa-cube' },
  ];

  test('renders tab strip + window with one slot per tab', () => {
    const wrapper = mount(PageTabs, {
      props: { modelValue: 'one', tabs },
      slots: {
        one: '<div data-test="slot-one">Content One</div>',
        two: '<div data-test="slot-two">Content Two</div>',
      },
      global: globalOpts,
    });
    expect(wrapper.find('[data-test="page-tabs"]').exists()).toBe(true);
    expect(wrapper.findAll('.v-tab').length).toBe(2);
    expect(wrapper.find('[data-test="slot-one"]').exists()).toBe(true);
  });

  test('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = mount(PageTabs, {
      props: { modelValue: 'one', tabs },
      slots: { one: '<div></div>', two: '<div></div>' },
      global: globalOpts,
    });
    await wrapper.findAll('.v-tab')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['two']);
  });

  test('hides a tab when its `visible` prop is false', () => {
    const wrapper = mount(PageTabs, {
      props: { modelValue: 'one', tabs: [...tabs, { value: 'three', label: 'Three', visible: false }] },
      slots: { one: '<div></div>', two: '<div></div>', three: '<div></div>' },
      global: globalOpts,
    });
    expect(wrapper.findAll('.v-tab').length).toBe(2);
  });
});
