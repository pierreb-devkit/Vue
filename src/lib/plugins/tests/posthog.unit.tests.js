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

  it('initializes posthog when key and host are configured', () => {
    const app = makeApp({ key: 'phc_testkey', host: 'https://app.posthog.com' });
    posthogPlugin.install(app);
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.init).toHaveBeenCalledWith('phc_testkey', { api_host: 'https://app.posthog.com' });
    expect(app.config.globalProperties.$posthog).toBe('posthog-instance');
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

  it('does not initialize posthog when host is missing', () => {
    const app = makeApp({ key: 'phc_testkey', host: '' });
    posthogPlugin.install(app);
    expect(posthog.init).not.toHaveBeenCalled();
  });
});
