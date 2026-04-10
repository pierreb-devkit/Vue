import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, describe, it, expect } from 'vitest';
import HomeContentComponent from '../components/utils/home.content.component.vue';

/**
 * Stub VMarkdown (registered globally via plugin in prod) so mount does not fail.
 */
const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  stubs: {
    VMarkdown: { name: 'VMarkdown', props: ['source'], template: '<div class="mock-markdown">{{ source }}</div>' },
  },
});

const baseSetup = {
  icon: 'fa-solid fa-star',
  title: 'Section',
  subtitle: 'Heading',
  text: 'Some **markdown** text.',
  button: { title: 'Go', link: '/go' },
};

describe('HomeContentComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
  });

  // --- computedAlignment ---

  it('defaults alignment to left', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup } },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.computedAlignment).toBe('left');
    expect(wrapper.vm.alignmentClass).toBe('text-left');
    expect(wrapper.vm.justifyClass).toBe('justify-start');
  });

  it('supports center alignment via prop', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'center' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.computedAlignment).toBe('center');
    expect(wrapper.vm.alignmentClass).toBe('text-center');
    expect(wrapper.vm.justifyClass).toBe('justify-center');
  });

  it('supports right alignment via prop', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'right' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.computedAlignment).toBe('right');
    expect(wrapper.vm.alignmentClass).toBe('text-right');
    expect(wrapper.vm.justifyClass).toBe('justify-end');
  });

  it('setup.alignment overrides the prop alignment', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup, alignment: 'right' }, alignment: 'left' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.computedAlignment).toBe('right');
  });

  it('falls back to left when alignment is an unknown value', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup, alignment: 'bogus' } },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.computedAlignment).toBe('left');
    expect(wrapper.vm.alignmentClass).toBe('text-left');
    expect(wrapper.vm.justifyClass).toBe('justify-start');
  });

  // --- DOM classes ---

  it('applies text-right and justify-end classes in the DOM when right-aligned', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'right' },
      global: globalOpts(vuetify),
    });
    const title = wrapper.findComponent({ name: 'VCardTitle' });
    expect(title.classes()).toContain('text-right');
    const iconRow = title.find('div.d-flex');
    expect(iconRow.classes()).toContain('justify-end');
    const text = wrapper.findComponent({ name: 'VCardText' });
    expect(text.classes()).toContain('text-right');
    const actions = wrapper.findComponent({ name: 'VCardActions' });
    expect(actions.classes()).toContain('justify-end');
  });

  it('reverses icon+title row order (flex-row-reverse) when right-aligned so the icon hugs the right edge', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'right' },
      global: globalOpts(vuetify),
    });
    const title = wrapper.findComponent({ name: 'VCardTitle' });
    const iconRow = title.find('div.d-flex');
    expect(iconRow.classes()).toContain('flex-row-reverse');
    // must not leak onto v-card-actions (would flip button content order)
    const actions = wrapper.findComponent({ name: 'VCardActions' });
    expect(actions.classes()).not.toContain('flex-row-reverse');
  });

  it('does NOT apply flex-row-reverse to the icon+title row when left-aligned', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'left' },
      global: globalOpts(vuetify),
    });
    const iconRow = wrapper.findComponent({ name: 'VCardTitle' }).find('div.d-flex');
    expect(iconRow.classes()).not.toContain('flex-row-reverse');
  });

  it('does NOT apply flex-row-reverse to the icon+title row when center-aligned', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'center' },
      global: globalOpts(vuetify),
    });
    const iconRow = wrapper.findComponent({ name: 'VCardTitle' }).find('div.d-flex');
    expect(iconRow.classes()).not.toContain('flex-row-reverse');
  });

  it('applies text-center and justify-center classes in the DOM when center-aligned', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'center' },
      global: globalOpts(vuetify),
    });
    const title = wrapper.findComponent({ name: 'VCardTitle' });
    expect(title.classes()).toContain('text-center');
    const iconRow = title.find('div.d-flex');
    expect(iconRow.classes()).toContain('justify-center');
    const text = wrapper.findComponent({ name: 'VCardText' });
    expect(text.classes()).toContain('text-center');
    const actions = wrapper.findComponent({ name: 'VCardActions' });
    expect(actions.classes()).toContain('justify-center');
  });

  it('applies text-left and justify-start classes in the DOM when left-aligned', () => {
    const wrapper = mount(HomeContentComponent, {
      props: { setup: { ...baseSetup }, alignment: 'left' },
      global: globalOpts(vuetify),
    });
    const title = wrapper.findComponent({ name: 'VCardTitle' });
    expect(title.classes()).toContain('text-left');
    const iconRow = title.find('div.d-flex');
    expect(iconRow.classes()).toContain('justify-start');
    const text = wrapper.findComponent({ name: 'VCardText' });
    expect(text.classes()).toContain('text-left');
    const actions = wrapper.findComponent({ name: 'VCardActions' });
    expect(actions.classes()).toContain('justify-start');
  });

  // --- prop validator ---

  it('validator accepts left, center, right and rejects others', () => {
    const { validator } = HomeContentComponent.props.alignment;
    expect(validator('left')).toBe(true);
    expect(validator('center')).toBe(true);
    expect(validator('right')).toBe(true);
    expect(validator('bogus')).toBe(false);
  });
});
