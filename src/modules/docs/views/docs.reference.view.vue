<template>
  <v-container class="docs-reference py-8">
    <v-row>
      <!-- Left sidebar nav (persistent, shared with the article surface) -->
      <v-col cols="12" md="3" lg="3" order="1" class="d-none d-md-block">
        <DocsNav />
      </v-col>

      <!-- Reference body -->
      <v-col cols="12" md="9" lg="9" order="2">
        <PageHeader
          :icon="header.icon"
          :title="header.title"
          :subtitle="header.subtitle"
          avatar-color="primary"
        >
          <template #actions>
            <v-btn
              :href="redocUrl"
              target="_blank"
              rel="noopener"
              variant="text"
              size="small"
              class="text-none"
              append-icon="fa-solid fa-arrow-up-right-from-square"
              data-test="docs-reference-redoc-link"
            >
              Open in Redoc
            </v-btn>
          </template>
        </PageHeader>

        <!-- Loading -->
        <v-row v-if="loading" justify="center" class="py-12">
          <v-progress-circular
            indeterminate
            color="primary"
            size="48"
            data-test="docs-reference-loading"
          />
        </v-row>

        <!-- Error -->
        <v-row v-else-if="error" class="pa-2 mt-2">
          <v-col>
            <v-alert type="error" variant="tonal" data-test="docs-reference-error">
              {{ error }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- Empty / unavailable -->
        <v-row v-else-if="!groups.length" class="pa-2 mt-2">
          <v-col>
            <v-alert type="info" variant="tonal" data-test="docs-reference-empty">
              The API reference is not available right now. You can still browse it on
              <a :href="redocUrl" target="_blank" rel="noopener">Redoc</a>.
            </v-alert>
          </v-col>
        </v-row>

        <template v-else>
          <!-- Spec meta -->
          <p
            v-if="info.version"
            class="text-body-small text-medium-emphasis mt-2 mb-6"
            data-test="docs-reference-version"
          >
            OpenAPI spec · v{{ info.version }}
          </p>

          <!-- Tag groups -->
          <section
            v-for="group in groups"
            :key="group.name"
            class="docs-reference__group mb-10"
            data-test="docs-reference-group"
          >
            <div class="d-flex align-center flex-wrap ga-3 mb-2">
              <h2 class="text-headline-small font-weight-medium" data-test="docs-reference-group-title">
                {{ group.name }}
              </h2>
              <v-btn
                v-if="guideLink(group.name)"
                :to="guideLink(group.name)"
                variant="tonal"
                size="x-small"
                color="primary"
                class="text-none"
                append-icon="fa-solid fa-arrow-right"
                data-test="docs-reference-guide-link"
              >
                Read the guide
              </v-btn>
            </div>
            <!-- eslint-disable-next-line vue/no-v-html -- group.description is from the trusted backend spec, rendered via VMarkdown (DOMPurify-sanitized) -->
            <VMarkdown
              v-if="group.description"
              :source="group.description"
              class="text-body-medium text-medium-emphasis mb-4 docs-reference__group-desc"
            />

            <!-- Endpoints -->
            <v-expansion-panels variant="accordion" class="docs-reference__panels">
              <v-expansion-panel
                v-for="endpoint in group.endpoints"
                :key="endpoint.id"
                :value="endpoint.id"
                elevation="0"
                rounded="lg"
                class="docs-reference__endpoint mb-2"
                data-test="docs-reference-endpoint"
              >
                <v-expansion-panel-title class="docs-reference__endpoint-title">
                  <div class="d-flex align-center ga-3 flex-grow-1" style="min-width: 0">
                    <v-chip
                      :color="methodColor(endpoint.method)"
                      size="small"
                      variant="flat"
                      label
                      class="docs-reference__method font-weight-bold flex-shrink-0"
                      data-test="docs-reference-method"
                    >
                      {{ endpoint.method }}
                    </v-chip>
                    <code class="docs-reference__path text-body-medium text-truncate">{{ endpoint.path }}</code>
                    <span
                      v-if="endpoint.summary"
                      class="text-body-medium text-medium-emphasis text-truncate d-none d-sm-inline"
                    >
                      {{ endpoint.summary }}
                    </span>
                    <v-icon
                      v-if="endpoint.secured"
                      icon="fa-solid fa-lock"
                      size="x-small"
                      class="text-medium-emphasis flex-shrink-0"
                      title="Requires authentication"
                    />
                    <v-chip
                      v-if="endpoint.deprecated"
                      color="warning"
                      size="x-small"
                      variant="tonal"
                      label
                      class="flex-shrink-0"
                    >
                      Deprecated
                    </v-chip>
                  </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                  <!-- Description -->
                  <VMarkdown
                    v-if="endpoint.description"
                    :source="endpoint.description"
                    class="text-body-medium mb-4"
                    data-test="docs-reference-description"
                  />

                  <!-- Request body indicator -->
                  <p
                    v-if="endpoint.hasRequestBody"
                    class="text-body-small text-medium-emphasis mb-4"
                    data-test="docs-reference-requestbody"
                  >
                    <v-icon icon="fa-solid fa-arrow-up-from-bracket" size="x-small" class="mr-1" />
                    Accepts a JSON request body.
                  </p>

                  <!-- Parameters -->
                  <div v-if="endpoint.parameters.length" class="mb-4" data-test="docs-reference-params">
                    <p class="text-overline text-medium-emphasis mb-1">Parameters</p>
                    <v-table density="compact" class="docs-reference__table">
                      <thead>
                        <tr>
                          <th class="text-left">Name</th>
                          <th class="text-left">In</th>
                          <th class="text-left">Type</th>
                          <th class="text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="param in endpoint.parameters" :key="`${param.in}-${param.name}`">
                          <td>
                            <code class="text-body-small">{{ param.name }}</code>
                            <span v-if="param.required" class="text-error text-body-small ml-1" title="Required">*</span>
                          </td>
                          <td class="text-body-small text-medium-emphasis">{{ param.in }}</td>
                          <td class="text-body-small text-medium-emphasis">{{ param.type || '—' }}</td>
                          <td class="text-body-small text-medium-emphasis">{{ param.description || '—' }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>

                  <!-- Responses -->
                  <div v-if="endpoint.responses.length" data-test="docs-reference-responses">
                    <p class="text-overline text-medium-emphasis mb-1">Responses</p>
                    <div class="d-flex flex-column ga-1">
                      <div
                        v-for="response in endpoint.responses"
                        :key="response.status"
                        class="d-flex align-center ga-2"
                      >
                        <v-chip
                          :color="statusColor(response.status)"
                          size="x-small"
                          variant="tonal"
                          label
                          class="font-weight-medium flex-shrink-0"
                        >
                          {{ response.status }}
                        </v-chip>
                        <span class="text-body-small text-medium-emphasis">{{ response.description || '—' }}</span>
                      </div>
                    </div>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </section>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useDocsStore } from '../stores/docs.store';
import { parseSpec } from '../composables/useDocsReference';
import { resolveDocsTarget } from '../composables/useDocsNav';
import DocsNav from '../components/docs.nav.component.vue';
import PageHeader from '../../core/components/core.pageHeader.component.vue';
import config from '@/config';

/**
 * Reference surface config (header copy + tag→guide cross-links). Defaults are
 * inline so the view renders without downstream config; a project can override
 * via `config.docs.reference`.
 */
const reference = config?.docs?.reference || {};
const header = {
  icon: reference.icon || 'fa-solid fa-code',
  title: reference.title || 'API reference',
  subtitle: reference.subtitle || 'Every endpoint, grouped by resource. Generated from the live OpenAPI spec.',
};

/**
 * Map of OpenAPI tag name → docs category slug. When a tag has a mapping AND the
 * loaded guide tree contains that category, the group renders a "Read the guide"
 * cross-link to the category's first article. Config-driven (downstream owns the
 * tag↔guide vocabulary); empty by default (no cross-links, no broken links).
 * @type {Object<string, string>}
 */
const tagGuides = reference.tagGuides && typeof reference.tagGuides === 'object'
  ? reference.tagGuides
  : {};

/** Absolute URL to the standalone Redoc reference (the untouched fallback). */
const redocUrl = computed(() => {
  const api = config?.api || {};
  const port = api.port && ![80, 443, '80', '443'].includes(api.port) ? `:${api.port}` : '';
  return `${api.protocol}://${api.host}${port}/${api.base}/docs`;
});

const store = useDocsStore();
const loading = computed(() => store.loading);
const error = computed(() => store.error);

const parsed = ref({ info: {}, groups: [], notFound: false });
const info = computed(() => parsed.value.info || {});
const groups = computed(() => parsed.value.groups || []);

/**
 * Resolve a tag's cross-link to a guide route, or null when no mapping exists
 * (or the mapped category is absent from the loaded tree).
 * @param {string} tagName - The OpenAPI tag (group) name.
 * @returns {string|null} A `/docs/:category/:slug` path, or null.
 */
const guideLink = (tagName) => {
  const category = tagGuides[tagName];
  if (!category) return null;
  const to = resolveDocsTarget({ category }, store.tree);
  // resolveDocsTarget falls back to '/docs' when the category is missing — treat
  // that as "no guide" so we never render a link that lands on the home page.
  return to === '/docs' ? null : to;
};

/**
 * Vuetify color for an HTTP method chip.
 * @param {string} method - The uppercase HTTP method.
 * @returns {string} A theme color name.
 */
const methodColor = (method) => ({
  GET: 'info',
  POST: 'success',
  PUT: 'warning',
  PATCH: 'warning',
  DELETE: 'error',
}[method] || 'secondary');

/**
 * Vuetify color for a response status chip.
 * @param {string} status - The HTTP status code (or `default`).
 * @returns {string} A theme color name.
 */
const statusColor = (status) => {
  const code = parseInt(status, 10);
  if (Number.isNaN(code)) return 'secondary';
  if (code < 300) return 'success';
  if (code < 400) return 'info';
  if (code < 500) return 'warning';
  return 'error';
};

onMounted(async () => {
  // Tree powers the sidebar + guide cross-links; spec powers the reference.
  // Both degrade independently (a missing tree just drops the cross-links).
  await store.fetchTree().catch(() => {});
  const spec = await store.fetchSpec().catch(() => null);
  parsed.value = parseSpec(spec);
});
</script>

<style scoped>
.docs-reference__group-desc :deep(p) {
  margin-bottom: 0.5rem;
}

.docs-reference__endpoint {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.docs-reference__method {
  min-width: 56px;
  justify-content: center;
}

.docs-reference__path {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.docs-reference__table :deep(code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
</style>
