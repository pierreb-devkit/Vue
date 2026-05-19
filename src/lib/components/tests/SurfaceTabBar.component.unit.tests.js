import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import SurfaceTabBar from '../SurfaceTabBar.vue';

// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const makeVuetify = () => createVuetify({ components, directives });

/**
 * A stub for VTab that renders a plain anchor so we can assert text content
 * without wiring up vue-router. The component under test is purely presentational
 * (CASL filtering); routing behaviour is not in scope here.
 * @type {object}
 */
const VTabStub = {
  template: '<a class="v-tab-stub" v-bind="$attrs"><slot /></a>',
  props: ['to'],
};

/**
 * Mount SurfaceTabBar with the given props.
 * @param {object} props - Component props (tabs, can, basePath).
 * @returns {import('@vue/test-utils').VueWrapper}
 */
// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const mountBar = (props) =>
  mount(SurfaceTabBar, {
    props,
    global: {
      plugins: [makeVuetify()],
      stubs: { VTab: VTabStub },
    },
  });

const tabs = [
  { value: 'general', label: 'General', route: 'general' },
  { value: 'billing', label: 'Billing', route: 'billing', action: 'manage', subject: 'Organization' },
];

describe('SurfaceTabBar — CASL filtering', () => {
  it('renders only CASL-allowed tabs and re-filters reactively when ability changes (no remount)', async () => {
    const wrapper = mountBar({
      tabs,
      can: (a, s) => false,
      basePath: '/users/organizations/1',
    });

    // Unconditional tab (no CASL pair) always shown
    expect(wrapper.text()).toContain('General');
    // CASL-denied tab must be hidden
    expect(wrapper.text()).not.toContain('Billing');

    // Reactive re-filter: grant the ability via setProps (same instance, no remount)
    await wrapper.setProps({ can: (a, s) => a === 'manage' && s === 'Organization' });

    expect(wrapper.text()).toContain('Billing');
  });

  it('shows all tabs when can returns true for everything', () => {
    const wrapper = mountBar({
      tabs,
      can: () => true,
      basePath: '/users/organizations/1',
    });
    expect(wrapper.text()).toContain('General');
    expect(wrapper.text()).toContain('Billing');
  });

  it('hides all CASL-guarded tabs when can returns false', () => {
    const wrapper = mountBar({
      tabs,
      can: () => false,
      basePath: '/users/organizations/1',
    });
    expect(wrapper.text()).toContain('General');
    expect(wrapper.text()).not.toContain('Billing');
  });

  it('renders nothing when tabs array is empty', () => {
    const wrapper = mountBar({ tabs: [], can: () => true, basePath: '/org/1' });
    // VTabs renders but contains no VTab children
    expect(wrapper.findAll('.v-tab-stub')).toHaveLength(0);
  });

  it('renders an icon element when a tab has an icon field', () => {
    const tabsWithIcon = [
      { value: 'general', label: 'General', route: 'general', icon: 'fa-solid fa-gear' },
    ];
    const wrapper = mountBar({ tabs: tabsWithIcon, can: () => true, basePath: '/org/1' });
    expect(wrapper.findComponent({ name: 'VIcon' }).exists()).toBe(true);
  });

  it('does not render an icon element when tab has no icon field', () => {
    const wrapper = mountBar({ tabs, can: () => true, basePath: '/org/1' });
    // "General" tab has no icon; "Billing" tab has no icon
    expect(wrapper.findComponent({ name: 'VIcon' }).exists()).toBe(false);
  });
});
