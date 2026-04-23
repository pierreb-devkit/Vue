import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../../lib/helpers/errorTracker.js', () => ({
  captureException: vi.fn(),
}));

import { captureException } from '../../../lib/helpers/errorTracker.js';
import ErrorBoundary from '../components/app.errorBoundary.component.vue';

/** @type {Object} Mock application configuration used by the ErrorBoundary component. */
const config = {
  vuetify: { theme: { rounded: 'rounded-lg' } },
};

/** @type {Object} A child component that renders successfully. */
const ChildOk = { template: '<div class="child-ok">OK</div>' };

/** @type {Object} A child component that throws during setup to trigger the error boundary. */
const ChildError = {
  /**
   * Throws an error to simulate a child component failure.
   *
   * @throws {Error} Always throws 'render boom'.
   */
  setup() {
    throw new Error('render boom');
  },
  template: '<div />',
};

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Mounts the ErrorBoundary component with a given child in the default slot.
   *
   * @param {Object} child - The child component to render inside the boundary.
   * @returns {import('@vue/test-utils').VueWrapper} The mounted wrapper instance.
   */
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

  it('reports error via errorTracker.captureException when child throws', () => {
    mountBoundary(ChildError);
    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(captureException.mock.calls[0][0].message).toBe('render boom');
  });

  it('resets error state on retry', () => {
    const wrapper = mountBoundary(ChildError);
    expect(wrapper.vm.hasError).toBe(true);
    wrapper.vm.retry();
    expect(wrapper.vm.hasError).toBe(false);
  });
});
