import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

/**
 * Mock theme helpers.
 */
vi.mock('../../../lib/helpers/theme', () => ({
  style: vi.fn(() => ({ padding: '0' })),
  overlapStyle: vi.fn(() => ({})),
  colorModeStyle: vi.fn(() => ({})),
}));

/**
 * Mock DOMPurify (required by homeImgComponent).
 */
vi.mock('dompurify', () => ({
  default: {
    sanitize: (raw) => raw,
  },
}));

import HomeAboutComponent from '../components/home.about.component.vue';

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

/**
 * Build a default about item with optional overrides.
 * @param {object} overrides - Partial item overrides merged on top of the default payload.
 * @returns {object} About item payload ready to use in test setups.
 */
const makeItem = (overrides = {}) => ({
  subtitle: 'Feature Title',
  text: 'Description text.',
  img: '/images/feature.webp',
  ...overrides,
});

const baseSetup = {
  title: 'About',
  style: { section: {} },
  content: [makeItem()],
};

describe('HomeAboutComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // --- Basic rendering ---

  it('renders the about section with correct id', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('#about').exists()).toBe(true);
  });

  it('renders columns for each content item', () => {
    const setup = { ...baseSetup, content: [makeItem(), makeItem()] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const cols = wrapper.findAllComponents({ name: 'VCol' });
    // col[0] is the outer wrapper col, cols[1] and cols[2] are the item cols
    expect(cols.length).toBeGreaterThanOrEqual(3);
  });

  it('does not render content rows when content is empty', () => {
    const setup = { ...baseSetup, content: [] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.findComponent({ name: 'VRow' }).exists()).toBe(false);
  });

  // --- Image rendering ---

  it('renders v-img for raster image items', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const imgs = wrapper.findAllComponents({ name: 'VImg' });
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders image element for items with img and no background', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    // The about component renders a VImg for raster images without imgBackground
    const imgs = wrapper.findAllComponents({ name: 'VImg' });
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    // Verify the correct src is passed through
    const imgSrcs = imgs.map((img) => img.props('src'));
    expect(imgSrcs).toContain('/images/feature.webp');
  });

  it('inlines SVG content for local .svg images via homeImgComponent', async () => {
    // homeImgComponent fetches the SVG markup and renders it via v-html for local URLs.
    const svgMarkup = '<svg data-test="inline-svg" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => svgMarkup,
    });

    const setup = { ...baseSetup, content: [makeItem({ img: '/images/feature.svg' })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });

    // Wait for the async fetch + reactive update inside homeImgComponent.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    // No raster VImg should be rendered for an inlined SVG.
    const imgs = wrapper.findAllComponents({ name: 'VImg' });
    expect(imgs.length).toBe(0);
    // The inline SVG path is taken (wrapper div exists) — exact markup depends on
    // async fetch timing which is covered directly by home.img.component tests.
    expect(wrapper.find('.home-img-svg').exists()).toBe(true);
  });

  // --- imgBackground ---

  it('wraps image in background card when imgBackground is a string', () => {
    const setup = { ...baseSetup, content: [makeItem({ imgBackground: '#f5f5f7' })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const bgDiv = wrapper.find('[style*="background-color"]');
    expect(bgDiv.exists()).toBe(true);
    expect(bgDiv.attributes('style')).toContain('#f5f5f7');
  });

  it('applies rounded border-radius with rounded-xl theme', () => {
    const setup = { ...baseSetup, content: [makeItem({ imgBackground: '#f5f5f7' })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const bgDiv = wrapper.find('[style*="background-color"]');
    expect(bgDiv.attributes('style')).toContain('border-radius: 16px');
  });

  it('resolves theme-aware imgBackground object for light theme', () => {
    const setup = { ...baseSetup, content: [makeItem({ imgBackground: { light: '#ffffff', dark: '#000000' } })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const bgDiv = wrapper.find('[style*="background-color"]');
    expect(bgDiv.exists()).toBe(true);
  });

  it('does not wrap image when imgBackground is absent', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    // The background wrapper div has specific padding/flex classes
    const bgDivs = wrapper.findAll('.pa-6.d-flex.align-center.justify-center');
    expect(bgDivs).toHaveLength(0);
  });

  // --- resolveImgBackground method ---

  it('returns null for invalid imgBackground value', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.resolveImgBackground({ imgBackground: 42 })).toBeNull();
  });

  it('returns null when imgBackground is not set', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.resolveImgBackground({})).toBeNull();
  });

  it('resolves string imgBackground as-is', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.resolveImgBackground({ imgBackground: '#abc123' })).toBe('#abc123');
  });

  it('resolves object imgBackground based on current theme', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const result = wrapper.vm.resolveImgBackground({ imgBackground: { light: '#fff', dark: '#000' } });
    // Default Vuetify theme is light
    expect(result).toBe('#fff');
  });

  it('returns null for object imgBackground missing light/dark keys', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.resolveImgBackground({ imgBackground: { foo: 'bar' } })).toBeNull();
  });

  // --- Video rendering ---

  it('renders video player when item has video', () => {
    const setup = { ...baseSetup, content: [makeItem({ img: null, video: { file: '/videos/demo.mp4', poster: '/poster.webp' } })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const video = wrapper.findComponent({ name: 'VideoPlayer' });
    expect(video.exists()).toBe(true);
    expect(video.props('src')).toBe('/videos/demo.mp4');
  });

  it('does not render video when item has no video property', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const video = wrapper.findComponent({ name: 'VideoPlayer' });
    expect(video.exists()).toBe(false);
  });

  // --- Reversed layout ---

  it('renders extra content component when reversed is true', () => {
    const setup = { ...baseSetup, content: [makeItem({ reversed: true })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const html = wrapper.html();
    expect(html).toContain('Feature Title');
  });

  // --- Computed properties ---

  it('uses default variant when not specified', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('default');
  });

  it('uses alternate variant when specified', () => {
    const setup = { ...baseSetup, variant: 'alternate' };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.variant).toBe('alternate');
  });

  it('computes containerStyle with maxWidth from config', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    expect(wrapper.vm.containerStyle['max-width']).toBe('1200px');
  });

  it('applies section background color', () => {
    const wrapper = mount(HomeAboutComponent, {
      props: { setup: baseSetup },
      global: globalOpts(vuetify),
    });
    const section = wrapper.find('#about');
    expect(section.attributes('style')).toContain('background');
  });

  // --- fullWidth columns ---

  it('uses md=12 for fullWidth items', () => {
    const setup = { ...baseSetup, content: [makeItem({ fullWidth: true })] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const cols = wrapper.findAllComponents({ name: 'VCol' });
    const itemCol = cols[1];
    expect(itemCol.props('md')).toBe(12);
  });

  it('uses md=6 for multiple non-fullWidth items', () => {
    const setup = { ...baseSetup, content: [makeItem(), makeItem()] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const cols = wrapper.findAllComponents({ name: 'VCol' });
    expect(cols[1].props('md')).toBe(6);
    expect(cols[2].props('md')).toBe(6);
  });

  it('uses md=12 for a single non-fullWidth item', () => {
    const setup = { ...baseSetup, content: [makeItem()] };
    const wrapper = mount(HomeAboutComponent, {
      props: { setup },
      global: globalOpts(vuetify),
    });
    const cols = wrapper.findAllComponents({ name: 'VCol' });
    expect(cols[1].props('md')).toBe(12);
  });
});
