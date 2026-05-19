import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { useFooterExtras } from '@/lib/composables/useFooterExtras';

vi.mock('vuetify', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTheme: () => ({
      name: 'light',
      current: { colors: { onSurface: '#111111', background: '#ffffff', surface: '#fafafa' } },
    }),
  };
});

import CoreFooter from '../core.footer.component.vue';

/**
 * Returns a fresh Vuetify instance for each test.
 * @returns {import('vuetify').Vuetify}
 */
const vuetify = () => createVuetify({ components, directives });

const baseConfig = () => ({
  footer: { links: [{ title: 'Help', items: [{ label: 'Docs', icon: 'fa-solid fa-book', url: '/docs' }] }] },
  vuetify: { theme: { flat: false } },
});

/**
 * Mounts CoreFooter with the given config, simulating an active footer route.
 * @param {object} config
 * @returns {import('@vue/test-utils').VueWrapper}
 */
const mountFooter = (config) =>
  mount(CoreFooter, {
    global: {
      plugins: [vuetify()],
      mocks: {
        config,
        $route: { path: '/', meta: { footer: true } },
        $router: { push: vi.fn() },
      },
      stubs: {
        RouterLink: { template: '<a><slot /></a>', props: ['to'] },
        VFooter: { template: '<div class="v-footer-stub"><slot /></div>' },
      },
    },
    props: {
      links: config.footer?.links || [],
    },
  });

describe('core.footer.component — registry extras', () => {
  beforeEach(() => {
    // Clear any extras registered by previous tests
    const { extras } = useFooterExtras();
    extras.value = [];
  });

  afterEach(() => {
    const { extras } = useFooterExtras();
    extras.value = [];
  });

  it('renders only prop links when extras registry is empty', () => {
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).toContain('Help');
    expect(wrapper.text()).toContain('Docs');
  });

  it('renders an extra section injected via useFooterExtras().register()', () => {
    const { register } = useFooterExtras();
    register('test-module', {
      title: 'Test Section',
      items: [{ label: 'Item One', icon: 'fa-solid fa-star', url: '/one' }],
    });
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).toContain('Test Section');
    expect(wrapper.text()).toContain('Item One');
  });

  it('renders multiple extra sections in registration order', () => {
    const { register } = useFooterExtras();
    register('section-a', { title: 'Alpha', items: [{ label: 'A', icon: 'fa-solid fa-a', url: '/a' }] });
    register('section-b', { title: 'Beta', items: [{ label: 'B', icon: 'fa-solid fa-b', url: '/b' }] });
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).toContain('Alpha');
    expect(wrapper.text()).toContain('Beta');
  });

  it('does not render an extra section after unregister()', () => {
    const { register, unregister } = useFooterExtras();
    register('removable', { title: 'Removable', items: [{ label: 'Gone', icon: 'fa-solid fa-trash', url: '/gone' }] });
    unregister('removable');
    const wrapper = mountFooter(baseConfig());
    expect(wrapper.text()).not.toContain('Removable');
  });

  it('merges registered extras into existing config-driven section by title (no duplicate column)', () => {
    const { register } = useFooterExtras();
    register('legal-module', {
      title: 'Legal',
      items: [{ label: 'Cookie settings', icon: 'fa-solid fa-cookie', onClick: vi.fn() }],
    });
    const wrapper = mountFooter({
      footer: {
        links: [
          {
            title: 'Legal',
            items: [
              { label: 'Terms of Service', icon: 'fa-solid fa-file-contract', url: '/terms' },
              { label: 'Privacy Policy', icon: 'fa-solid fa-shield-halved', url: '/privacy' },
            ],
          },
        ],
      },
      vuetify: { theme: { flat: false } },
      legal: {
        cookieConsent: { enabled: true, privacyPolicyPath: '/privacy' },
        pages: { enabled: false, routePrefix: '/legal', items: {} },
      },
    });
    const text = wrapper.text();
    expect(text).toContain('Terms of Service');
    expect(text).toContain('Privacy Policy');
    expect(text).toContain('Cookie settings');
    // Single "Legal" column heading, not two
    const legalHeadings = wrapper.findAll('.v-card-title').filter((c) => c.text().trim() === 'Legal');
    expect(legalHeadings.length).toBe(1);
  });

  it('calls item.onClick when item has an onClick callback', async () => {
    const { register } = useFooterExtras();
    const onClick = vi.fn();
    register('clickable', {
      title: 'Clickable',
      items: [{ label: 'Action', icon: 'fa-solid fa-play', onClick }],
    });
    const wrapper = mountFooter(baseConfig());
    const listItems = wrapper.findAllComponents({ name: 'VListItem' });
    const actionItem = listItems.find((li) => li.text().includes('Action'));
    expect(actionItem).toBeTruthy();
    await actionItem.trigger('click');
    expect(onClick).toHaveBeenCalledOnce();
  });
});
