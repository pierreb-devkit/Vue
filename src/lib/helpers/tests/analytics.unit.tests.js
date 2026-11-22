import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCapture = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    __loaded: false,
    capture: (...args) => mockCapture(...args),
    identify: (...args) => mockIdentify(...args),
    reset: (...args) => mockReset(...args),
  },
}));

import posthog from 'posthog-js';
import {
  isPosthogReady, capture, capturePageview, identify, reset, stripSensitiveParams, stripSensitiveEventUrls,
} from '../analytics';

describe('analytics helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthog.__loaded = false;
    mockIdentify.mockClear();
    mockReset.mockClear();
  });

  describe('isPosthogReady', () => {
    it('should return false when posthog is not loaded', () => {
      expect(isPosthogReady()).toBe(false);
    });

    it('should return true when posthog is loaded', () => {
      posthog.__loaded = true;
      expect(isPosthogReady()).toBe(true);
    });
  });

  describe('capture', () => {
    it('should not call posthog.capture when not loaded', () => {
      capture('test_event', { key: 'value' });
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it('should call posthog.capture when loaded', () => {
      posthog.__loaded = true;
      capture('test_event', { key: 'value' });
      expect(mockCapture).toHaveBeenCalledWith('test_event', { key: 'value' });
    });

    it('should pass empty properties by default', () => {
      posthog.__loaded = true;
      capture('test_event');
      expect(mockCapture).toHaveBeenCalledWith('test_event', {});
    });
  });

  describe('capturePageview', () => {
    it('should not capture when posthog is not loaded', () => {
      capturePageview({ fullPath: '/test', meta: { title: 'Test' }, name: 'test' });
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it('should capture $pageview with route title from meta', () => {
      posthog.__loaded = true;
      capturePageview({ fullPath: '/dashboard', meta: { title: 'Dashboard' }, name: 'dashboard' });
      expect(mockCapture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/dashboard',
        title: 'Dashboard',
      });
    });

    it('strips the OAuth request, code and state from the URL sent', () => {
      posthog.__loaded = true;
      capturePageview({ fullPath: '/connect?req=signed.jwt.value&code=abc&state=xyz&tab=1', meta: { title: 'Connect an app' }, name: 'OAuth Consent' });
      expect(mockCapture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/connect?tab=1',
        title: 'Connect an app',
      });
    });

    it('should fall back to route name when meta.title is absent', () => {
      posthog.__loaded = true;
      capturePageview({ fullPath: '/tasks', meta: {}, name: 'tasks' });
      expect(mockCapture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/tasks',
        title: 'tasks',
      });
    });
  });

  describe('stripSensitiveParams', () => {
    it('drops the whole query of an unparseable url holding a credential', () => {
      const out = stripSensitiveParams('https://a b.com/x?req=TOKEN');
      expect(out).not.toContain('TOKEN');
      expect(out).toBe('https://a b.com/x');
    });

    it('leaves an unparseable url without a credential unchanged', () => {
      expect(stripSensitiveParams('https://a b.com/x?q=1')).toBe('https://a b.com/x?q=1');
    });

    it('returns a path without a query unchanged', () => {
      expect(stripSensitiveParams('/scraps')).toBe('/scraps');
    });

    it('returns a path with no sensitive param exactly as it came', () => {
      expect(stripSensitiveParams('/scraps?q=a%20b&page=2#top')).toBe('/scraps?q=a%20b&page=2#top');
    });

    it('drops req, code and state, keeps the rest and the hash', () => {
      expect(stripSensitiveParams('/token?code=c&state=s&next=1#h')).toBe('/token?next=1#h');
      expect(stripSensitiveParams('/connect?req=x')).toBe('/connect');
    });

    it('drops them inside the sign-in redirect param too', () => {
      const path = `/signin?redirect=${encodeURIComponent('/connect?req=signed.jwt')}`;
      const out = stripSensitiveParams(path);
      expect(out).not.toContain('signed.jwt');
      expect(new URL(out, 'https://x.invalid').searchParams.get('redirect')).toBe('/connect');
    });

    it('leaves a non-path redirect value alone', () => {
      expect(stripSensitiveParams('/signin?redirect=https://evil.example&code=1')).toBe('/signin?redirect=https%3A%2F%2Fevil.example');
    });

    it('passes a non-string through', () => {
      expect(stripSensitiveParams(undefined)).toBeUndefined();
    });

    it('cleans every repeated redirect entry', () => {
      expect(stripSensitiveParams('/signin?redirect=%2Fsafe&redirect=%2Fconnect%3Freq%3DTOKEN')).toBe('/signin?redirect=%2Fsafe&redirect=%2Fconnect');
    });

    it('keeps the origin of a full URL', () => {
      expect(stripSensitiveParams('https://app.example.com/connect?req=TOKEN&tab=1#x')).toBe('https://app.example.com/connect?tab=1#x');
    });
  });

  describe('stripSensitiveEventUrls', () => {
    it('cleans every URL an SDK event carries, $set_once included', () => {
      const signin = `https://app.example.com/signin?redirect=${encodeURIComponent('/connect?req=TOKEN')}`;
      const event = {
        event: '$autocapture',
        properties: {
          $current_url: 'https://app.example.com/connect?req=TOKEN',
          $session_entry_url: signin,
          $referrer: 'https://app.example.com/cb?code=TOKEN&state=TOKEN',
          $pathname: '/connect',
        },
        $set_once: { $initial_current_url: 'https://app.example.com/connect?req=TOKEN', $initial_referrer: '$direct' },
      };
      const out = stripSensitiveEventUrls(event);
      expect(JSON.stringify(out)).not.toContain('TOKEN');
      expect(out.properties.$current_url).toBe('https://app.example.com/connect');
      expect(out.properties.$pathname).toBe('/connect');
      expect(out.$set_once.$initial_referrer).toBe('$direct');
    });

    it('strips the token from an autocapture click on a sign-in link', () => {
      const href = '/signup?redirect=%2Fconnect%3Freq%3DTOKEN';
      const event = {
        event: '$autocapture',
        properties: {
          $session_entry_referrer: 'https://app.example.com/cb?code=TOKEN',
          $elements: [{ tag_name: 'a', attr__href: href }],
          $elements_chain: `a:attr__class="x"attr__href="${href}"href="${href}"nth-child="1";div:nth-child="2"`,
        },
      };
      const out = stripSensitiveEventUrls(event);
      expect(JSON.stringify(out)).not.toContain('TOKEN');
      expect(out.properties.$elements[0].attr__href).toBe('/signup?redirect=%2Fconnect');
      expect(out.properties.$elements_chain).toContain('attr__href="/signup?redirect=%2Fconnect"href="/signup?redirect=%2Fconnect"nth-child="1"');
    });

    it('cleans a $set_once nested in the event properties', () => {
      const out = stripSensitiveEventUrls({ properties: { $set_once: { $initial_current_url: 'https://a.com/p?req=TOKEN' } } });
      expect(out.properties.$set_once.$initial_current_url).toBe('https://a.com/p');
    });

    it('cleans an elements_chain href holding escaped quotes', () => {
      const out = stripSensitiveEventUrls({ properties: { $elements_chain: 'a:href="/connect?label=\\"x\\"&req=TOKEN"nth-child="1"' } });
      expect(out.properties.$elements_chain).not.toContain('TOKEN');
      expect(out.properties.$elements_chain).toContain('nth-child="1"');
    });

    it('cleans $external_click_url', () => {
      const out = stripSensitiveEventUrls({ properties: { $external_click_url: 'https://x.com/cb?code=TOKEN&a=1' } });
      expect(out.properties.$external_click_url).toBe('https://x.com/cb?a=1');
    });

    it('cleans $heatmap_data keys and merges collapsed ones', () => {
      const out = stripSensitiveEventUrls({
        properties: { $heatmap_data: { 'https://a.com/p?code=1': [{ x: 1 }], 'https://a.com/p?state=2': [{ x: 2 }], 'https://a.com/q?a=1': [] } },
      });
      expect(out.properties.$heatmap_data).toEqual({ 'https://a.com/p': [{ x: 1 }, { x: 2 }], 'https://a.com/q?a=1': [] });
    });

    it('leaves non-http urls untouched', () => {
      expect(stripSensitiveParams('mailto:a@b.com?subject=x&state=1')).toBe('mailto:a@b.com?subject=x&state=1');
      expect(stripSensitiveParams('/a?state=1&b=2')).toBe('/a?b=2');
    });

    it('passes an event without properties through', () => {
      expect(stripSensitiveEventUrls(null)).toBeNull();
      expect(stripSensitiveEventUrls({ event: 'x' })).toEqual({ event: 'x' });
    });
  });

  describe('identify', () => {
    it('should not call posthog.identify when posthog is not loaded', () => {
      identify('user-123', { email: 'test@test.com' });
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it('should not call posthog.identify when distinctId is falsy', () => {
      posthog.__loaded = true;
      identify('', { email: 'test@test.com' });
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it('should not call posthog.identify when distinctId is null', () => {
      posthog.__loaded = true;
      identify(null);
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it('should call posthog.identify with distinctId and properties when ready', () => {
      posthog.__loaded = true;
      identify('user-123', { email: 'test@test.com', plan: 'pro' });
      expect(mockIdentify).toHaveBeenCalledWith('user-123', { email: 'test@test.com', plan: 'pro' });
    });

    it('should call posthog.identify with empty properties by default', () => {
      posthog.__loaded = true;
      identify('user-123');
      expect(mockIdentify).toHaveBeenCalledWith('user-123', {});
    });
  });

  describe('reset', () => {
    it('should not call posthog.reset when posthog is not loaded', () => {
      reset();
      expect(mockReset).not.toHaveBeenCalled();
    });

    it('should call posthog.reset when posthog is loaded', () => {
      posthog.__loaded = true;
      reset();
      expect(mockReset).toHaveBeenCalledOnce();
    });
  });
});
