/**
 * Public API — docs module.
 *
 * Additive barrel: existing deep imports keep working. New consumers should
 * import from `@/modules/docs` rather than reaching into internals.
 */

// Stores
export { useDocsStore } from './stores/docs.store';

// Components
export { default as DocsCodeblock } from './components/docs.codeblock.component.vue';

// Composables
export {
  useDocsPage,
  slugifyHeading,
  EXAMPLE_MARKER_RE,
  EXAMPLE_MARKER_SOURCE,
} from './composables/useDocsPage';
export { resolveDocsTarget, flattenArticles } from './composables/useDocsNav';
export { useDocsReference, parseSpec } from './composables/useDocsReference';

// Services
export { default as docsService } from './services/docs.service';

// Config
export { default as docsConfig } from './config/docs.config';

// Routes
export { default as docsRoutes } from './router/docs.router';
