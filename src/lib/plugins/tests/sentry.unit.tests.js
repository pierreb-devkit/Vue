import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sentry/vue', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn().mockReturnValue('browser-tracing-integration'),
}));

import * as Sentry from '@sentry/vue';
import sentryPlugin from '../sentry';

const makeApp = (sentryConfig) => ({
  config: {
    globalProperties: {
      config: { analytics: { sentry: sentryConfig } },
    },
  },
});

describe('sentry plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has an install method', () => {
    expect(typeof sentryPlugin.install).toBe('function');
  });

  it('initializes Sentry when dsn is configured and enabled', () => {
    const app = makeApp({ dsn: 'https://key@sentry.io/123', environment: 'production', enabled: true, tracesSampleRate: 0.5 });
    const router = {};
    sentryPlugin.install(app, { router });
    expect(Sentry.init).toHaveBeenCalledOnce();
    expect(Sentry.init).toHaveBeenCalledWith({
      app,
      dsn: 'https://key@sentry.io/123',
      environment: 'production',
      integrations: ['browser-tracing-integration'],
      tracesSampleRate: 0.5,
    });
    expect(Sentry.browserTracingIntegration).toHaveBeenCalledWith({ router });
  });

  it('does not initialize Sentry when config is null', () => {
    const app = makeApp(null);
    sentryPlugin.install(app);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not initialize Sentry when dsn is empty', () => {
    const app = makeApp({ dsn: '', enabled: true });
    sentryPlugin.install(app);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('does not initialize Sentry when enabled is false', () => {
    const app = makeApp({ dsn: 'https://key@sentry.io/123', enabled: false });
    sentryPlugin.install(app);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('initializes without router when not provided', () => {
    const app = makeApp({ dsn: 'https://key@sentry.io/123', enabled: true });
    sentryPlugin.install(app);
    expect(Sentry.init).toHaveBeenCalledOnce();
    expect(Sentry.browserTracingIntegration).not.toHaveBeenCalled();
    expect(Sentry.init.mock.calls[0][0].integrations).toEqual([]);
  });

  it('defaults environment to development when not specified', () => {
    const app = makeApp({ dsn: 'https://key@sentry.io/123', enabled: true });
    sentryPlugin.install(app);
    expect(Sentry.init.mock.calls[0][0].environment).toBe('development');
  });

  it('defaults tracesSampleRate to 0.1 when not specified', () => {
    const app = makeApp({ dsn: 'https://key@sentry.io/123', enabled: true });
    sentryPlugin.install(app);
    expect(Sentry.init.mock.calls[0][0].tracesSampleRate).toBe(0.1);
  });
});
