import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import HomeCtaComponent from '../components/home.cta.component.vue';

/**
 * Mock the homeContentComponent used inside CTA.
 */
vi.mock('../components/utils/home.content.component.vue', () => ({
  default: { name: 'homeContentComponent', template: '<div class="mock-content" />', props: ['setup'] },
}));

/**
 * Mock the theme helpers to isolate component logic.
 */
vi.mock('../../../lib/helpers/theme', () => ({
  style: vi.fn(() => ({ padding: '0' })),
  overlapStyle: vi.fn(() => ({})),
  colorModeStyle: vi.fn(() => ({})),
}));

const mockConfig = {
  vuetify: { theme: { rounded: 'rounded-xl', maxWidth: '1200px', flat: false } },
};

/**
 * Build global options with Vuetify + config global property.
 * @param {object} vuetify - Vuetify instance.
 * @returns {object} Vue test-utils global config.
 */
const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  config: {
    globalProperties: { config: mockConfig },
  },
});

describe('HomeCtaComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
  });

  const baseSetup = {
    title: 'Ready to start?',
    subtitle: 'Get going now.',
    button: { title: 'Sign Up', link: '/signup', color: 'primary' },
    secondaryButton: { title: 'Learn More', link: '/docs' },
  };

  it('renders primary and secondary buttons when both are provided', () => {
    const wrapper = mount(HomeCtaComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons).toHaveLength(2);
    expect(buttons[0].text()).toBe('Sign Up');
    expect(buttons[1].text()).toBe('Learn More');
  });

  it('renders only primary button when secondaryButton is absent', () => {
    const setup = { ...baseSetup, secondaryButton: undefined };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text()).toBe('Sign Up');
  });

  it('renders only secondary button when primary button is absent', () => {
    const setup = { ...baseSetup, button: undefined };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons).toHaveLength(1);
    expect(buttons[0].text()).toBe('Learn More');
  });

  it('does not render primary button when title is missing', () => {
    const setup = { ...baseSetup, button: { link: '/signup', color: 'primary' } };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons).toHaveLength(1); // only secondary
    expect(buttons[0].text()).toBe('Learn More');
  });

  it('does not render primary button when link is missing', () => {
    const setup = { ...baseSetup, button: { title: 'Sign Up', color: 'primary' } };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons).toHaveLength(1); // only secondary
  });

  it('applies ml-4 to secondary button only when primary button is present', () => {
    const wrapper = mount(HomeCtaComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons[1].classes()).toContain('ml-4');
  });

  it('does not apply ml-4 to secondary button when primary button is absent', () => {
    const setup = { ...baseSetup, button: undefined };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons[0].classes()).not.toContain('ml-4');
  });

  it('uses default variant when not specified', () => {
    const wrapper = mount(HomeCtaComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('default');
  });

  it('uses alternate variant when specified', () => {
    const setup = { ...baseSetup, variant: 'alternate' };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('alternate');
  });

  it('computes containerStyle with maxWidth from config', () => {
    const wrapper = mount(HomeCtaComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.containerStyle['max-width']).toBe('1200px');
  });

  it('uses href attribute for button links', () => {
    const wrapper = mount(HomeCtaComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const primaryBtn = wrapper.findAllComponents({ name: 'VBtn' })[0];
    expect(primaryBtn.props('href')).toBe('/signup');
  });

  it('renders no buttons when neither button is provided', () => {
    const setup = { title: 'Title', subtitle: 'Sub' };
    const wrapper = mount(HomeCtaComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const buttons = wrapper.findAllComponents({ name: 'VBtn' });
    expect(buttons).toHaveLength(0);
  });

  it('passes title and subtitle to homeContentComponent', () => {
    const wrapper = mount(HomeCtaComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const content = wrapper.findComponent({ name: 'homeContentComponent' });
    expect(content.props('setup')).toEqual({
      title: 'Ready to start?',
      subtitle: 'Get going now.',
      alignment: 'center',
    });
  });
});
