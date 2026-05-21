import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import CorePageHeaderTabs from '../core.pageHeaderTabs.component.vue';

/**
 * Vuetify instance with all components registered for component mount.
 * @returns {import('vuetify').Vuetify}
 */
// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const makeVuetify = () => createVuetify({ components, directives });

const VTabStub = {
  template: '<a class="v-tab-stub" :href="to"><slot /></a>',
  props: ['to'],
};

/**
 * Mount the component with sensible defaults; callers override via opts.
 * @param {object} [opts]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const mountIt = (opts = {}) =>
  mount(CorePageHeaderTabs, {
    props: {
      title: 'Account',
      icon: 'fa-solid fa-user',
      tabs: [{ value: 'profile', label: 'Profile', route: 'profile' }],
      can: () => true,
      basePath: '/users',
      ...(opts.props || {}),
    },
    slots: opts.slots,
    global: {
      plugins: [makeVuetify()],
      stubs: { VTab: VTabStub },
    },
  });

describe('CorePageHeaderTabs — composition', () => {
  it('renders an inner PageHeader with the title prop forwarded', () => {
    const wrapper = mountIt({ props: { title: 'Account' } });
    expect(wrapper.find('h2.core-page-header__title').text()).toContain('Account');
  });

  it('renders an inner CoreSurfaceTabBar when tabs are provided', () => {
    const wrapper = mountIt();
    expect(wrapper.text()).toContain('Profile');
  });

  it('hides the tab bar when hideTabs is true (breadcrumb mode)', () => {
    const wrapper = mountIt({ props: { hideTabs: true } });
    expect(wrapper.text()).not.toContain('Profile');
  });

  it('hides the tab bar when the tabs array is empty', () => {
    const wrapper = mountIt({ props: { tabs: [] } });
    expect(wrapper.text()).not.toContain('Profile');
  });

  it('forwards the actions slot through to PageHeader', () => {
    const wrapper = mountIt({
      slots: { actions: '<button class="qa-action">Switch</button>' },
    });
    expect(wrapper.find('.qa-action').exists()).toBe(true);
  });

  it('forwards the breadcrumb slot through to PageHeader (precedence over title)', () => {
    const wrapper = mountIt({
      props: { title: 'Account' },
      slots: { breadcrumb: '<span class="qa-bc">Account &rsaquo; Detail</span>' },
    });
    expect(wrapper.find('.qa-bc').exists()).toBe(true);
    expect(wrapper.find('h2.core-page-header__title').exists()).toBe(false);
  });

});

describe('CorePageHeaderTabs — CASL gating on tabs', () => {
  it('respects the can predicate when rendering tabs', () => {
    const tabs = [
      { value: 'profile', label: 'Profile', route: 'profile' },
      { value: 'billing', label: 'Billing', route: 'billing', action: 'manage', subject: 'Billing' },
    ];
    const wrapper = mountIt({
      props: { tabs, can: () => false, basePath: '/users' },
    });
    expect(wrapper.text()).toContain('Profile');
    expect(wrapper.text()).not.toContain('Billing');
  });
});
