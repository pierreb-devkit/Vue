import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, describe, it, expect, vi, afterEach } from 'vitest';

// Mock DOMPurify — pass through safe content, strip dangerous patterns for test assertions
vi.mock('dompurify', () => ({
  default: {
    sanitize: (raw, _opts) => raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, ''),
  },
}));

import HomeImgComponent from '../components/utils/home.img.component.vue';

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
 * Counter to generate unique SVG URLs per test (avoids module-level cache collisions).
 * @type {number}
 */
let urlCounter = 0;

/**
 * Generate a unique local SVG URL for test isolation.
 * @returns {string} Unique relative SVG path.
 */
function uniqueSvgUrl() {
  urlCounter += 1;
  return `/images/test-${urlCounter}.svg`;
}

describe('HomeImgComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders v-img for non-SVG sources', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: '/images/photo.webp' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(true);
    expect(wrapper.find('.home-img-svg').exists()).toBe(false);
  });

  it('renders inline SVG container for local .svg sources', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: uniqueSvgUrl() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.home-img-svg').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(false);
  });

  it('falls back to v-img for absolute SVG URLs', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: 'https://example.com/icon.svg' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.findComponent({ name: 'VImg' }).exists()).toBe(true);
    expect(wrapper.find('.home-img-svg').exists()).toBe(false);
  });

  it('fetches and renders SVG content inline', async () => {
    const url = uniqueSvgUrl();
    const svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>';
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(svgMarkup) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').exists()).toBe(true);
    });
    expect(wrapper.find('.home-img-svg__content').html()).toContain('<circle');
  });

  it('shows loading state while SVG is being fetched', async () => {
    const url = uniqueSvgUrl();
    // fetch never resolves — spinner branch should be active.
    fetch.mockReturnValueOnce(new Promise(() => {}));

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });
    await wrapper.vm.$nextTick();

    // No svgContent and no svgError → loading branch renders.
    expect(wrapper.find('.home-img-svg').exists()).toBe(true);
    expect(wrapper.find('.home-img-svg__content').exists()).toBe(false);
    expect(wrapper.vm.svgError).toBe(false);
    expect(wrapper.vm.svgContent).toBe('');
  });

  it('sets svgError when fetch fails', async () => {
    const url = uniqueSvgUrl();
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.vm.svgError).toBe(true);
    });
    expect(wrapper.vm.svgContent).toBe('');
  });

  it('sets svgError when response is not ok', async () => {
    const url = uniqueSvgUrl();
    fetch.mockResolvedValueOnce({ ok: false });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.vm.svgError).toBe(true);
    });
    expect(wrapper.vm.svgContent).toBe('');
  });

  it('sets svgError when response is not valid SVG', async () => {
    const url = uniqueSvgUrl();
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve('<html>not svg</html>') });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.vm.svgError).toBe(true);
    });
    expect(wrapper.vm.svgContent).toBe('');
  });

  it('sanitizes script tags from SVG content', async () => {
    const url = uniqueSvgUrl();
    const malicious = '<svg><script>alert("xss")</script><circle r="10"/></svg>';
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(malicious) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').exists()).toBe(true);
    });
    const html = wrapper.find('.home-img-svg__content').html();
    expect(html).not.toContain('<script');
    expect(html).toContain('<circle');
  });

  it('sanitizes event handler attributes from SVG content', async () => {
    const url = uniqueSvgUrl();
    const malicious = '<svg><rect onclick="alert(1)" r="10"/></svg>';
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(malicious) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').exists()).toBe(true);
    });
    expect(wrapper.find('.home-img-svg__content').html()).not.toContain('onclick');
  });

  it('applies gradient overlay in SVG path', async () => {
    const url = uniqueSvgUrl();
    const svgMarkup = '<svg><circle r="10"/></svg>';
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(svgMarkup) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url, gradient: 'to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)' },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').exists()).toBe(true);
    });
    const gradientEl = wrapper.find('.home-img-svg__gradient');
    expect(gradientEl.exists()).toBe(true);
  });

  it('renders title and text in overlay container for SVG path', async () => {
    const url = uniqueSvgUrl();
    const svgMarkup = '<svg><circle r="10"/></svg>';
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(svgMarkup) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url, title: 'Hello', text: 'World' },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').exists()).toBe(true);
    });
    const overlay = wrapper.find('.home-img-svg__overlay');
    expect(overlay.exists()).toBe(true);
    expect(overlay.text()).toContain('Hello');
    expect(overlay.text()).toContain('World');
  });

  it('sets aria-hidden when no alt or title is provided', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: uniqueSvgUrl() },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.home-img-svg').attributes('aria-hidden')).toBe('true');
  });

  it('sets aria-label when alt is provided', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: uniqueSvgUrl(), alt: 'Hero illustration' },
      global: globalOpts(vuetify),
    });
    const svg = wrapper.find('.home-img-svg');
    expect(svg.attributes('aria-label')).toBe('Hero illustration');
    expect(svg.attributes('aria-hidden')).toBeUndefined();
  });

  it('normalizes numeric height to px string', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: uniqueSvgUrl(), height: 200 },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.home-img-svg').attributes('style')).toContain('height: 200px');
  });

  it('passes string height through unchanged', () => {
    const wrapper = mount(HomeImgComponent, {
      props: { img: uniqueSvgUrl(), height: '50vh' },
      global: globalOpts(vuetify),
    });
    expect(wrapper.find('.home-img-svg').attributes('style')).toContain('height: 50vh');
  });

  it('calls DOMPurify.sanitize when rendering SVG content', async () => {
    const DOMPurify = (await import('dompurify')).default;
    const sanitizeSpy = vi.spyOn(DOMPurify, 'sanitize');

    const url = uniqueSvgUrl();
    const svgMarkup = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
    fetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(svgMarkup) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').exists()).toBe(true);
    });
    expect(sanitizeSpy).toHaveBeenCalledWith(svgMarkup, expect.objectContaining({
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'use'],
      FORBID_ATTR: ['onload', 'onerror'],
    }));
  });

  it('clears previous SVG when img changes', async () => {
    const url1 = uniqueSvgUrl();
    const url2 = uniqueSvgUrl();
    const svg1 = '<svg><circle r="10"/></svg>';
    const svg2 = '<svg><rect width="10" height="10"/></svg>';
    fetch
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(svg1) })
      .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(svg2) });

    const wrapper = mount(HomeImgComponent, {
      props: { img: url1 },
      global: globalOpts(vuetify),
    });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').html()).toContain('<circle');
    });

    await wrapper.setProps({ img: url2 });

    await vi.waitFor(() => {
      expect(wrapper.find('.home-img-svg__content').html()).toContain('<rect');
    });
  });
});
