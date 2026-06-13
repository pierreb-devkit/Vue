import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import SurfaceTabBar from '../core.surfaceTabBar.component.vue';

/**
 * Create a Vuetify instance with all components and directives registered.
 * @returns {import('vuetify').Vuetify} Vuetify instance created by createVuetify.
 */
// biome-ignore lint/correctness/useQwikValidLexicalScope: false positive — Qwik rule does not apply in a Vue/Vitest context
const makeVuetify = () => createVuetify({ components, directives });

/**
 * A stub for VTab that renders a plain anchor so we can assert text content
 * and href/path composition without wiring up vue-router. The component under
 * test is purely presentational (CASL filtering + path join); routing behaviour
 * is not in scope here. `to` is declared as a prop so Vue binds it explicitly
 * rather than forwarding it through $attrs as a DOM attribute — this lets us
 * assert the resolved path via `attributes('href')`.
 * @type {object}
 */
const VTabStub = {
  template: '<a class="v-tab-stub" :href="to"><slot /></a>',
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
      can: () => false,
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

describe('SurfaceTabBar — path composition', () => {
  it('(a) normal relative tab resolves href to basePath + route', () => {
    const wrapper = mountBar({
      tabs: [{ value: 'general', label: 'General', route: 'general' }],
      can: () => true,
      basePath: '/users/organizations/1',
    });
    expect(wrapper.find('.v-tab-stub').attributes('href')).toBe('/users/organizations/1/general');
  });

  it('(b) basePath with trailing slash + relative route → no double slash', () => {
    const wrapper = mountBar({
      tabs: [{ value: 'general', label: 'General', route: 'general' }],
      can: () => true,
      basePath: '/users/organizations/1/',
    });
    expect(wrapper.find('.v-tab-stub').attributes('href')).toBe('/users/organizations/1/general');
  });

  it('(c) legacy absolute route is passed through verbatim without prepending basePath', () => {
    const wrapper = mountBar({
      // resolveSurfaceTabs accepts legacy absolute routes (/admin/...) that pass isValidTab
      tabs: [{ value: 'admin-x', label: 'AdminX', route: '/admin/x' }],
      can: () => true,
      basePath: '/users/organizations/1',
    });
    expect(wrapper.find('.v-tab-stub').attributes('href')).toBe('/admin/x');
  });
});

describe('SurfaceTabBar — optional tab badge', () => {
  it('renders a small tonal warning chip with the count after the label when badge > 0', () => {
    const wrapper = mountBar({
      tabs: [{ value: 'readiness', label: 'Readiness', route: 'readiness', badge: 3 }],
      can: () => true,
      basePath: '/admin',
    });
    const chip = wrapper.findComponent({ name: 'VChip' });
    expect(chip.exists()).toBe(true);
    expect(chip.text()).toBe('3');
    expect(chip.props('color')).toBe('warning');
    expect(chip.props('variant')).toBe('tonal');
  });

  it('renders no chip when badge is 0', () => {
    const wrapper = mountBar({
      tabs: [{ value: 'readiness', label: 'Readiness', route: 'readiness', badge: 0 }],
      can: () => true,
      basePath: '/admin',
    });
    expect(wrapper.findComponent({ name: 'VChip' }).exists()).toBe(false);
  });

  it('renders no chip when badge is absent (existing surfaces unaffected)', () => {
    const wrapper = mountBar({
      tabs: [{ value: 'general', label: 'General', route: 'general' }],
      can: () => true,
      basePath: '/users/organizations/1',
    });
    expect(wrapper.findComponent({ name: 'VChip' }).exists()).toBe(false);
  });
});
