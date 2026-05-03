import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import { useCurrencyFormat } from '../composables/billing.useCurrencyFormat.js';

/**
 * Mount a wrapper component that calls useCurrencyFormat and exposes its return value.
 * @param {string} locale - Locale to use (e.g. 'en', 'fr')
 * @returns {{ result: { formatPrice: Function }, wrapper: import('@vue/test-utils').VueWrapper }}
 */
function mountComposable(locale = 'en') {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
  });

  let result;
  const Wrapper = defineComponent({
    setup() {
      result = useCurrencyFormat();
      return {};
    },
    template: '<div />',
  });

  const wrapper = mount(Wrapper, {
    global: { plugins: [i18n] },
  });

  return { result, wrapper };
}

describe('useCurrencyFormat', () => {
  it('formatPrice formats amount as USD in en locale', () => {
    const { result } = mountComposable('en');
    expect(result.formatPrice(1299)).toBe('$1,299.00');
  });

  it('formatPrice formats amount as USD in fr locale', () => {
    const { result } = mountComposable('fr');
    const formatted = result.formatPrice(1299);
    // FR locale formats USD as "1 299,00 $US" (or similar with narrow no-break space)
    // Normalize whitespace for assertion robustness
    const normalized = formatted.replace(/\s/g, ' ');
    expect(normalized).toMatch(/1.299,00/);
    expect(normalized).toMatch(/\$US/i);
  });

  it('formatPrice formats zero correctly in en locale', () => {
    const { result } = mountComposable('en');
    expect(result.formatPrice(0)).toBe('$0.00');
  });

  it('formatPrice formats small amount in en locale', () => {
    const { result } = mountComposable('en');
    expect(result.formatPrice(9)).toBe('$9.00');
  });

  it('formatPrice hardcodes currency to USD regardless of locale', () => {
    const { result: enResult } = mountComposable('en');
    const { result: frResult } = mountComposable('fr');
    // Both should format as USD (not EUR or other)
    expect(enResult.formatPrice(100)).toContain('$');
    expect(frResult.formatPrice(100)).toContain('$US');
  });

  it('formatPrice reacts to locale ref changes', async () => {
    const i18n = createI18n({
      legacy: false,
      globalInjection: true,
      locale: 'en',
      fallbackLocale: 'en',
      messages: { en: {}, fr: {} },
    });

    let result;
    const Wrapper = defineComponent({
      setup() {
        result = useCurrencyFormat();
        return {};
      },
      template: '<div />',
    });

    mount(Wrapper, { global: { plugins: [i18n] } });

    const enFormatted = result.formatPrice(1299);
    expect(enFormatted).toBe('$1,299.00');

    i18n.global.locale.value = 'fr';
    const frFormatted = result.formatPrice(1299);
    const normalized = frFormatted.replace(/\s/g, ' ');
    expect(normalized).toMatch(/1.299,00/);
  });
});
