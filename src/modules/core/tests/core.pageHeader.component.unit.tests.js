import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { describe, it, expect } from 'vitest';
import CorePageHeader from '../components/core.pageHeader.component.vue';

/**
 * @desc Build a Vuetify plugin instance with a deterministic mobile breakpoint.
 *       happy-dom defaults to a 1024px viewport, but Vuetify v4's default mobile
 *       cutoff is `lg` (1145px), which would force every test into mobile mode.
 *       We pin `mobileBreakpoint` so the desktop branch is the default and tests
 *       can opt-in to mobile via the `mobile: true` option.
 * @param {boolean} [mobile=false]
 * @returns {ReturnType<typeof createVuetify>}
 */
const makeVuetify = (mobile = false) =>
  createVuetify({
    components,
    directives,
    display: { mobileBreakpoint: mobile ? 'xxl' : 'xs' },
  });

/**
 * @desc Mount CorePageHeader with sane defaults (desktop display, plain props).
 * @param {Object} [opts]
 * @param {Object} [opts.props] - props to forward to the component
 * @param {Object} [opts.slots] - slot templates to inject
 * @param {boolean} [opts.mobile] - whether $vuetify.display.mobile should report true
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountHeader = ({ props = {}, slots = {}, mobile = false } = {}) => {
  const vuetify = makeVuetify(mobile);
  return mount(CorePageHeader, {
    props,
    slots,
    global: {
      plugins: [vuetify],
    },
  });
};

describe('core.pageHeader.component — backward-compat (no breadcrumb)', () => {
  it('renders the title in an <h2> when no breadcrumb slot is provided', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks', icon: 'fa-solid fa-list-check' } });
    const title = wrapper.find('h2.core-page-header__title');
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe('Tasks');
  });

  it('renders the optional subtitle when provided', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks', subtitle: 'Manage your tasks' } });
    const subtitle = wrapper.find('p.core-page-header__subtitle');
    expect(subtitle.exists()).toBe(true);
    expect(subtitle.text()).toBe('Manage your tasks');
  });

  it('does not render a subtitle paragraph when subtitle is empty', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks' } });
    expect(wrapper.find('p.core-page-header__subtitle').exists()).toBe(false);
  });

  it('renders an avatar with the provided icon (desktop)', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks', icon: 'fa-solid fa-list-check' } });
    const avatar = wrapper.findComponent({ name: 'VAvatar' });
    expect(avatar.exists()).toBe(true);
  });

  it('does not render the breadcrumb container in the default DOM', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks' } });
    expect(wrapper.find('.core-page-header__breadcrumb').exists()).toBe(false);
  });
});

describe('core.pageHeader.component — breadcrumb slot', () => {
  it('renders the breadcrumb slot in place of the title when provided', () => {
    const wrapper = mountHeader({
      props: { title: 'Should be ignored', icon: 'fa-solid fa-list-check' },
      slots: { breadcrumb: '<a class="bc-link" href="/scraps">Scraps</a> &rsaquo; Detail' },
    });

    const breadcrumb = wrapper.find('.core-page-header__breadcrumb');
    expect(breadcrumb.exists()).toBe(true);
    expect(breadcrumb.find('.bc-link').exists()).toBe(true);
    expect(breadcrumb.text()).toContain('Scraps');
    expect(breadcrumb.text()).toContain('Detail');
  });

  it('does not render the <h2> title when breadcrumb is provided', () => {
    const wrapper = mountHeader({
      props: { title: 'Should be ignored' },
      slots: { breadcrumb: '<span>Scraps &rsaquo; Detail</span>' },
    });
    expect(wrapper.find('h2.core-page-header__title').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Should be ignored');
  });

  it('does not render the subtitle when breadcrumb takes over', () => {
    const wrapper = mountHeader({
      props: { title: 'Tasks', subtitle: 'Some subtitle' },
      slots: { breadcrumb: '<span>Scraps &rsaquo; Detail</span>' },
    });
    expect(wrapper.find('p.core-page-header__subtitle').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Some subtitle');
  });
});

describe('core.pageHeader.component — canonical 56px height invariant', () => {
  it('applies the .core-page-header class on the root row in title mode', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks' } });
    expect(wrapper.find('.core-page-header').exists()).toBe(true);
  });

  it('applies the .core-page-header class on the root row in breadcrumb mode', () => {
    const wrapper = mountHeader({
      props: { title: 'Tasks' },
      slots: { breadcrumb: '<span>Detail</span>' },
    });
    expect(wrapper.find('.core-page-header').exists()).toBe(true);
  });

  it('produces the same root layout class set with or without the breadcrumb slot', () => {
    const wrapperTitle = mountHeader({ props: { title: 'Tasks' } });
    const wrapperBc = mountHeader({
      props: { title: 'Tasks' },
      slots: { breadcrumb: '<span>Detail</span>' },
    });
    const titleRoot = wrapperTitle.find('.core-page-header');
    const bcRoot = wrapperBc.find('.core-page-header');
    // Layout-bearing classes (height invariant + nowrap) must match across modes
    expect(titleRoot.classes()).toEqual(expect.arrayContaining(['core-page-header', 'flex-nowrap']));
    expect(bcRoot.classes()).toEqual(expect.arrayContaining(['core-page-header', 'flex-nowrap']));
  });
});

describe('core.pageHeader.component — overflow handling', () => {
  it('wraps the title/breadcrumb in a content div with .text-truncate enabled', () => {
    const longTitle = 'A really really really long title that should ellipsis-truncate gracefully';
    const wrapper = mountHeader({ props: { title: longTitle } });
    const content = wrapper.find('.core-page-header__content');
    expect(content.exists()).toBe(true);
    const title = content.find('.core-page-header__title');
    expect(title.classes()).toContain('text-truncate');
  });

  it('truncates the breadcrumb container too', () => {
    const wrapper = mountHeader({
      props: {},
      slots: {
        breadcrumb: '<span>Very-long-breadcrumb-segment &rsaquo; another-very-long-segment &rsaquo; tail</span>',
      },
    });
    const bc = wrapper.find('.core-page-header__breadcrumb');
    expect(bc.classes()).toContain('text-truncate');
  });

  it('keeps the main row in flex-nowrap so actions stay on the same line', () => {
    const wrapper = mountHeader({
      props: { title: 'Tasks' },
      slots: { actions: '<button class="qa-action">Do it</button>' },
    });
    const root = wrapper.find('.core-page-header');
    expect(root.classes()).toContain('flex-nowrap');
  });
});

describe('core.pageHeader.component — actions cluster', () => {
  it('wraps the actions slot in a flex-wrap cluster when actions are provided', () => {
    const wrapper = mountHeader({
      props: { title: 'Tasks' },
      slots: { actions: '<button class="qa-action">Do it</button>' },
    });
    const cluster = wrapper.find('.core-page-header__actions');
    expect(cluster.exists()).toBe(true);
    expect(cluster.classes()).toEqual(expect.arrayContaining(['d-flex', 'align-center', 'flex-wrap']));
    expect(cluster.find('.qa-action').exists()).toBe(true);
  });

  it('does not render the actions wrapper when no actions are provided', () => {
    const wrapper = mountHeader({ props: { title: 'Tasks' } });
    expect(wrapper.find('.core-page-header__actions').exists()).toBe(false);
  });

  it('keeps actions next to the breadcrumb (single row, same wrapper)', () => {
    const wrapper = mountHeader({
      props: {},
      slots: {
        breadcrumb: '<span>Scraps &rsaquo; Detail</span>',
        actions: '<button class="qa-action">Edit</button>',
      },
    });
    expect(wrapper.find('.core-page-header__breadcrumb').exists()).toBe(true);
    expect(wrapper.find('.core-page-header__actions .qa-action').exists()).toBe(true);
  });
});

describe('core.pageHeader.component — tabs mode (unchanged)', () => {
  it('renders the tabs slot and skips the icon/title block', () => {
    const wrapper = mountHeader({
      props: { title: 'Tasks', icon: 'fa-solid fa-list-check' },
      slots: { tabs: '<div class="qa-tabs">Tabs here</div>' },
    });
    expect(wrapper.find('.qa-tabs').exists()).toBe(true);
    expect(wrapper.find('h2.core-page-header__title').exists()).toBe(false);
    expect(wrapper.find('.core-page-header__breadcrumb').exists()).toBe(false);
  });

  it('still applies the canonical 56px height class in tabs mode', () => {
    const wrapper = mountHeader({
      slots: { tabs: '<div class="qa-tabs">Tabs here</div>' },
    });
    expect(wrapper.find('.core-page-header').exists()).toBe(true);
  });
});
