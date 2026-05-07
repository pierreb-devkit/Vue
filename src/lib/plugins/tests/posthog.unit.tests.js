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

  it('sets advanced_disable_feature_flags=true when featureFlags=false (prevents initial fetch)', () => {
    const app = makeApp({ key: 'phc_testkey', featureFlags: false });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ advanced_disable_feature_flags: true }),
    );
  });

  it('sets advanced_disable_feature_flags=false when featureFlags=true (allows fetch)', () => {
    const app = makeApp({ key: 'phc_testkey', featureFlags: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ advanced_disable_feature_flags: false }),
    );
  });

  it('disables surveys by default (surveys=false)', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ disable_surveys: true }),
    );
  });

  it('enables surveys when surveys=true', () => {
    const app = makeApp({ key: 'phc_testkey', surveys: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ disable_surveys: false }),
    );
  });

  it('disables capture_performance (web vitals) by default', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ capture_performance: false }),
    );
  });

  it('enables capture_performance when webVitals=true', () => {
    const app = makeApp({ key: 'phc_testkey', webVitals: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ capture_performance: true }),
    );
  });

  it('disables feature flags by default via advanced_disable_feature_flags', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ advanced_disable_feature_flags: true }),
    );
  });

  it('enables feature flags when featureFlags=true', () => {
    const app = makeApp({ key: 'phc_testkey', featureFlags: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ advanced_disable_feature_flags: false }),
    );
  });

  it('enables capture_pageleave when capturePageleave=true', () => {
    const app = makeApp({ key: 'phc_testkey', capturePageleave: true });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ capture_pageleave: true }),
    );
  });

  describe('docker string normalization for opt-in flags', () => {
    it('enables session replay on sessionReplay="true"', () => {
      const app = makeApp({ key: 'phc_testkey', sessionReplay: 'true' });
      posthogPlugin.install(app);
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({
          disable_session_recording: false,
          session_recording: { maskAllInputs: true },
        }),
      );
    });

    it('enables feature flags on featureFlags="true"', () => {
      const app = makeApp({ key: 'phc_testkey', featureFlags: 'true' });
      posthogPlugin.install(app);
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({ advanced_disable_feature_flags: false }),
      );
    });

    it('enables surveys on surveys="true"', () => {
      const app = makeApp({ key: 'phc_testkey', surveys: 'true' });
      posthogPlugin.install(app);
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({ disable_surveys: false }),
      );
    });

    it('enables web vitals on webVitals="true"', () => {
      const app = makeApp({ key: 'phc_testkey', webVitals: 'true' });
      posthogPlugin.install(app);
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({ capture_performance: true }),
      );
    });

    it('enables capture_pageleave on capturePageleave="true"', () => {
      const app = makeApp({ key: 'phc_testkey', capturePageleave: 'true' });
      posthogPlugin.install(app);
      expect(posthog.init).toHaveBeenCalledWith(
        'phc_testkey',
        expect.objectContaining({ capture_pageleave: true }),
      );
    });
  });

  it('initializes posthog with opt_out_capturing_by_default: true (RGPD gating)', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ opt_out_capturing_by_default: true }),
    );
  });

  it('initializes posthog with persistence: memory (no cookie/LS until consent)', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ persistence: 'memory' }),
    );
  });

  it('initializes posthog with opt_in_site_apps: false (prevents PostHog dashboard cookie banner site app)', () => {
    const app = makeApp({ key: 'phc_testkey' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledWith(
      'phc_testkey',
      expect.objectContaining({ opt_in_site_apps: false }),
    );
  });
});
