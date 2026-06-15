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

  it('hides "Copy with my key" when anonymous, shows it when logged in', async () => {
    const { wrapper } = mountBlock();
    // anon by default (no cookieExpire)
    expect(wrapper.find('[data-test="docs-codeblock-copy-key"]').exists()).toBe(false);

    const auth = useAuthStore();
    auth.cookieExpire = 12345; // isLoggedIn getter → true
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="docs-codeblock-copy-key"]').exists()).toBe(true);
  });

  it('copies the STATIC placeholder verbatim when anonymous', async () => {
    const { wrapper, writeText } = mountBlock();
    await wrapper.find('[data-test="docs-codeblock-copy"]').trigger('click');
    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0][0];
    expect(copied).toContain(API_KEY_PLACEHOLDER);
  });

  it('copies the STATIC placeholder verbatim via "Copy with my key" (no key substitution in the stack)', async () => {
    const auth = useAuthStore();
    auth.cookieExpire = 12345;

    const { wrapper, writeText } = mountBlock();
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-test="docs-codeblock-copy-key"]').trigger('click');
    await wrapper.vm.$nextTick();

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0][0];
    // The placeholder is preserved — the stack never substitutes a real key.
    expect(copied).toContain(API_KEY_PLACEHOLDER);
  });

  it('NEVER injects a real key into the rendered HTML (placeholder stays literal)', async () => {
    const auth = useAuthStore();
    auth.cookieExpire = 12345;

    const { wrapper } = mountBlock();
    await wrapper.vm.$nextTick();

    // Rendered DOM shows the static placeholder.
    expect(wrapper.find('[data-test="docs-codeblock-code"]').text()).toContain(API_KEY_PLACEHOLDER);

    // After copy-with-my-key, the DOM STILL shows the static placeholder.
    await wrapper.find('[data-test="docs-codeblock-copy-key"]').trigger('click');
    await wrapper.vm.$nextTick();
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
    expect(wrapper.vm.copied).toBe(null);
  });
});
