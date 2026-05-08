import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { describe, it, expect, vi } from 'vitest';
import HomeBlurBackgroundComponent from '../components/utils/home.blur.background.component.vue';

// ─── Mock theme helpers ──────────────────────────────────────────────────────

vi.mock('../../../lib/helpers/theme', () => ({
  lightenColor: (color) => color,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const vuetify = createVuetify({ components, directives });

/**
 * @param {Object} [props]
 * @param {string} [slotContent]
 * @returns {import('@vue/test-utils').VueWrapper}
 */
function mountComponent(props = {}, slotContent = '<div>content</div>') {
  return mount(HomeBlurBackgroundComponent, {
    props,
    slots: { default: slotContent },
    global: { plugins: [vuetify] },
  });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('HomeBlurBackgroundComponent', () => {
  it('renders slot content inside .blur-content', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.blur-content').exists()).toBe(true);
    expect(wrapper.find('.blur-content').text()).toBeTruthy();
  });

  it('applies no-margin class when noMargin prop is true', () => {
    const wrapper = mountComponent({ noMargin: true });
    expect(wrapper.find('.blur-background').classes()).toContain('no-margin');
  });

  it('does not apply no-margin class by default', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.blur-background').classes()).not.toContain('no-margin');
  });

  it('renders with auto height when fitContent prop is true — backgroundHeight returns auto', () => {
    const wrapper = mountComponent(
      { fitContent: true },
      '<div style="height: 1500px">tall content</div>',
    );
    // v-bind() in scoped CSS renders as a CSS custom property on the element, not as
    // an inline style attribute — check the computed value via the component instance.
    expect(wrapper.vm.backgroundHeight).toBe('auto');
  });

  it('fitContent defaults to false — backgroundHeight returns a vh value', () => {
    const wrapper = mountComponent();
    // Without fitContent, backgroundHeight should be a vh-based string (not 'auto')
    const height = wrapper.vm.backgroundHeight;
    expect(height).not.toBe('auto');
    expect(height).toMatch(/vh/);
  });

  it('renders all 5 halo elements', () => {
    const wrapper = mountComponent();
    for (let i = 1; i <= 5; i++) {
      expect(wrapper.find(`.halo-${i}`).exists()).toBe(true);
    }
  });
});
