import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import CoreProseComponent from '../components/core.prose.component.vue';

describe('CoreProseComponent', () => {
  it('renders its slot inside a div carrying the prose class by default', () => {
    const wrapper = mount(CoreProseComponent, { slots: { default: '<p>Hello</p>' } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('core-prose');
    expect(wrapper.find('p').text()).toBe('Hello');
  });

  it('renders the requested root tag and keeps the caller classes and attributes', () => {
    const wrapper = mount(CoreProseComponent, {
      props: { tag: 'article' },
      attrs: { class: 'docs-prose', 'data-test': 'body' },
    });
    expect(wrapper.element.tagName).toBe('ARTICLE');
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['core-prose', 'docs-prose']));
    expect(wrapper.attributes('data-test')).toBe('body');
  });

  it('styles rendered markdown with theme tokens only (light and dark both work)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const sfc = readFileSync(resolve(here, '../components/core.prose.component.vue'), 'utf8');
    const style = sfc.slice(sfc.indexOf('<style scoped>'));
    expect(style).toMatch(/\.core-prose :deep\(h2\) \{/);
    expect(style).toMatch(/\.core-prose :deep\(table\) \{/);
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
