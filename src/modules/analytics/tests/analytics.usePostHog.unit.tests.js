import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { usePostHog } from '../composables/analytics.usePostHog';

/**
 * @desc Helper that mounts a wrapper component calling usePostHog
 * and returns the result.
 * @param {Object|null} posthogMock - Mock posthog instance (null = not configured)
 * @returns {{ result: Object|null, wrapper: Object }}
 */
function mountWithPostHog(posthogMock) {
  let result;
  const Wrapper = defineComponent({
    setup() {
      result = usePostHog();
      return {};
    },
    template: '<div />',
  });

  const globalConfig = {};
  if (posthogMock) {
    globalConfig.config = { globalProperties: { $posthog: posthogMock } };
  }

  const wrapper = mount(Wrapper, { global: globalConfig });
  return { result, wrapper };
}

describe('usePostHog composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the posthog instance when configured', () => {
    const mockInstance = { capture: vi.fn(), identify: vi.fn() };
    const { result } = mountWithPostHog(mockInstance);
    expect(result).toBe(mockInstance);
  });

  it('returns null when posthog is not configured', () => {
    const { result } = mountWithPostHog(null);
    expect(result).toBeNull();
  });

  it('returns the same instance that was provided as $posthog', () => {
    const mockInstance = { capture: vi.fn(), getFeatureFlag: vi.fn() };
    const { result } = mountWithPostHog(mockInstance);
    expect(result.capture).toBe(mockInstance.capture);
    expect(result.getFeatureFlag).toBe(mockInstance.getFeatureFlag);
  });
});
