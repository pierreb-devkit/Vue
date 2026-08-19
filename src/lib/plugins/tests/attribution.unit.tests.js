import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCaptureFirstTouch = vi.fn();
vi.mock('../../helpers/attribution', () => ({
  captureFirstTouch: (...args) => mockCaptureFirstTouch(...args),
}));

import attributionPlugin from '../attribution';

const makeApp = (posthogConfig) => ({
  config: {
    globalProperties: {
      config: { analytics: { posthog: posthogConfig } },
    },
  },
});

describe('attribution plugin', () => {
  beforeEach(() => {
    mockCaptureFirstTouch.mockClear();
  });

  it('has an install method', () => {
    expect(typeof attributionPlugin.install).toBe('function');
  });

  it('calls captureFirstTouch on install when posthog key is configured', () => {
    const app = makeApp({ key: 'phc_testkey' });
    attributionPlugin.install(app);
    expect(mockCaptureFirstTouch).toHaveBeenCalledOnce();
  });

  it('does not call captureFirstTouch when posthog key is missing', () => {
    const app = makeApp({ host: 'https://app.posthog.com' });
    attributionPlugin.install(app);
    expect(mockCaptureFirstTouch).not.toHaveBeenCalled();
  });

  it('does not call captureFirstTouch when analytics config is absent', () => {
    const app = makeApp(null);
    attributionPlugin.install(app);
    expect(mockCaptureFirstTouch).not.toHaveBeenCalled();
  });

  it('does not call captureFirstTouch when app.config.globalProperties.config is undefined', () => {
    const app = { config: { globalProperties: {} } };
    attributionPlugin.install(app);
    expect(mockCaptureFirstTouch).not.toHaveBeenCalled();
  });
});
