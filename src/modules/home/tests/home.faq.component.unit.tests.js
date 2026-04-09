import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import HomeFaqComponent from '../components/home.faq.component.vue';

/**
 * Mock child components.
 */
vi.mock('../components/utils/home.content.component.vue', () => ({
  default: { name: 'homeContentComponent', template: '<div class="mock-content" />', props: ['setup'] },
}));

/**
 * Mock theme helpers.
 */
vi.mock('../../../lib/helpers/theme', () => ({
  style: vi.fn(() => ({})),
  overlapStyle: vi.fn(() => ({})),
  colorModeStyle: vi.fn(() => ({})),
}));

/**
 * Mock @unhead/vue to prevent SSR side-effects.
 */
vi.mock('@unhead/vue', () => ({
  useHead: vi.fn(),
}));

const mockConfig = {
  vuetify: { theme: { rounded: 'rounded-xl', maxWidth: '1200px', flat: false } },
};

const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  config: {
    globalProperties: { config: mockConfig },
  },
});

const makeFaq = (overrides = {}) => ({
  icon: 'fa-solid fa-circle-question',
  title: 'FAQ',
  content: [
    { question: 'How does it work?', answer: 'It works **great**.' },
    { question: 'Is there a free trial?', answer: 'Yes, 14 days.' },
  ],
  ...overrides,
});

describe('HomeFaqComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
  });

  // --- Rendering ---

  it('renders expansion panels for each FAQ item', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });
    const panels = wrapper.findAllComponents({ name: 'VExpansionPanel' });
    expect(panels).toHaveLength(2);
  });

  it('renders question text in panel titles', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });
    const titles = wrapper.findAllComponents({ name: 'VExpansionPanelTitle' });
    expect(titles[0].text()).toContain('How does it work?');
    expect(titles[1].text()).toContain('Is there a free trial?');
  });

  it('renders subtitle when provided', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq({ subtitle: 'Everything you need to know' }) },
      global: globalOpts(vuetify),
    });
    const contents = wrapper.findAllComponents({ name: 'homeContentComponent' });
    const subtitleContent = contents.find((c) => c.props('setup')?.subtitle);
    expect(subtitleContent).toBeTruthy();
    expect(subtitleContent.props('setup').subtitle).toBe('Everything you need to know');
  });

  it('does not render subtitle row when not provided', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });
    const contents = wrapper.findAllComponents({ name: 'homeContentComponent' });
    const subtitleContent = contents.find((c) => c.props('setup')?.subtitle);
    expect(subtitleContent).toBeUndefined();
  });

  // --- Columns ---

  it('defaults to single column', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.columns).toHaveLength(1);
    expect(wrapper.vm.colWidth).toBe(8);
  });

  it('splits into 2 columns when configured', () => {
    const setup = makeFaq({
      columns: 2,
      content: [
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
        { question: 'Q3', answer: 'A3' },
      ],
    });
    const wrapper = mount(HomeFaqComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.columns).toHaveLength(2);
    expect(wrapper.vm.columns[0]).toHaveLength(2);
    expect(wrapper.vm.columns[1]).toHaveLength(1);
    expect(wrapper.vm.colWidth).toBe(6);
  });

  // --- Null-safety ---

  it('handles empty content gracefully', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq({ content: [] }) },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.columns).toEqual([]);
    const panels = wrapper.findAllComponents({ name: 'VExpansionPanel' });
    expect(panels).toHaveLength(0);
  });

  it('handles undefined content gracefully', () => {
    const setup = { title: 'FAQ', icon: 'fa-solid fa-question' };
    const wrapper = mount(HomeFaqComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.columns).toEqual([]);
  });

  it('filters out items without question or answer', () => {
    const setup = makeFaq({
      content: [
        { question: 'Valid?', answer: 'Yes' },
        { question: '', answer: 'No question' },
        { question: 'No answer', answer: '' },
        { question: 'Also valid?', answer: 'Sure' },
      ],
    });
    const wrapper = mount(HomeFaqComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const panels = wrapper.findAllComponents({ name: 'VExpansionPanel' });
    expect(panels).toHaveLength(2);
  });

  // --- Computed styles ---

  it('uses default variant when not specified', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('default');
  });

  it('uses alternate variant when specified', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq({ variant: 'alternate' }) },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('alternate');
  });

  it('computes containerStyle with maxWidth from config', () => {
    const wrapper = mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.containerStyle['max-width']).toBe('1200px');
  });

  // --- JSON-LD ---

  it('calls useHead with FAQPage schema when content exists', async () => {
    const { useHead } = await import('@unhead/vue');
    useHead.mockClear();

    mount(HomeFaqComponent, {
      props: { setup: makeFaq() },
      global: globalOpts(vuetify),
    });

    expect(useHead).toHaveBeenCalledWith({
      script: [
        expect.objectContaining({
          type: 'application/ld+json',
        }),
      ],
    });

    const call = useHead.mock.calls[0][0];
    const json = JSON.parse(call.script[0].innerHTML.replace(/\\u003c/g, '<'));
    expect(json['@type']).toBe('FAQPage');
    expect(json.mainEntity).toHaveLength(2);
    expect(json.mainEntity[0]['@type']).toBe('Question');
  });

  it('does not call useHead when content is empty', async () => {
    const { useHead } = await import('@unhead/vue');
    useHead.mockClear();

    mount(HomeFaqComponent, {
      props: { setup: makeFaq({ content: [] }) },
      global: globalOpts(vuetify),
    });

    expect(useHead).not.toHaveBeenCalled();
  });
});
