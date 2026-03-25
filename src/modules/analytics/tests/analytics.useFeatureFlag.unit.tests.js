import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { useFeatureFlag } from '../composables/analytics.useFeatureFlag';

/**
 * @desc Helper that mounts a wrapper component calling useFeatureFlag
 * and returns the reactive flag ref plus the mock posthog instance.
 * @param {string} flagKey - Feature flag key to test
 * @param {Object|null} posthogMock - Mock posthog instance (null = not configured)
 * @returns {{ flag: import('vue').Ref, posthog: Object, wrapper: Object }}
 */
function mountWithFlag(flagKey, posthogMock) {
  let flag;
  const Wrapper = defineComponent({
    setup() {
      flag = useFeatureFlag(flagKey);
      return { flag };
    },
    template: '<div>{{ flag }}</div>',
  });

  const globalConfig = {};
  if (posthogMock) {
    globalConfig.config = { globalProperties: { $posthog: posthogMock } };
  }

  const wrapper = mount(Wrapper, { global: globalConfig });
  return { flag, posthog: posthogMock, wrapper };
}

/**
 * @desc Create a mock posthog instance with configurable flag values.
 * @param {Object} flags - Map of flag key to value
 * @returns {Object} Mock posthog instance
 */
function createPostHogMock(flags = {}) {
  const callbacks = [];
  return {
    getFeatureFlag: vi.fn((key) => flags[key]),
    onFeatureFlags: vi.fn((cb) => {
      callbacks.push(cb);
      return () => {
        const idx = callbacks.indexOf(cb);
        if (idx >= 0) callbacks.splice(idx, 1);
      };
    }),
    _callbacks: callbacks,
    _flags: flags,
    _fireFlags(newFlags) {
      if (newFlags) Object.assign(flags, newFlags);
      callbacks.forEach((cb) => cb());
    },
  };
}

describe('useFeatureFlag composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when posthog is not configured', () => {
    const { flag } = mountWithFlag('test-flag', null);
    expect(flag.value).toBe(false);
  });

  it('returns false when flag is not defined in posthog', () => {
    const posthog = createPostHogMock({});
    const { flag } = mountWithFlag('unknown-flag', posthog);
    expect(flag.value).toBe(false);
  });

  it('returns true for a boolean flag that is enabled', () => {
    const posthog = createPostHogMock({ 'my-flag': true });
    const { flag } = mountWithFlag('my-flag', posthog);
    expect(flag.value).toBe(true);
  });

  it('returns false for a boolean flag that is disabled', () => {
    const posthog = createPostHogMock({ 'my-flag': false });
    const { flag } = mountWithFlag('my-flag', posthog);
    expect(flag.value).toBe(false);
  });

  it('returns string variant for a multivariate flag', () => {
    const posthog = createPostHogMock({ 'variant-flag': 'control' });
    const { flag } = mountWithFlag('variant-flag', posthog);
    expect(flag.value).toBe('control');
  });

  it('updates when onFeatureFlags fires with new boolean value', async () => {
    const posthog = createPostHogMock({ 'my-flag': false });
    const { flag } = mountWithFlag('my-flag', posthog);
    expect(flag.value).toBe(false);

    posthog._fireFlags({ 'my-flag': true });
    await nextTick();
    expect(flag.value).toBe(true);
  });

  it('updates when onFeatureFlags fires with new variant', async () => {
    const posthog = createPostHogMock({ 'ab-test': 'control' });
    const { flag } = mountWithFlag('ab-test', posthog);
    expect(flag.value).toBe('control');

    posthog._fireFlags({ 'ab-test': 'variant-b' });
    await nextTick();
    expect(flag.value).toBe('variant-b');
  });

  it('registers onFeatureFlags callback on mount', () => {
    const posthog = createPostHogMock({});
    mountWithFlag('my-flag', posthog);
    expect(posthog.onFeatureFlags).toHaveBeenCalledOnce();
    expect(posthog.onFeatureFlags).toHaveBeenCalledWith(expect.any(Function));
  });

  it('does not register onFeatureFlags when posthog is not configured', () => {
    mountWithFlag('my-flag', null);
    // no error thrown — graceful degradation
  });

  it('treats null flag value as false', () => {
    const posthog = createPostHogMock({ 'null-flag': null });
    const { flag } = mountWithFlag('null-flag', posthog);
    expect(flag.value).toBe(false);
  });
});
