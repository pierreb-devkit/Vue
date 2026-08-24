import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useCookieConsent, COOKIE_CONSENT_LS_KEY, CONSENT_VERSION, __resetCookieConsentForTests } from '../composables/useCookieConsent';

/**
 * Returns a fresh PostHog mock with all tracked methods.
 * @param {object} [config] - Value exposed as the mock's `.config` property (mirrors the real
 *   posthog-js instance's resolved init config, e.g. `{ cookieless_mode: 'on_reject' }`).
 * @returns {{ set_config: vi.Mock, opt_in_capturing: vi.Mock, opt_out_capturing: vi.Mock, reset: vi.Mock, capture: vi.Mock, config: object }}
 */
const posthogMock = (config = {}) => ({
  set_config: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
  capture: vi.fn(),
  config,
});

/**
 * Mounts a minimal component that calls useCookieConsent in setup and
 * returns the composable API alongside the wrapper and posthog mock.
 * @param {object} [posthog] - PostHog mock to inject as $posthog globalProperty
 * @returns {{ api: object, wrapper: import('@vue/test-utils').VueWrapper, posthog: object }}
 */
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
    __resetCookieConsentForTests();
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
    __resetCookieConsentForTests();
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
    __resetCookieConsentForTests();
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
  });

  it('treats version mismatch as missing (re-prompts)', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: 999, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    __resetCookieConsentForTests();
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
  });

  it('treats malformed JSON as missing (re-prompts, no throw)', () => {
    localStorage.setItem(COOKIE_CONSENT_LS_KEY, '{not-json');
    __resetCookieConsentForTests();
    const { api } = mountComposable();
    expect(api.consentNeeded.value).toBe(true);
  });
});

describe('useCookieConsent — actions', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetCookieConsentForTests();
  });

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
    expect(posthog.capture).toHaveBeenCalledWith('consent_choice', { accepted: true });
  });

  it('reject: writes LS, sets consent, downgrades persistence to memory BEFORE opt_out, then reset', () => {
    const { api, posthog } = mountComposable();
    api.reject();
    expect(api.consentNeeded.value).toBe(false);
    expect(api.consent.value).toEqual({ analytics: false });
    const stored = JSON.parse(localStorage.getItem(COOKIE_CONSENT_LS_KEY));
    expect(stored.analytics).toBe(false);
    // A prior accept() may have upgraded persistence; reject must drop it back
    // to memory before opting out so no anonymous id can be written to disk.
    expect(posthog.set_config).toHaveBeenCalledExactlyOnceWith({ persistence: 'memory' });
    const setConfigOrder = posthog.set_config.mock.invocationCallOrder[0];
    const optOutOrder = posthog.opt_out_capturing.mock.invocationCallOrder[0];
    expect(setConfigOrder).toBeLessThan(optOutOrder);
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
  });

  it('reject: with cookieless_mode disabled (default), does NOT emit consent_choice (blocked by opt_out_capturing_by_default, #4520)', () => {
    const { api, posthog } = mountComposable();
    api.reject();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('reject: with cookieless_mode enabled, emits consent_choice{accepted:false} anonymously via the cookieless path (#4587)', () => {
    const { api, posthog } = mountComposable(posthogMock({ cookieless_mode: 'on_reject' }));
    api.reject();
    expect(api.consentNeeded.value).toBe(false);
    expect(api.consent.value).toEqual({ analytics: false });
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledOnce();
    expect(posthog.capture).toHaveBeenCalledWith('consent_choice', { accepted: false });
    expect(posthog.reset).toHaveBeenCalledOnce();
    // No opt-in on the decline path; the only persistence change allowed is
    // the downgrade back to memory (never an upgrade to persistent storage).
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.set_config).toHaveBeenCalledExactlyOnceWith({ persistence: 'memory' });
  });

  it('reject: with cookieless_mode enabled, captures BEFORE reset (ordering is load-bearing — reset() would overwrite the sentinel identity)', () => {
    const { api, posthog } = mountComposable(posthogMock({ cookieless_mode: 'on_reject' }));
    api.reject();
    const captureOrder = posthog.capture.mock.invocationCallOrder[0];
    const resetOrder = posthog.reset.mock.invocationCallOrder[0];
    expect(captureOrder).toBeLessThan(resetOrder);
  });

  it('reject: with cookieless_mode set to a value other than on_reject, does NOT emit consent_choice', () => {
    const { api, posthog } = mountComposable(posthogMock({ cookieless_mode: 'always' }));
    api.reject();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('reopenSettings: flips consentNeeded to true without touching posthog or LS', () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    __resetCookieConsentForTests();
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
    __resetCookieConsentForTests();
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
    __resetCookieConsentForTests();
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

  it('reopenSettings in one instance updates consentNeeded in a second instance (singleton state)', () => {
    // Pre-fill LS so first mount has consent
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(
      COOKIE_CONSENT_LS_KEY,
      JSON.stringify({ version: CONSENT_VERSION, timestamp: '2026-05-07T00:00:00.000Z', expiresAt: future, analytics: true }),
    );
    __resetCookieConsentForTests();
    const { api: api1 } = mountComposable();
    const { api: api2 } = mountComposable();
    expect(api1.consentNeeded.value).toBe(false);
    expect(api2.consentNeeded.value).toBe(false);
    api1.reopenSettings();
    expect(api1.consentNeeded.value).toBe(true);
    expect(api2.consentNeeded.value).toBe(true);
  });
});
