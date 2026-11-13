import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useHead } from '@unhead/vue';
import { createHead } from '@unhead/vue/client';
import { renderSSRHead } from '@unhead/vue/server';

vi.mock('../../../config/index.js', () => ({
  default: { app: { title: 'App', description: 'App description' } },
}));

import { buildPageHead, usePageHead } from '../usePageHead';

/**
 * Mount an app-level head entry (as app.vue sets it) with an optional page view inside.
 * @param {object} head - unhead instance
 * @param {object|Function|null} page - input passed to usePageHead, or null for no view
 * @returns {import('@vue/test-utils').VueWrapper} the mounted wrapper
 */
const mountWithPage = (head, page) => {
  const View = defineComponent({
    setup() {
      usePageHead(page);
      return () => h('div');
    },
  });
  const Root = defineComponent({
    setup() {
      useHead(() => ({
        title: 'App',
        meta: [
          { name: 'description', content: 'App description' },
          { property: 'og:title', content: 'App' },
          { property: 'og:description', content: 'App description' },
        ],
      }));
      const show = ref(true);
      return { show };
    },
    render() {
      return this.show && page ? h(View) : h('div');
    },
  });
  return mount(Root, { global: { plugins: [head] } });
};

/**
 * Render the resolved head tags of an unhead instance to HTML.
 * @param {object} head - unhead instance
 * @returns {Promise<string>} head HTML
 */
const headHtml = async (head) => (await renderSSRHead(head)).headTags;

describe('buildPageHead', () => {
  it('suffixes the page title with the app name and mirrors the description', () => {
    expect(buildPageHead({ title: 'Pricing', description: 'Plans' }, 'App')).toEqual({
      title: 'Pricing | App',
      meta: [
        { property: 'og:title', content: 'Pricing | App' },
        { name: 'twitter:title', content: 'Pricing | App' },
        { name: 'description', content: 'Plans' },
        { property: 'og:description', content: 'Plans' },
        { name: 'twitter:description', content: 'Plans' },
      ],
    });
  });

  it('falls back to the app name alone when the page has no title (or the same one)', () => {
    expect(buildPageHead({}, 'App').title).toBe('App');
    expect(buildPageHead({ title: 'App' }, 'App').title).toBe('App');
    expect(buildPageHead(null, 'App').meta.some((m) => m.name === 'description')).toBe(false);
  });

  it('uses the page title alone when no app name is configured', () => {
    expect(buildPageHead({ title: 'Pricing' }, '').title).toBe('Pricing');
  });

  it('reads the app name from config by default', () => {
    expect(buildPageHead({ title: 'Docs' }).title).toBe('Docs | App');
  });
});

describe('usePageHead', () => {
  it('overrides the app title and description while the view is mounted, and restores them on unmount', async () => {
    const head = createHead();
    const wrapper = mountWithPage(head, { title: 'Pricing', description: 'Plans' });
    await nextTick();

    let html = await headHtml(head);
    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html).toContain('content="Plans"');
    expect(html).toContain('<meta property="og:title" content="Pricing | App">');
    expect(html).not.toContain('content="App description"');

    wrapper.vm.show = false;
    await nextTick();
    html = await headHtml(head);
    expect(html).toContain('content="App description"');
    expect(html).not.toContain('content="Plans"');
  });

  it('follows a getter so data loaded later updates the head', async () => {
    const head = createHead();
    const page = ref({ title: '', description: '' });
    mountWithPage(head, () => page.value);
    await nextTick();
    expect(await headHtml(head)).toContain('content="App description"');

    page.value = { title: 'Guide', description: 'Guide summary' };
    await nextTick();
    const html = await headHtml(head);
    expect(html).toContain('<meta property="og:title" content="Guide | App">');
    expect(html).toContain('content="Guide summary"');
  });
});
