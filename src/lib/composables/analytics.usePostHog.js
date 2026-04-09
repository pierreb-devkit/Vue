/**
 * Module dependencies.
 */
import { getCurrentInstance } from 'vue';

/**
 * @desc Composable that returns the PostHog instance or null if not configured.
 * Provides direct access to the PostHog SDK for advanced use cases
 * where dedicated composables are not sufficient.
 * @returns {Object|null} The PostHog instance or null
 */
export function usePostHog() {
  const instance = getCurrentInstance();
  return instance?.appContext?.config?.globalProperties?.$posthog || null;
}

/**
 * Exports.
 */
export default usePostHog;
