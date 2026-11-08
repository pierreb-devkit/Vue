import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { useDocsGlass } from '../composables/useDocsGlass';

/**
 * Run the composable inside a component, with both themes.
 * @param {number} [opacity] - Glass opacity
 * @returns {{ glass: import('vue').ComputedRef<Object>, vuetify: Object }} The style and the plugin
 */
const setup = (opacity) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: 'light',
      themes: {
        light: { dark: false, colors: { surface: '#ffffff' } },
        dark: { dark: true, colors: { surface: '#1b2838' } },
      },
    },
  });
  let glass;
  mount(
    {
      setup() {
        glass = useDocsGlass(opacity);
        return () => null;
      },
    },
    { global: { plugins: [vuetify] } },
  );
  return { glass, vuetify };
};

describe('useDocsGlass', () => {
  it('uses the surface colour of the current theme and follows a theme change', async () => {
    const { glass, vuetify } = setup(0.5);
    expect(glass.value.background).toBe('rgba(255,255,255, 0.50)');
    vuetify.theme.global.name.value = 'dark';
    await nextTick();
    expect(glass.value.background).toBe('rgba(27,40,56, 0.50)');
  });

  it('sets the blur with the WebKit prefix too', () => {
    const { glass } = setup();
    expect(glass.value['-webkit-backdrop-filter']).toContain('blur(');
    expect(glass.value['backdrop-filter']).toContain('blur(');
  });
});
