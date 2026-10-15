import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';

import NotFoundView from '../views/home.notfound.view.vue';

/**
 * Mount the not-found view with a given app.notFound config.
 * @param {Object} notFound - Value of config.app.notFound
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountView = (notFound = {}) =>
  mount(NotFoundView, {
    global: {
      plugins: [createVuetify()],
      stubs: { 'v-btn': true },
      config: { globalProperties: { config: { app: { notFound } } } },
    },
  });

describe('home.notfound.view — image', () => {
  it('renders a decorative image with the configured width when set', () => {
    const img = mountView({ image: '/images/404.svg', imageWidth: 240 }).find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/images/404.svg');
    expect(img.attributes('alt')).toBe('');
    expect(img.element.style.width).toBe('240px');
    expect(img.element.style.maxWidth).toBe('100%');
  });

  it('reads a digits-only string width as px', () => {
    expect(mountView({ image: '/a.svg', imageWidth: '240' }).find('img').element.style.width).toBe('240px');
  });

  it('passes a CSS length string through', () => {
    expect(mountView({ image: '/a.svg', imageWidth: '50%' }).find('img').element.style.width).toBe('50%');
  });

  it('sets no width when imageWidth is empty', () => {
    expect(mountView({ image: '/a.svg', imageWidth: '' }).find('img').element.style.width).toBe('');
  });

  it('renders no image when unset', () => {
    expect(mountView({}).find('img').exists()).toBe(false);
    expect(mountView({ image: '' }).find('img').exists()).toBe(false);
  });
});
