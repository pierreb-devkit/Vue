import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureFirstTouch, getAttribution, ATTRIBUTION_SS_KEY } from '../attribution';

/**
 * Real jsdom Location, captured once at module load, before any mock is installed.
 * afterEach always restores to this — never to a previous mock — so the plain-object
 * mock never leaks into subsequent test files (mockLocation can be called more than
 * once per test, e.g. once in beforeEach and again in the test body).
 */
const realLocation = window.location;

/**
 * Swaps window.location for a plain object with the given overrides, mirroring
 * the pattern used in billing.store.unit.tests.js.
 * @param {object} overrides - Fields to override on window.location.
 * @returns {() => void} Restores the real window.location.
 */
const mockLocation = (overrides) => {
  delete window.location;
  window.location = {
    ...realLocation,
    origin: 'https://app.example.com',
    pathname: '/',
    search: '',
    ...overrides,
  };
  return () => { window.location = realLocation; };
};

/**
 * Sets document.referrer for a single test.
 * @param {string} value - Referrer URL to set.
 * @returns {void}
 */
const setReferrer = (value) => {
  Object.defineProperty(document, 'referrer', { value, configurable: true });
};

describe('attribution helper', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setReferrer('');
    mockLocation({});
  });

  afterEach(() => {
    window.location = realLocation;
  });

  describe('captureFirstTouch', () => {
    it('captures landingPath from pathname + search', () => {
      mockLocation({ pathname: '/pricing', search: '?plan=pro' });
      captureFirstTouch();
      expect(getAttribution()).toEqual({ landingPath: '/pricing?plan=pro' });
    });

    it('captures referrer when cross-origin', () => {
      mockLocation({ origin: 'https://app.example.com', pathname: '/', search: '' });
      setReferrer('https://google.com/search?q=test');
      captureFirstTouch();
      expect(getAttribution()).toMatchObject({ referrer: 'https://google.com/search?q=test' });
    });

    it('omits referrer when same-origin', () => {
      mockLocation({ origin: 'https://app.example.com', pathname: '/dashboard', search: '' });
      setReferrer('https://app.example.com/somewhere-else');
      captureFirstTouch();
      expect(getAttribution()).not.toHaveProperty('referrer');
    });

    it('omits referrer when empty', () => {
      setReferrer('');
      captureFirstTouch();
      expect(getAttribution()).not.toHaveProperty('referrer');
    });

    it('does not throw on a malformed referrer, and captures it as-is (not same-origin)', () => {
      setReferrer('not-a-valid-url');
      expect(() => captureFirstTouch()).not.toThrow();
      expect(getAttribution()).toMatchObject({ referrer: 'not-a-valid-url' });
    });

    it('parses utm_* query params into camelCase fields', () => {
      mockLocation({
        pathname: '/landing',
        search: '?utm_source=newsletter&utm_medium=email&utm_campaign=launch&utm_term=vue&utm_content=banner',
      });
      captureFirstTouch();
      expect(getAttribution()).toMatchObject({
        utmSource: 'newsletter',
        utmMedium: 'email',
        utmCampaign: 'launch',
        utmTerm: 'vue',
        utmContent: 'banner',
      });
    });

    it('omits utm fields absent from the query string', () => {
      mockLocation({ pathname: '/landing', search: '?utm_source=newsletter' });
      captureFirstTouch();
      const record = getAttribution();
      expect(record.utmSource).toBe('newsletter');
      expect(record).not.toHaveProperty('utmMedium');
      expect(record).not.toHaveProperty('utmCampaign');
    });

    it('trims and caps referrer / landingPath at 2048 chars', () => {
      const longSuffix = 'a'.repeat(3000);
      mockLocation({ pathname: `/${longSuffix}`, search: '' });
      setReferrer(`https://google.com/${longSuffix}`);
      captureFirstTouch();
      const record = getAttribution();
      expect(record.landingPath.length).toBe(2048);
      expect(record.referrer.length).toBe(2048);
    });

    it('trims and caps utm fields at 256 chars', () => {
      const longUtm = 'b'.repeat(500);
      mockLocation({ pathname: '/landing', search: `?utm_source=${longUtm}` });
      captureFirstTouch();
      expect(getAttribution().utmSource.length).toBe(256);
    });

    it('is write-once: a second call does not overwrite the first record', () => {
      mockLocation({ pathname: '/first-page', search: '' });
      captureFirstTouch();
      mockLocation({ pathname: '/second-page', search: '' });
      captureFirstTouch();
      expect(getAttribution()).toEqual({ landingPath: '/first-page' });
    });

    it('is a silent no-op when sessionStorage.getItem throws (private mode)', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(() => captureFirstTouch()).not.toThrow();
      getItemSpy.mockRestore();
    });

    it('is a silent no-op when sessionStorage.setItem throws (private mode / quota)', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      mockLocation({ pathname: '/pricing', search: '' });
      expect(() => captureFirstTouch()).not.toThrow();
      setItemSpy.mockRestore();
    });

    it('is a no-op when window is unavailable (SSR)', () => {
      const originalWindow = globalThis.window;
      globalThis.window = undefined;
      expect(() => captureFirstTouch()).not.toThrow();
      globalThis.window = originalWindow;
    });
  });

  describe('getAttribution', () => {
    it('returns null when nothing was captured', () => {
      expect(getAttribution()).toBe(null);
    });

    it('returns the stored record', () => {
      sessionStorage.setItem(ATTRIBUTION_SS_KEY, JSON.stringify({ landingPath: '/x' }));
      expect(getAttribution()).toEqual({ landingPath: '/x' });
    });

    it('returns null on malformed JSON (no throw)', () => {
      sessionStorage.setItem(ATTRIBUTION_SS_KEY, '{not-json');
      expect(() => getAttribution()).not.toThrow();
      expect(getAttribution()).toBe(null);
    });

    it('returns null when sessionStorage.getItem throws (private mode)', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(getAttribution()).toBe(null);
      getItemSpy.mockRestore();
    });

    it('drops unknown keys and non-string values, keeping valid whitelisted fields (tampered record)', () => {
      sessionStorage.setItem(ATTRIBUTION_SS_KEY, JSON.stringify({
        landingPath: '/pricing',
        utmSource: 'newsletter',
        utmMedium: 12345,
        injectedByExtension: 'malicious-value',
      }));
      expect(getAttribution()).toEqual({ landingPath: '/pricing', utmSource: 'newsletter' });
    });

    it('returns null when the record has no valid whitelisted string fields (fully-bogus record)', () => {
      sessionStorage.setItem(ATTRIBUTION_SS_KEY, JSON.stringify({
        injectedByExtension: 'malicious-value',
        somethingElse: 42,
      }));
      expect(getAttribution()).toBe(null);
    });
  });
});
