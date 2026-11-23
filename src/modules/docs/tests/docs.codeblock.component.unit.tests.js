import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../auth/stores/auth.store';
import DocsCodeblock, { API_KEY_PLACEHOLDER } from '../components/docs.codeblock.component.vue';

const vuetify = () => createVuetify({ components, directives });

const CURL = `curl https://api.example.com/resource -H "Authorization: Bearer ${API_KEY_PLACEHOLDER}"`;
const NODE = `fetch(url, { headers: { Authorization: "Bearer ${API_KEY_PLACEHOLDER}" } })`;

const multiExamples = [
  { lang: 'bash', code: CURL },
  { lang: 'javascript', code: NODE },
];

const singleExample = [{ lang: 'bash', code: CURL }];

/**
 * Mount the codeblock with a stubbed clipboard and given examples.
 * @param {Array} examples - Example groups prop.
 * @returns {{ wrapper: import('@vue/test-utils').VueWrapper, writeText: import('vitest').Mock }}
 */
const mountBlock = (examples = multiExamples) => {
  const writeText = vi.fn().mockResolvedValue();
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  const wrapper = mount(DocsCodeblock, {
    props: { examples },
    global: { plugins: [vuetify()] },
  });
  return { wrapper, writeText };
};

describe('docs.codeblock.component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders language tabs for a multi-language example', () => {
    const { wrapper } = mountBlock();
    expect(wrapper.find('[data-test="docs-codeblock-tabs"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-codeblock-tab-bash"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="docs-codeblock-tab-javascript"]').exists()).toBe(true);
  });

  it('degrades to a single block (no tabs) when only one language is present', () => {
    const { wrapper } = mountBlock(singleExample);
    expect(wrapper.find('[data-test="docs-codeblock-tabs"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="docs-codeblock-lang"]').exists()).toBe(true);
    // friendly label for bash → "cURL"
    expect(wrapper.find('[data-test="docs-codeblock-lang"]').text()).toBe('cURL');
  });

  it('shows one copy button and no key button, even when logged in', async () => {
    const auth = useAuthStore();
    auth.cookieExpire = 12345; // isLoggedIn getter → true
    const { wrapper } = mountBlock();
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('[data-test="docs-codeblock-copy"]')).toHaveLength(1);
    expect(wrapper.find('[data-test="docs-codeblock-copy-key"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Copy with my key');
  });

  it('copies the placeholder verbatim and keeps it in the rendered snippet', async () => {
    const { wrapper, writeText } = mountBlock();
    await wrapper.find('[data-test="docs-codeblock-copy"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(writeText).toHaveBeenCalledWith(CURL);
    expect(wrapper.vm.copied).toBe(true);
    expect(wrapper.find('[data-test="docs-codeblock-code"]').text()).toContain(API_KEY_PLACEHOLDER);
  });

  it('switches the rendered snippet when a different language tab is active', async () => {
    const { wrapper } = mountBlock();
    // default tab → bash/curl
    expect(wrapper.find('[data-test="docs-codeblock-code"]').text()).toContain('curl ');
    // activate the Node tab
    wrapper.vm.active = 1;
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="docs-codeblock-code"]').text()).toContain('fetch(');
  });

  it('does not flash success feedback when the clipboard API is unavailable', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    const wrapper = mount(DocsCodeblock, {
      props: { examples: multiExamples },
      global: { plugins: [vuetify()] },
    });
    await wrapper.find('[data-test="docs-codeblock-copy"]').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.copied).toBe(false);
  });
});
