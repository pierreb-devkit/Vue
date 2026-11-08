/**
 * Unit tests for the two-pane guide page.
 */
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import DocsPanes from '../components/docs.panes.component.vue';
import DocsCodeblock from '../components/docs.codeblock.component.vue';
import panesPage from './fixtures/docsPanes.page';

vi.mock('@/config', () => ({ default: { docs: {} } }));

/**
 * Mount the page on the fixture content.
 * @returns {Promise<import('@vue/test-utils').VueWrapper>} The mounted page.
 */
const mountPanes = async () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:all(.*)*', component: { template: '<div />' } }],
  });
  await router.push('/docs/data/items');
  await router.isReady();
  return mount(DocsPanes, {
    props: { page: panesPage },
    global: { plugins: [pinia, router, createVuetify({ components, directives })] },
  });
};

describe('docs.panes component', () => {
  it('renders one block per section, with its route', async () => {
    const wrapper = await mountPanes();
    expect(wrapper.findAll('[data-test="docs-panes-section"]')).toHaveLength(panesPage.sections.length);
    expect(wrapper.text()).toContain('/api/items/:id');
    expect(wrapper.find('#statuses').exists()).toBe(true);
  });

  it('renders backticks as code, never as html', async () => {
    const wrapper = await mountPanes();
    const codes = wrapper.findAll('[data-test="docs-panes-value"] code').map((c) => c.text());
    expect(codes).toContain('itemIds');
    wrapper.findAll('[data-test="docs-panes-text"]').forEach((text) => expect(text.text()).not.toContain('`'));
  });

  it('keeps markup-like text literal', async () => {
    const wrapper = await mountPanes();
    const text = wrapper.find('#start [data-test="docs-panes-text"]');
    expect(text.text()).toContain('<b>new</b>');
    expect(text.find('b').exists()).toBe(false);
  });

  it('moves every code card to the language picked on one', async () => {
    const wrapper = await mountPanes();
    const requestCards = wrapper.findAllComponents(DocsCodeblock)
      .filter((card) => card.props('examples').length === 3);
    requestCards[0].vm.active = 2;
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(requestCards[1].vm.current.lang).toBe('python');
  });
});
