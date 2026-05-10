import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for errorTracker helper.
 *
 * Mock strategy:
 * - vi.mock factories must not reference outer variables (Vitest hoists them).
 * - Config is mocked to return a shared mutable object. We import the config
 *   module to get the same reference that errorTracker.js holds, then mutate
 *   it per-test.
 * - posthog-js is mocked with vi.fn() inline.
 *
 * Tests cover:
 *   1. No PostHog configured → silent no-op
 *   2. PostHog with errorTracking=true → PostHog called
 *   3. PostHog key but errorTracking=false (default-safe) → no-op
 *   4. PostHog key with errorTracking='true' (Docker string) → PostHog called
 *   5. Tracker failure isolation — never rethrows
 *   6. Non-Error reason normalization
 */

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

// Config mock — returns a plain mutable object. No outer variable reference
// allowed in the factory due to hoisting. We retrieve the reference after
// import via config module.
vi.mock('../../../config/index.js', () => ({
  default: { analytics: { posthog: {} } },
}));

// Import after mocks (Vitest hoists vi.mock calls before static imports)
import posthog from 'posthog-js';
import config from '../../../config/index.js';
import { captureException } from '../errorTracker.js';

describe('errorTracker helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset analytics config to safe defaults before each test
    config.analytics = { posthog: {} };
  });

  describe('no trackers configured', () => {
    it('should be a silent no-op when posthog has no key', () => {
      captureException(new Error('no trackers'));

      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should be a silent no-op when posthog.key is absent', () => {
      config.analytics = { posthog: {} };

      captureException(new Error('empty config'));

      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('posthog with errorTracking=true (boolean)', () => {
    it('should call posthog.capture with $exception event', () => {
      config.analytics = {
        posthog: { key: 'ph_test_key', errorTracking: true },
      };

      const err = new Error('posthog only test');
      captureException(err, { userId: 'user-2' });

      expect(posthog.capture).toHaveBeenCalledTimes(1);
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: 'posthog only test',
        $exception_type: 'Error',
        userId: 'user-2',
      }));
    });
  });

  describe('default-safe: posthog key without errorTracking', () => {
    it('should NOT call posthog when key is set but errorTracking is false', () => {
      config.analytics = {
        posthog: { key: 'ph_test_key', errorTracking: false },
      };

      captureException(new Error('should not track'));

      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should NOT call posthog when key is set but errorTracking is missing', () => {
      config.analytics = {
        posthog: { key: 'ph_test_key' },
      };

      captureException(new Error('no errorTracking key'));

      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('docker string normalization: errorTracking="true"', () => {
    it('should call posthog when errorTracking is the string "true" (from Docker ARG)', () => {
      config.analytics = {
        posthog: { key: 'ph_test_key', errorTracking: 'true' },
      };

      const err = new Error('docker string test');
      captureException(err);

      expect(posthog.capture).toHaveBeenCalledTimes(1);
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: 'docker string test',
      }));
    });
  });

  describe('tracker failure isolation', () => {
    it('should never rethrow when PostHog throws', () => {
      config.analytics = {
        posthog: { key: 'ph_test_key', errorTracking: true },
      };
      posthog.capture.mockImplementationOnce(() => { throw new Error('posthog down'); });

      expect(() => captureException(new Error('boom'))).not.toThrow();
    });
  });

  describe('non-Error reason normalization', () => {
    beforeEach(() => {
      config.analytics = {
        posthog: { key: 'ph_test_key', errorTracking: true },
      };
    });

    it('should normalise a string reason into $exception_message', () => {
      captureException('plain string rejection');
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: 'plain string rejection',
        $exception_type: 'string',
        $exception_stack: undefined,
      }));
    });

    it('should fall back to "Unknown error" for null/undefined reason', () => {
      captureException(null);
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: 'Unknown error',
        $exception_type: 'Non-Error',
      }));
    });

    it('should tag plain object reasons as Non-Error', () => {
      captureException({ weird: true });
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_type: 'Non-Error',
      }));
    });

    it('should tag primitive number reason with its typeof', () => {
      captureException(42);
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: '42',
        $exception_type: 'number',
      }));
    });
  });
});
