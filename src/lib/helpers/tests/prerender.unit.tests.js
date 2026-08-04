import { describe, it, expect, afterEach } from 'vitest';
import { isPrerenderCrawl } from '../prerender';

describe('isPrerenderCrawl Helper', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
  });

  it('returns true when the UA contains HeadlessChrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
      configurable: true,
    });
    expect(isPrerenderCrawl()).toBe(true);
  });

  it('returns false for a normal browser UA', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      configurable: true,
    });
    expect(isPrerenderCrawl()).toBe(false);
  });

  it('returns false when navigator is undefined (SSR)', () => {
    const originalNavigator = globalThis.navigator;
    globalThis.navigator = undefined;
    try {
      expect(isPrerenderCrawl()).toBe(false);
    } finally {
      globalThis.navigator = originalNavigator;
    }
  });

  it('returns false when userAgent is empty', () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true });
    expect(isPrerenderCrawl()).toBe(false);
  });
});
