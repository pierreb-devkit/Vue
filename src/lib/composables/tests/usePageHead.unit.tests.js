import { describe, it, expect, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useHead } from '@unhead/vue';
import { createHead } from '@unhead/vue/client';
import { renderSSRHead } from '@unhead/vue/server';

vi.mock('../../../config/index.js', () => ({
  default: { app: { title: 'App', description: 'App description' } },
}));

import { buildPageHead, stripMarkdown, usePageHead } from '../usePageHead';

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

describe('stripMarkdown', () => {
  it.each([
    ['bold with stars', '**Goal: ship it**', 'Goal: ship it'],
    ['bold with underscores', 'a __strong__ word', 'a strong word'],
    ['italic with a star', 'an *emphasised* word', 'an emphasised word'],
    ['italic with an underscore', 'an _emphasised_ word', 'an emphasised word'],
    ['inline code', 'run `npm ci` first', 'run npm ci first'],
    ['a link', 'see [the guide](https://example.com/guide) now', 'see the guide now'],
    ['an image', '![a diagram](/img/d.png) here', 'a diagram here'],
    ['a heading sign', '## Getting started', 'Getting started'],
    ['a quote sign', '> quoted line', 'quoted line'],
    ['list markers', '- one\n* two\n+ three', 'one two three'],
    ['extra whitespace and newlines', '  first line\n\n  second   line ', 'first line second line'],
  ])('removes %s', (_label, input, expected) => {
    expect(stripMarkdown(input)).toBe(expected);
  });

  it.each([
    ['snake_case', 'set snake_case keys'],
    ['several underscores in a word', 'open file_name_here.md'],
    ['a multiplication', 'it costs 2 * 3 euros'],
    ['apostrophes', "it's the user's page"],
    ['a lone star', 'rated 5 * by users'],
    ['unspaced multiplications', '5*3 and 4*2'],
    ['a year at the start', '2024. Year in review'],
    ['a lone underscore', 'a _ b'],
    ['an issue number at a line start', '#4844 fixed'],
  ])('keeps %s', (_label, input) => {
    expect(stripMarkdown(input)).toBe(input);
  });

  it('returns an empty string for a missing value', () => {
    expect(stripMarkdown(undefined)).toBe('');
    expect(stripMarkdown(null)).toBe('');
  });
});

describe('buildPageHead', () => {
  it('strips markdown from the description in every meta tag', () => {
    const { meta } = buildPageHead({ title: 'Guide', description: '**Goal:** read `the` [docs](/docs)' }, 'App');
    const descriptions = meta.filter((m) => /description/.test(m.name || m.property)).map((m) => m.content);
    expect(descriptions).toEqual(['Goal: read the docs', 'Goal: read the docs', 'Goal: read the docs']);
  });

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
