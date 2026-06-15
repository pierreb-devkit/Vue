import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

// Mock vuetify composables used in the component script
vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTheme: () => ({
      current: { colors: { surface: '#f5f5f5', background: '#ffffff' } },
    }),
  };
});

import HomeArticlesComponent from '../components/home.articles.component.vue';

const mockConfig = {
  vuetify: { theme: { rounded: 'rounded-xl', maxWidth: '1200px' } },
};

/**
 * @desc Build global mount options with Vuetify + config global property.
 * @param {object} vuetify - Vuetify instance.
 * @returns {object} Vue test-utils global config.
 */
const globalOpts = (vuetify) => ({
  plugins: [vuetify],
  config: { globalProperties: { config: mockConfig } },
});

/**
 * @desc Mount the articles component with a single content item.
 * @param {object} vuetify - Vuetify instance.
 * @param {object} item - The article item (title, url, feature_image, ...).
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountWithItem = (vuetify, item) => mount(HomeArticlesComponent, {
  props: { setup: { content: [item], slide: { interval: 6000 } } },
  global: globalOpts(vuetify),
});

describe('HomeArticlesComponent', () => {
  let vuetify;

  beforeEach(() => {
    vuetify = createVuetify({ components, directives });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('safeHref', () => {
    it('passes an https URL through unchanged', () => {
      const wrapper = mountWithItem(vuetify, { title: 'A', url: 'https://example.com/post' });
      expect(wrapper.vm.safeHref('https://example.com/post')).toBe('https://example.com/post');
    });

    it('passes an http URL through unchanged', () => {
      const wrapper = mountWithItem(vuetify, { title: 'A', url: 'http://example.com/post' });
      expect(wrapper.vm.safeHref('http://example.com/post')).toBe('http://example.com/post');
    });

    it('neutralizes a javascript: URL to #', () => {
      const wrapper = mountWithItem(vuetify, { title: 'A', url: 'https://example.com' });
      // eslint-disable-next-line no-script-url
      expect(wrapper.vm.safeHref('javascript:alert(1)')).toBe('#');
    });

    it('neutralizes a data: URL to #', () => {
      const wrapper = mountWithItem(vuetify, { title: 'A', url: 'https://example.com' });
      expect(wrapper.vm.safeHref('data:text/html,<script>alert(1)</script>')).toBe('#');
    });

    it('neutralizes an unparseable / empty value to #', () => {
      const wrapper = mountWithItem(vuetify, { title: 'A', url: 'https://example.com' });
      expect(wrapper.vm.safeHref('not a url')).toBe('#');
      expect(wrapper.vm.safeHref('')).toBe('#');
      expect(wrapper.vm.safeHref(undefined)).toBe('#');
    });
  });

  describe('rendered :href', () => {
    it('renders a javascript: article URL as # (no script execution)', () => {
      // eslint-disable-next-line no-script-url
      const wrapper = mountWithItem(vuetify, { title: 'Bad', url: 'javascript:alert(1)', feature_image: '/x.webp' });
      const anchor = wrapper.find('a');
      expect(anchor.exists()).toBe(true);
      expect(anchor.attributes('href')).toBe('#');
    });

    it('renders a valid https article URL on the anchor', () => {
      const wrapper = mountWithItem(vuetify, { title: 'Good', url: 'https://example.com/post', feature_image: '/x.webp' });
      const anchor = wrapper.find('a');
      expect(anchor.exists()).toBe(true);
      expect(anchor.attributes('href')).toBe('https://example.com/post');
    });
  });
});
