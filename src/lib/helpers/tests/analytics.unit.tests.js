import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCapture = vi.fn();

vi.mock('posthog-js', () => ({
  default: {
    __loaded: false,
    capture: (...args) => mockCapture(...args),
  },
}));

import posthog from 'posthog-js';
import { isPosthogReady, capture, capturePageview } from '../analytics';

describe('analytics helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthog.__loaded = false;
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

    it('should fall back to route name when meta.title is absent', () => {
      posthog.__loaded = true;
      capturePageview({ fullPath: '/tasks', meta: {}, name: 'tasks' });
      expect(mockCapture).toHaveBeenCalledWith('$pageview', {
        $current_url: '/tasks',
        title: 'tasks',
      });
    });
  });
});
