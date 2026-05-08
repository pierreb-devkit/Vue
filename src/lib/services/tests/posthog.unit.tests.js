import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// posthog-js mock — must be hoisted before the service import.
// ---------------------------------------------------------------------------
vi.mock('posthog-js', () => {
  const instance = {
    __loaded: false,
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    capture: vi.fn(),
  };
  return { default: instance };
});

// import.meta.env stubs must be set before the module is first imported.
vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', '');
vi.stubEnv('DEVKIT_VUE_POSTHOG_HOST', '');

import posthog from 'posthog-js';
import {
  initPostHog,
  isReady,
  optInTracking,
  optOutTracking,
  identify,
  reset,
  capture,
  __resetPostHogServiceForTests,
} from '../posthog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reset the service module-scope `_initialized` flag between tests.
 * Resets both posthog.__loaded and the service internal flag.
 */
function resetServiceState() {
  posthog.__loaded = false;
  __resetPostHogServiceForTests();
  vi.clearAllMocks();
  // Re-stub envs to empty so each test controls its own setup
  vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', '');
  vi.stubEnv('DEVKIT_VUE_POSTHOG_HOST', '');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('posthog service', () => {
  beforeEach(() => {
    resetServiceState();
  });

  // -------------------------------------------------------------------------
  // initPostHog
  // -------------------------------------------------------------------------
  describe('initPostHog', () => {
    it('is a no-op and returns null when enabled is false', () => {
      vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', 'phc_testkey');
      const result = initPostHog({ enabled: false });
      expect(result).toBeNull();
      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('returns null when DEVKIT_VUE_POSTHOG_KEY is missing', () => {
      vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', '');
      const result = initPostHog({ enabled: true });
      expect(result).toBeNull();
      expect(posthog.init).not.toHaveBeenCalled();
    });

    it('initializes posthog when enabled and key is present', () => {
      vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', 'phc_testkey');
      vi.stubEnv('DEVKIT_VUE_POSTHOG_HOST', 'https://eu.i.posthog.com');

      const result = initPostHog({ enabled: true });

      expect(posthog.init).toHaveBeenCalledOnce();
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({
          api_host: 'https://eu.i.posthog.com',
          opt_out_capturing_by_default: true,
          disable_session_recording: true,
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          persistence: 'localStorage+cookie',
          person_profiles: 'identified_only',
        }),
      );
      expect(result).toBe(posthog);
    });

    it('uses the EU fallback host when DEVKIT_VUE_POSTHOG_HOST is not set', () => {
      vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', 'phc_testkey');
      vi.stubEnv('DEVKIT_VUE_POSTHOG_HOST', '');

      initPostHog({ enabled: true });

      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({ api_host: 'https://eu.i.posthog.com' }),
      );
    });

    it('is idempotent: second call does not re-init when posthog is already loaded', () => {
      vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', 'phc_testkey');

      // First call — simulate successful init by setting __loaded
      initPostHog({ enabled: true });
      posthog.__loaded = true;

      // Second call — should be skipped
      initPostHog({ enabled: true });

      expect(posthog.init).toHaveBeenCalledOnce();
    });

    it('enabled defaults to true when not specified', () => {
      vi.stubEnv('DEVKIT_VUE_POSTHOG_KEY', 'phc_testkey');

      initPostHog();

      expect(posthog.init).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // isReady
  // -------------------------------------------------------------------------
  describe('isReady', () => {
    it('returns false when posthog is not loaded', () => {
      posthog.__loaded = false;
      expect(isReady()).toBe(false);
    });

    it('returns true when posthog is loaded', () => {
      posthog.__loaded = true;
      expect(isReady()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // optInTracking — no-op guard
  // -------------------------------------------------------------------------
  describe('optInTracking', () => {
    it('is a no-op when posthog is not initialized', () => {
      posthog.__loaded = false;
      optInTracking();
      expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    });

    it('calls posthog.opt_in_capturing when initialized', () => {
      posthog.__loaded = true;
      optInTracking();
      expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // optOutTracking — no-op guard
  // -------------------------------------------------------------------------
  describe('optOutTracking', () => {
    it('is a no-op when posthog is not initialized', () => {
      posthog.__loaded = false;
      optOutTracking();
      expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
    });

    it('calls posthog.opt_out_capturing when initialized', () => {
      posthog.__loaded = true;
      optOutTracking();
      expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // identify — no-op guard
  // -------------------------------------------------------------------------
  describe('identify', () => {
    it('is a no-op when posthog is not initialized', () => {
      posthog.__loaded = false;
      identify('user-123', { email: 'test@example.com' });
      expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('calls posthog.identify with distinctId and properties when initialized', () => {
      posthog.__loaded = true;
      identify('user-123', { email: 'test@example.com', plan: 'pro' });
      expect(posthog.identify).toHaveBeenCalledOnce();
      expect(posthog.identify).toHaveBeenCalledWith('user-123', { email: 'test@example.com', plan: 'pro' });
    });

    it('defaults properties to empty object when not provided', () => {
      posthog.__loaded = true;
      identify('user-456');
      expect(posthog.identify).toHaveBeenCalledWith('user-456', {});
    });
  });

  // -------------------------------------------------------------------------
  // reset — no-op guard
  // -------------------------------------------------------------------------
  describe('reset', () => {
    it('is a no-op when posthog is not initialized', () => {
      posthog.__loaded = false;
      reset();
      expect(posthog.reset).not.toHaveBeenCalled();
    });

    it('calls posthog.reset when initialized', () => {
      posthog.__loaded = true;
      reset();
      expect(posthog.reset).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  // capture — no-op guard
  // -------------------------------------------------------------------------
  describe('capture', () => {
    it('is a no-op when posthog is not initialized', () => {
      posthog.__loaded = false;
      capture('test_event', { key: 'value' });
      expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('calls posthog.capture with event and properties when initialized', () => {
      posthog.__loaded = true;
      capture('signup_completed', { plan: 'free' });
      expect(posthog.capture).toHaveBeenCalledOnce();
      expect(posthog.capture).toHaveBeenCalledWith('signup_completed', { plan: 'free' });
    });

    it('defaults properties to empty object when not provided', () => {
      posthog.__loaded = true;
      capture('page_viewed');
      expect(posthog.capture).toHaveBeenCalledWith('page_viewed', {});
    });
  });
});
