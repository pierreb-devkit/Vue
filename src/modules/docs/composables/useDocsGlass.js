/**
 * The app's liquid glass (same helper as the top bar) for the docs' navigation
 * surfaces. Pair it with the `docs-glass` class, which gives the solid fallback.
 */
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { liquidGlassStyle } from '../../../lib/helpers/theme';

/**
 * Glass style that follows the current theme.
 * @param {number} [opacity=0.5] - Surface opacity; higher where text scrolls behind
 * @returns {import('vue').ComputedRef<Object>} The style object
 */
export const useDocsGlass = (opacity = 0.5) => {
  const theme = useTheme();
  // The helper reads plain colors, while useTheme() holds them in a ref.
  return computed(() =>
    liquidGlassStyle({
      vuetifyTheme: { global: theme.global, current: theme.current.value },
      opacity,
      variant: 'card',
    }),
  );
};

export default useDocsGlass;
