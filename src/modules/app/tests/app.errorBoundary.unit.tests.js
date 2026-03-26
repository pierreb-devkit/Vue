import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('@sentry/vue', () => ({
  captureException: vi.fn(),
}));

import * as Sentry from '@sentry/vue';
import ErrorBoundary from '../components/app.errorBoundary.component.vue';

const config = {
  vuetify: { theme: { rounded: 'rounded-lg' } },
};

const ChildOk = { template: '<div class="child-ok">OK</div>' };

const ChildError = {
  setup() {
    throw new Error('render boom');
  },
  template: '<div />',
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountBoundary = (child) =>
    mount(ErrorBoundary, {
      global: {
        mocks: { config },
        stubs: { 'v-container': true, 'v-alert': true, 'v-btn': true, 'v-icon': true },
      },
      slots: { default: child },
    });

  it('renders slot content when no error', () => {
    const wrapper = mountBoundary(ChildOk);
    expect(wrapper.find('.child-ok').exists()).toBe(true);
  });

  it('shows fallback UI when child throws', () => {
    const wrapper = mountBoundary(ChildError);
    expect(wrapper.vm.hasError).toBe(true);
  });

  it('reports error to Sentry when child throws', () => {
    mountBoundary(ChildError);
    expect(Sentry.captureException).toHaveBeenCalledOnce();
    expect(Sentry.captureException.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(Sentry.captureException.mock.calls[0][0].message).toBe('render boom');
  });

  it('resets error state on retry', () => {
    const wrapper = mountBoundary(ChildError);
    expect(wrapper.vm.hasError).toBe(true);
    wrapper.vm.retry();
    expect(wrapper.vm.hasError).toBe(false);
  });
});
