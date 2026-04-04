import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import HomeFeaturesComponent from '../components/home.features.component.vue';

/**
 * Mock child components.
 */
vi.mock('../components/utils/home.content.component.vue', () => ({
  default: { name: 'homeContentComponent', template: '<div class="mock-content" />', props: ['setup', 'alignment', 'color', 'variant'] },
}));
vi.mock('../components/utils/home.dynamicIsland.component.vue', () => ({
  default: { name: 'homeDynamicIsland', template: '<div class="mock-island" />', props: ['container', 'step', 'steps', 'action'] },
}));
vi.mock('../components/utils/home.img.component.vue', () => ({
  default: { name: 'homeImgComponent', template: '<div class="mock-img" />', props: ['img', 'imgMode'] },
}));

/**
 * Mock theme helpers.
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

const makeItem = (overrides = {}) => ({
  subtitle: 'Feature',
  img: '/images/feature.webp',
  text: 'Description',
  ...overrides,
});

describe('HomeFeaturesComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
  });

  const carouselSetup = {
    title: 'Features',
    slide: { interval: 5000 },
    content: [makeItem({ subtitle: 'A' }), makeItem({ subtitle: 'B' })],
  };

  const gridSetup = {
    title: 'Features',
    layout: 'grid',
    slide: { interval: 5000 },
    content: [makeItem({ subtitle: 'A' }), makeItem({ subtitle: 'B' }), makeItem({ subtitle: 'C' })],
  };

  // --- Layout detection ---

  it('defaults to carousel layout when layout is not specified', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: carouselSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.isGrid).toBe(false);
  });

  it('detects grid layout when layout is "grid"', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: gridSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.isGrid).toBe(true);
  });

  // --- Grid rendering ---

  it('renders grid cards when layout is grid', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: gridSetup },
      global: globalOpts(vuetify),
    });
    const cards = wrapper.findAllComponents({ name: 'VCard' });
    expect(cards).toHaveLength(3);
  });

  it('does not render carousel when layout is grid', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: gridSetup },
      global: globalOpts(vuetify),
    });
    const carousel = wrapper.findComponent({ name: 'VCarousel' });
    expect(carousel.exists()).toBe(false);
  });

  it('does not render dynamic island when layout is grid', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: gridSetup },
      global: globalOpts(vuetify),
    });
    const island = wrapper.findComponent({ name: 'homeDynamicIsland' });
    expect(island.exists()).toBe(false);
  });

  // --- Grid column sizing ---

  it('auto-computes gridColSize=6 for 2 items', () => {
    const setup = { ...gridSetup, content: [makeItem(), makeItem()] };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(6);
  });

  it('auto-computes gridColSize=4 for 3 items', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: gridSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(4);
  });

  it('auto-computes gridColSize=3 for 4+ items', () => {
    const setup = { ...gridSetup, content: [makeItem(), makeItem(), makeItem(), makeItem()] };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(3);
  });

  it('uses explicit cols when provided', () => {
    const setup = { ...gridSetup, cols: 2 };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(6);
  });

  it('uses explicit cols=3 for 4-col grid', () => {
    const setup = { ...gridSetup, cols: 3 };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(4);
  });

  it('coerces string cols from env var config', () => {
    const setup = { ...gridSetup, cols: '4' };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(3);
  });

  it('falls back to auto when cols is an invalid string', () => {
    const setup = { ...gridSetup, cols: 'abc' };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(4); // 3 items → auto 4
  });

  it('falls back to auto when cols is not a valid divisor', () => {
    const setup = { ...gridSetup, cols: 5 };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(4); // 3 items → auto 4
  });

  // --- fullWidth in grid ---

  it('honors fullWidth in grid layout', () => {
    const setup = {
      ...gridSetup,
      content: [makeItem({ fullWidth: true }), makeItem()],
    };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const cols = wrapper.findAllComponents({ name: 'VCol' });
    // First col after the header col should have md=12 (fullWidth)
    // cols[0] is the header, cols[1] is the fullWidth item, cols[2] is the normal item
    const fullWidthCol = cols[1];
    const normalCol = cols[2];
    expect(fullWidthCol.props('md')).toBe(12);
    expect(normalCol.props('md')).toBe(6);
  });

  // --- Carousel rendering (default) ---

  it('renders carousel when layout is not grid', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: carouselSetup },
      global: globalOpts(vuetify),
    });
    const carousel = wrapper.findComponent({ name: 'VCarousel' });
    expect(carousel.exists()).toBe(true);
  });

  // --- Null-safety ---

  it('handles undefined content gracefully in grid mode', () => {
    const setup = { title: 'Features', layout: 'grid', slide: { interval: 5000 } };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.gridColSize).toBe(6);
    expect(wrapper.vm.isGrid).toBe(true);
  });

  it('handles undefined content gracefully in carousel mode', () => {
    const setup = { title: 'Features', slide: { interval: 5000 } };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.steps).toBe(-1);
    expect(wrapper.vm.content).toEqual([]);
  });

  // --- Computed properties ---

  it('uses default variant when not specified', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: carouselSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('default');
  });

  it('uses alternate variant when specified', () => {
    const setup = { ...carouselSetup, variant: 'alternate' };
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('alternate');
  });

  it('computes containerStyle with maxWidth from config', () => {
    const wrapper = mount(HomeFeaturesComponent, {
      props: { setup: carouselSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.containerStyle['max-width']).toBe('1200px');
  });
});
