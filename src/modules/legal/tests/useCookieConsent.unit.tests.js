import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useCookieConsent, COOKIE_CONSENT_LS_KEY, CONSENT_VERSION } from '../composables/useCookieConsent';

const posthogMock = () => ({
  set_config: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
  capture: vi.fn(),
});

const mountComposable = (posthog = posthogMock()) => {
  let api;
  const Comp = defineComponent({
    setup() { api = useCookieConsent(); return {}; },
    template: '<div />',
  });
  const wrapper = mount(Comp, {
    global: { config: { globalProperties: { $posthog: posthog } } },
  });
  return { api, wrapper, posthog };
};

describe('useCookieConsent — storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('reports consentNeeded=true when localStorage is empty', () => {
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
    expect(api.consent.value).toBe(null);
  });

  it('reads stored valid consent (analytics:true) and reports consentNeeded=false', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(false);
    expect(api.consent.value).toEqual({ analytics: true });
  });

  it('treats expired consent as missing (re-prompts)', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2024-01-01T00:00:00.000Z', expiresAt: past, analytics: true }),
    );
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
  });

  it('treats version mismatch as missing (re-prompts)', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: 999, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
  });

  it('treats malformed JSON as missing (re-prompts, no throw)', () => {
    localStorage.setItem(COOKIE_CONSENT_LS_KEY, '{not-json');
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
  });
});
