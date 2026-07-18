<template>
  <component :is="activeLoader" v-if="activeLoader" />
  <v-progress-circular v-else indeterminate />
</template>

<script>
/**
 * Module dependencies.
 */
import { defineAsyncComponent } from 'vue';
import config from '../../../lib/services/config';

/**
 * Glob of module-provided loader components, matched by filename convention.
 * Non-eager: each entry is turned into a build chunk only when a config value
 * actually resolves to it, so an upstream repo that ships no
 * `*.loader.component.vue` pays zero bundle cost. Test fixtures are excluded.
 */
const loaderModules = import.meta.glob(['/src/modules/*/components/**/*.loader.component.vue', '!**/tests/**']);

/**
 * Resolve a configured loader path against a glob map of loader components.
 * Pure function — exported so it can be unit tested with a fake glob map,
 * independent of the real `import.meta.glob` result.
 * @param {Object<string, Function>} globMap - Map of Vite module path -> dynamic import loader.
 * @param {string|null|undefined} path - Configured loader path (config.ui.loader.component).
 * @returns {Function|null} The matched glob loader function, or null when unset/unmatched (fail-soft).
 */
export function resolveLoaderComponent(globMap, path) {
  if (!path) return null;
  const loader = globMap?.[path];
  if (!loader) {
    console.warn(
      `[CoreAppSpinner] config.ui.loader.component "${path}" did not match any loader component ` +
        '(expected a path like /src/modules/<module>/components/<name>.loader.component.vue). ' +
        'Falling back to the built-in spinner.',
    );
    return null;
  }
  return loader;
}

const configuredLoaderPath = config?.ui?.loader?.component || null;
const matchedLoader = resolveLoaderComponent(loaderModules, configuredLoaderPath);
const resolvedLoader = matchedLoader ? defineAsyncComponent(matchedLoader) : null;

/**
 * CoreAppSpinner — config-overridable loading indicator.
 *
 * Renders the built-in Vuetify `v-progress-circular` by default (byte-identical to every
 * existing call site). A downstream project can point `config.ui.loader.component` at its
 * own SFC (matched by the `*.loader.component.vue` filename convention under
 * `src/modules/*\/components/`) to replace the loader stack-wide with zero view edits —
 * config values can only be strings (generateConfig.js JSON.stringify's the merged config),
 * so the override is a Vite glob path resolved to a component at module load time.
 *
 * No visual props are declared: each template branch has a single root element, so Vue's
 * automatic attribute fallthrough passes color/size/data-test/etc. straight through to
 * whichever branch renders. The only declared prop is a programmatic escape hatch for tests.
 */
export default {
  name: 'CoreAppSpinner',
  props: {
    /**
     * @desc Test/programmatic escape hatch — a component definition to render instead of
     * the config-resolved loader. Views never pass this; it exists so unit tests can assert
     * the override path without needing a real `config.ui.loader.component` + glob match.
     */
    loader: {
      type: [Object, Function],
      default: null,
    },
  },
  computed: {
    /**
     * @desc The component to render, or null to fall back to the built-in spinner.
     * @returns {Object|Function|null}
     */
    activeLoader() {
      return this.loader || resolvedLoader;
    },
  },
};
</script>
