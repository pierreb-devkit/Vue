/**
 * Module dependencies.
 */
import { ref, onUnmounted } from 'vue';
import { usePostHog } from './analytics.usePostHog';

/**
 * @desc Composable that returns a reactive ref tracking a PostHog feature flag.
 * Supports both boolean flags and multivariate (string variant) flags.
 * Returns `ref(false)` when PostHog is not configured or the flag is unknown.
 * @param {string} flagKey - The feature flag key to evaluate
 * @returns {import('vue').Ref<boolean|string>} Reactive ref with the flag value
 */
export function useFeatureFlag(flagKey) {
  const flag = ref(false);

  const posthog = usePostHog();

  if (!posthog) return flag;

  /**
   * @desc Read the current flag value from PostHog and update the ref.
   */
  function sync() {
    const value = posthog.getFeatureFlag(flagKey);
    if (value === undefined || value === null) {
      flag.value = false;
    } else {
      flag.value = value;
    }
  }

  // Check immediately in case flags are already loaded
  sync();

  const unsubscribe = posthog.onFeatureFlags(() => {
    sync();
  });

  onUnmounted(() => {
    if (typeof unsubscribe === 'function') unsubscribe();
  });

  return flag;
}

/**
 * Exports.
 */
export default useFeatureFlag;
