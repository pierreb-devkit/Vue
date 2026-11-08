/**
 * Unit tests for the shell every docs page shares.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import DocsShell from '../components/docs.shell.component.vue';
import { useDocsStore } from '../stores/docs.store';

vi.mock('@/config', () => ({ default: { docs: { home: { title: 'Documentation' } } } }));

const sections = [
  { id: 'one', nav: 'One', group: 'Start' },
  { id: 'two', nav: 'Two', group: 'Start' },
  { id: 'three', nav: 'Three' },
];

const tree = {
  categories: [{
    slug: 'guides',
    title: 'Guides',
    order: 1,
    articles: [{ slug: 'beta', title: 'Beta', order: 2 }, { slug: 'alpha', title: 'Alpha', order: 1 }],
  }],
};

/**
 * Mount the shell on a guide, with one block per section in the page.
 * @param {Object} props - The shell's props
 * @param {string} path - The current route
 * @returns {Promise<import('@vue/test-utils').VueWrapper>} The mounted shell
 */
const mountShell = async (props = {}, path = '/docs/guides/alpha') => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useDocsStore().tree = tree;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/docs', component: { template: '<div />' } },
      { path: '/docs/api', component: { template: '<div />' } },
      { path: '/docs/:category/:slug', component: { template: '<div />' } },
    ],
  });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(DocsShell, {
    props,
    attachTo: document.body,
    slots: { default: sections.map((s) => `<div id="${s.id}" />`).join('') },
    global: { plugins: [pinia, router, createVuetify({ components, directives })] },
  });
  await flushPromises();
  return wrapper;
};

/**
 * Place a section's top at a height in the viewport.
 * @param {string} id - The section's id
 * @param {number} top - Its top, in pixels
 * @returns {void}
 */
const placeAt = (id, top) => {
  document.getElementById(id).getBoundingClientRect = () => ({ top });
};

describe('docs.shell component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('opens the page sections under the current guide only', async () => {
    const wrapper = await mountShell({ sections });
    const entries = wrapper.findAll('[data-test="docs-nav-article"]');
    expect(entries.map((e) => e.text())).toEqual(['Alpha', 'Beta']);
    expect(wrapper.findAll('[data-test="docs-nav-sections"]')).toHaveLength(1);
    // The current section is Three: the Start group shows as one row.
    expect(wrapper.findAll('[data-test="docs-nav-section"]').map((l) => l.text())).toEqual(['Three']);
    const group = wrapper.find('[data-test="docs-nav-section-group"]');
    expect(group.text()).toBe('Start');
    expect(group.attributes('href')).toBe('#one');
    wrapper.unmount();
  });

  it('opens a group once the page reaches it', async () => {
    const wrapper = await mountShell({ sections });
    placeAt('one', 40);
    placeAt('two', 600);
    placeAt('three', 1200);
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[data-test="docs-nav-section"]').map((l) => l.text())).toEqual(['One', 'Two', 'Three']);
    wrapper.unmount();
  });

  it('opens no sections on a page without any', async () => {
    const wrapper = await mountShell({}, '/docs');
    expect(wrapper.find('[data-test="docs-nav-sections"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('marks the last section past the line as the page scrolls', async () => {
    const wrapper = await mountShell({ sections });
    placeAt('one', -400);
    placeAt('two', 100);
    placeAt('three', 900);
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const active = wrapper.findAll('[aria-current="location"]');
    expect(active.map((l) => l.text())).toEqual(['Two']);
    expect(active[0].attributes('aria-current')).toBe('location');
    wrapper.unmount();
  });

  it('marks the last section at the very bottom of the page', async () => {
    const wrapper = await mountShell({ sections });
    placeAt('one', -900);
    placeAt('two', 50);
    placeAt('three', 600);
    Object.defineProperty(window, 'scrollY', { value: document.documentElement.scrollHeight + 1, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[aria-current="location"]').text()).toBe('Three');
    wrapper.unmount();
  });

  it('indents a sub-heading under its section', async () => {
    const wrapper = await mountShell({ sections: [{ id: 'one', nav: 'One', depth: 0 }, { id: 'two', nav: 'Two', depth: 1 }] });
    const links = wrapper.findAll('[data-test="docs-nav-section"]');
    expect(links[0].classes()).not.toContain('ps-6');
    expect(links[1].classes()).toContain('ps-6');
    wrapper.unmount();
  });

  it('shows sub-headings under the current section only', async () => {
    const flat = [
      { id: 'one', nav: 'One', depth: 0 },
      { id: 'two', nav: 'Two', depth: 1 },
      { id: 'three', nav: 'Three', depth: 0 },
      { id: 'four', nav: 'Four', depth: 1 },
    ];
    const wrapper = await mountShell({ sections: flat }, '/docs/guides/alpha');
    ['one', 'two', 'three', 'four'].forEach((id, i) => {
      document.body.insertAdjacentHTML('beforeend', `<div id="${id}"></div>`);
      placeAt(id, i === 0 ? 40 : 600 * i);
    });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[data-test="docs-nav-section"]').map((l) => l.text())).toEqual(['One', 'Two', 'Three']);
    wrapper.unmount();
  });

  it('opens a new page at its top', async () => {
    document.documentElement.scrollTop = 500;
    const wrapper = await mountShell({ sections });
    expect(document.documentElement.scrollTop).toBe(0);
    document.documentElement.scrollTop = 500;
    await wrapper.vm.$router.push('/docs/guides/beta');
    await flushPromises();
    expect(document.documentElement.scrollTop).toBe(0);
    wrapper.unmount();
  });

  it('keeps the place when the link names a section', async () => {
    document.documentElement.scrollTop = 500;
    const wrapper = await mountShell({ sections }, '/docs/guides/alpha#two');
    expect(document.documentElement.scrollTop).toBe(500);
    wrapper.unmount();
    document.documentElement.scrollTop = 0;
  });

  it('shows prev and next from the props', async () => {
    const wrapper = await mountShell({
      prev: { category: 'guides', slug: 'zero', title: 'Zero' },
      next: { category: 'guides', slug: 'beta', title: 'Beta' },
    });
    expect(wrapper.find('[data-test="docs-article-prev"]').attributes('href')).toBe('/docs/guides/zero');
    expect(wrapper.find('[data-test="docs-article-next"]').text()).toBe('Beta');
    wrapper.unmount();
  });
});
