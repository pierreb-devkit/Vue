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

describe('useCookieConsent — actions', () => {
  beforeEach(() => { localStorage.clear(); });

  it('accept: writes LS, sets consent, calls posthog set_config + opt_in + capture', () => {
    const { api, posthog } = mountComposable();
    api.accept();
    expect(api.consentNeeded.value).toBe(false);
    expect(api.consent.value).toEqual({ analytics: true });
    const stored = JSON.parse(localStorage.getItem(COOKIE_CONSENT_LS_KEY));
    expect(stored.analytics).toBe(true);
    expect(stored.version).toBe(CONSENT_VERSION);
    expect(posthog.set_config).toHaveBeenCalledWith({ persistence: 'localStorage+cookie' });
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledWith('consent_given', { analytics: true });
  });

  it('reject: writes LS, sets consent, calls posthog opt_out + reset', () => {
    const { api, posthog } = mountComposable();
    api.reject();
    expect(api.consentNeeded.value).toBe(false);
    expect(api.consent.value).toEqual({ analytics: false });
    const stored = JSON.parse(localStorage.getItem(COOKIE_CONSENT_LS_KEY));
    expect(stored.analytics).toBe(false);
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
  });

  it('reopenSettings: flips consentNeeded to true without touching posthog or LS', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    const { api, posthog } = mountComposable();
    expect(api.consentNeeded.value).toBe(false);
    posthog.set_config.mockClear();
    posthog.opt_in_capturing.mockClear();
    api.reopenSettings();
    expect(api.consentNeeded.value).toBe(true);
    expect(posthog.set_config).not.toHaveBeenCalled();
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(localStorage.getItem(COOKIE_CONSENT_LS_KEY)).toBeTruthy();
  });

  it('on mount with prior accept: re-applies posthog opt_in (so banner-less reload still tracks)', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    const { posthog } = mountComposable();
    expect(posthog.set_config).toHaveBeenCalledWith({ persistence: 'localStorage+cookie' });
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
  });

  it('on mount with prior reject: does NOT call posthog opt_in (stays opt-out)', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: false }),
    );
    const { posthog } = mountComposable();
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.set_config).not.toHaveBeenCalled();
  });

  it('works without $posthog injected (no-op)', () => {
    let api;
    const Comp = defineComponent({
      setup() { api = useCookieConsent(); return {}; },
      template: '<div />',
    });
    mount(Comp, { global: { config: { globalProperties: {} } } });
    expect(() => api.accept()).not.toThrow();
    expect(() => api.reject()).not.toThrow();
  });
});
