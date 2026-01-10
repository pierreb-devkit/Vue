/**
 * Module dependencies.
 */
import { computed } from 'vue';
import { useCoreStore } from '../../core/stores/core.store';

/**
 * Composable for theme management.
 */
export function useTheme() {
  const coreStore = useCoreStore();

  const theme = computed(() => coreStore.theme);

  return {
    theme,
  };
}
