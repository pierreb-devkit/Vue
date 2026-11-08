<template>
  <DocsShell class="docs-reference" :sections="railSections" :title="header.title">
        <v-sheet tag="header" color="transparent" max-width="640" class="pb-6">
          <h1 class="text-headline-large font-weight-medium mb-3" data-test="docs-reference-title">{{ header.title }}</h1>
          <p class="text-body-large text-medium-emphasis">{{ header.subtitle }}</p>
        </v-sheet>

        <!-- Loading -->
        <v-row v-if="loading" justify="center" class="py-12">
          <AppSpinner
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
              The API reference is not available right now. Please try again later.
            </v-alert>
          </v-col>
        </v-row>

        <template v-else>
          <!-- Spec meta -->
          <p
            v-if="info.version"
            class="text-body-small text-medium-emphasis mb-6"
            data-test="docs-reference-version"
          >
            OpenAPI spec · v{{ info.version }}
          </p>

          <!-- Tag groups -->
          <section
            v-for="(group, index) in groups"
            :id="groupIds[index]"
            :key="group.name"
            class="docs-row py-10 border-t"
            data-test="docs-reference-group"
          >
            <div class="d-flex align-center flex-wrap ga-3 mb-2">
              <h2 class="text-title-large font-weight-medium mb-0" data-test="docs-reference-group-title">
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
            <VMarkdown
              v-if="group.description"
              :source="group.description"
              class="text-body-medium text-medium-emphasis mb-4 docs-reference__group-desc"
            />

            <!-- Endpoints -->
            <v-expansion-panels variant="accordion" >
              <v-expansion-panel
                v-for="endpoint in group.endpoints"
                :key="endpoint.id"
                :value="endpoint.id"
                elevation="0"
                rounded="lg"
                class="border mb-2"
                data-test="docs-reference-endpoint"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center ga-3 flex-grow-1" style="min-width: 0">
                    <span class="text-mono text-body-medium text-medium-emphasis flex-shrink-0" data-test="docs-reference-method">{{ endpoint.method }}</span>
                    <code class="text-mono text-body-medium text-truncate">{{ endpoint.path }}</code>
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
                    <p class="text-title-small mb-1">Parameters</p>
                    <v-table density="compact" >
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
                    <p class="text-title-small mb-1">Responses</p>
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
  </DocsShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useDocsStore } from '../stores/docs.store';
import { parseSpec } from '../composables/useDocsReference';
import { resolveDocsTarget } from '../composables/useDocsNav';
import { slugifyHeading } from '../composables/useDocsPage';
import DocsShell from '../components/docs.shell.component.vue';
import AppSpinner from '../../core/components/core.appSpinner.component.vue';
import config from '@/config';

/**
 * Reference surface config (header copy + tag→guide cross-links). Defaults are
 * inline so the view renders without downstream config; a project can override
 * via `config.docs.reference`.
 */
const reference = config?.docs?.reference || {};
const header = {
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

const store = useDocsStore();
const loading = computed(() => store.loading);
const error = computed(() => store.error);

const parsed = ref({ info: {}, groups: [], notFound: false });
const info = computed(() => parsed.value.info || {});
const groups = computed(() => parsed.value.groups || []);

/** Each group's anchor on this page, in order; tags that slug alike get a numbered suffix. */
const groupIds = computed(() => {
  const seen = new Map();
  return groups.value.map((g) => {
    const id = `api-${slugifyHeading(g.name)}`;
    const n = (seen.get(id) || 0) + 1;
    seen.set(id, n);
    return n > 1 ? `${id}-${n}` : id;
  });
});

const railSections = computed(() => groups.value.map((g, i) => ({ id: groupIds.value[i], nav: g.name })));

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
/* Rendered markdown: its paragraphs cannot take Vuetify classes. */
.docs-reference__group-desc :deep(p) {
  margin-bottom: 0.5rem;
}
</style>
