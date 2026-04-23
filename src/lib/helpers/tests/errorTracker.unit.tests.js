import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for errorTracker helper.
 *
 * Mock strategy:
 * - vi.mock factories must not reference outer variables (Vitest hoists them).
 * - Config is mocked to return a shared mutable object. We import the config
 *   module to get the same reference that errorTracker.js holds, then mutate
 *   it per-test.
 * - @sentry/vue and posthog-js are mocked with vi.fn() inline.
 *
 * Tests cover:
 *   1. No trackers configured → silent no-op
 *   2. Sentry only (dsn set, no posthog key) → only Sentry called
 *   3. PostHog only with errorTracking=true → only PostHog called
 *   4. PostHog key but errorTracking=false (default-safe) → no-op
 *   5. PostHog key with errorTracking='true' (Docker string) → PostHog called
 *   6. Both trackers active → both called
 */

vi.mock('@sentry/vue', () => ({
  captureException: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

// Config mock — returns a plain mutable object. No outer variable reference
// allowed in the factory due to hoisting. We retrieve the reference after
// import via config module.
vi.mock('../../../config/index.js', () => ({
  default: { analytics: { sentry: {}, posthog: {} } },
}));

// Import after mocks (Vitest hoists vi.mock calls before static imports)
import * as Sentry from '@sentry/vue';
import posthog from 'posthog-js';
import config from '../../../config/index.js';
import { captureException } from '../errorTracker.js';

describe('errorTracker helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset analytics config to safe defaults before each test
    config.analytics = { sentry: {}, posthog: {} };
  });

  describe('no trackers configured', () => {
    it('should be a silent no-op when sentry has no dsn and posthog has no key', () => {
      captureException(new Error('no trackers'));

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should be a silent no-op when sentry.dsn is empty and posthog.key is absent', () => {
      config.analytics = {
        sentry: { dsn: '', enabled: false },
        posthog: {},
      };

      captureException(new Error('empty config'));

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('sentry only', () => {
    it('should call Sentry.captureException and NOT posthog when only sentry.dsn is set', () => {
      config.analytics = {
        sentry: { dsn: 'https://fake@sentry.io/1', enabled: true },
        posthog: {},
      };

      const err = new Error('sentry only test');
      captureException(err, { userId: 'user-1' });

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(err, { extra: { userId: 'user-1' } });
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should NOT call Sentry when enabled is false', () => {
      config.analytics = {
        sentry: { dsn: 'https://fake@sentry.io/2', enabled: false },
        posthog: {},
      };

      captureException(new Error('disabled sentry'));

      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('posthog only with errorTracking=true (boolean)', () => {
    it('should call posthog.capture with $exception event and NOT Sentry', () => {
      config.analytics = {
        sentry: {},
        posthog: { key: 'ph_test_key', errorTracking: true },
      };

      const err = new Error('posthog only test');
      captureException(err, { userId: 'user-2' });

      expect(Sentry.captureException).not.toHaveBeenCalled();
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
        sentry: {},
        posthog: { key: 'ph_test_key', errorTracking: false },
      };

      captureException(new Error('should not track'));

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('should NOT call posthog when key is set but errorTracking is missing', () => {
      config.analytics = {
        sentry: {},
        posthog: { key: 'ph_test_key' },
      };

      captureException(new Error('no errorTracking key'));

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(posthog.capture).not.toHaveBeenCalled();
    });
  });

  describe('docker string normalization: errorTracking="true"', () => {
    it('should call posthog when errorTracking is the string "true" (from Docker ARG)', () => {
      config.analytics = {
        sentry: {},
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

  describe('both trackers active', () => {
    it('should call both Sentry and PostHog when both are fully configured', () => {
      config.analytics = {
        sentry: { dsn: 'https://fake@sentry.io/3', enabled: true },
        posthog: { key: 'ph_test_key', errorTracking: true },
      };

      const err = new Error('both trackers test');
      captureException(err, { requestId: 'req-1' });

      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      expect(Sentry.captureException).toHaveBeenCalledWith(err, { extra: { requestId: 'req-1' } });
      expect(posthog.capture).toHaveBeenCalledTimes(1);
      expect(posthog.capture).toHaveBeenCalledWith('$exception', expect.objectContaining({
        $exception_message: 'both trackers test',
        requestId: 'req-1',
      }));
    });
  });
});
