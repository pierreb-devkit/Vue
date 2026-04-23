import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('posthog-js', () => ({
  default: { init: vi.fn().mockReturnValue('posthog-instance') },
}));

import posthog from 'posthog-js';
import posthogPlugin from '../posthog';

const makeApp = (posthogConfig) => ({
  config: {
    globalProperties: {
      config: { analytics: { posthog: posthogConfig } },
    },
  },
});

describe('posthog plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has an install method', () => {
    expect(typeof posthogPlugin.install).toBe('function');
  });

  it('initializes posthog when key is configured (host defaults)', () => {
    const app = makeApp({ key: 'phc_testkey', host: 'https://app.posthog.com' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ api_host: 'https://app.posthog.com' }),
    );
    expect(app.config.globalProperties.$posthog).toBe(posthog);
  });

  it('uses default host when host is not set', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ api_host: 'https://us.i.posthog.com' }),
    );
  });

  it('does not initialize posthog when config is null', () => {
    const app = makeApp(null);
    posthogPlugin.install(app);
    expect(posthog.init).not.toHaveBeenCalled();
    expect(app.config.globalProperties.$posthog).toBeUndefined();
  });

  it('does not initialize posthog when key is missing', () => {
    const app = makeApp({ key: '', host: 'https://app.posthog.com' });
    posthogPlugin.install(app);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it('uses default-safe options: autocapture=false, disable_session_recording=true when no flags set', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({
        autocapture: false,
        disable_session_recording: true,
        capture_pageleave: false,
      }),
    );
  });

  it('enables autocapture when autoCapture=true', () => {
    const app = makeApp({ key: 'phc_testkey', autoCapture: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ autocapture: true }),
    );
  });

  it('enables autocapture when autoCapture="true" (Docker string)', () => {
    const app = makeApp({ key: 'phc_testkey', autoCapture: 'true' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ autocapture: true }),
    );
  });

  it('disables session recording when sessionReplay=false (default-safe)', () => {
    const app = makeApp({ key: 'phc_testkey', sessionReplay: false });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ disable_session_recording: true }),
    );
  });

  it('enables session replay with maskAllInputs when sessionReplay=true', () => {
    const app = makeApp({ key: 'phc_testkey', sessionReplay: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({
        disable_session_recording: false,
        session_recording: { maskAllInputs: true },
      }),
    );
  });

  it('bootstraps empty feature flags when featureFlags=false (prevents initial fetch)', () => {
    const app = makeApp({ key: 'phc_testkey', featureFlags: false });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ bootstrap: { featureFlags: {} } }),
    );
  });

  it('does not bootstrap feature flags when featureFlags=true (allows fetch)', () => {
    const app = makeApp({ key: 'phc_testkey', featureFlags: true });
    posthogPlugin.install(app);
    const callArgs = posthog.init.mock.calls[0][1];
    expect(callArgs.bootstrap).toBeUndefined();
  });

  describe('loaded callback', () => {
    /**
     * Helper to invoke the `loaded` callback from posthog.init options.
     * @param {Object} posthogConfig
     * @param {Object} phInstance - Mock PostHog instance passed to loaded
     */
    const invokeLoaded = (posthogConfig, phInstance) => {
      const app = makeApp(posthogConfig);
      posthogPlugin.install(app);
      const loadedFn = posthog.init.mock.calls[0][1].loaded;
      if (loadedFn) loadedFn(phInstance);
    };

    it('sets disable_surveys on the ph instance when surveys=false (default)', () => {
      const phInstance = { config: {} };
      invokeLoaded({ key: 'phc_testkey', surveys: false }, phInstance);
      expect(phInstance.config.disable_surveys).toBe(true);
    });

    it('does not set disable_surveys when surveys=true', () => {
      const phInstance = { config: {} };
      invokeLoaded({ key: 'phc_testkey', surveys: true }, phInstance);
      expect(phInstance.config.disable_surveys).toBeUndefined();
    });

    it('sets __add_tracing_headers=false when webVitals=false (default)', () => {
      const phInstance = { config: {} };
      invokeLoaded({ key: 'phc_testkey', webVitals: false }, phInstance);
      expect(phInstance.config.__add_tracing_headers).toBe(false);
    });

    it('does not set __add_tracing_headers when webVitals=true', () => {
      const phInstance = { config: {} };
      invokeLoaded({ key: 'phc_testkey', webVitals: true }, phInstance);
      expect(phInstance.config.__add_tracing_headers).toBeUndefined();
    });

    it('silently ignores errors in loaded callback (best-effort config)', () => {
      // ph.config throws on assignment — should not propagate
      const phInstance = {
        get config() { throw new Error('no config'); },
      };
      expect(() => invokeLoaded({ key: 'phc_testkey' }, phInstance)).not.toThrow();
    });
  });
});
