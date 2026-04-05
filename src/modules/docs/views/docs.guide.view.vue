<template>
  <v-container
    class="py-12"
    :style="{ 'max-width': config.vuetify.theme.maxWidth }"
  >
    <v-btn
      variant="text"
      color="primary"
      class="text-none text-body-medium mb-6 pa-0"
      :to="{ name: 'DocsGuides' }"
    >
      <v-icon
        start
        icon="mdi-arrow-left"
      />
      All guides
    </v-btn>

    <v-card
      :class="config.vuetify.theme.rounded"
      class="pa-8 pa-sm-12"
      variant="outlined"
    >
      <div
        v-if="markdown"
        class="docs-guide-content"
      >
        <VMarkdown :source="markdown" />
      </div>
      <div
        v-else
        class="text-center py-12"
      >
        <v-icon
          icon="mdi-file-document-remove-outline"
          size="64"
          color="medium-emphasis"
          class="mb-4"
        />
        <p class="text-h6 text-medium-emphasis">
          Guide not found
        </p>
        <v-btn
          variant="flat"
          color="primary"
          class="text-none text-body-medium mt-4"
          :class="config.vuetify.theme.rounded"
          :to="{ name: 'DocsGuides' }"
        >
          Browse all guides
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import config from '../../../lib/services/config';

import gettingStartedMd from '../guides/getting-started.md?raw';
import authenticationMd from '../guides/authentication.md?raw';
import organizationsMd from '../guides/organizations.md?raw';

const route = useRoute();

const guideMap = {
  'getting-started': gettingStartedMd,
  authentication: authenticationMd,
  organizations: organizationsMd,
};

const markdown = computed(() => guideMap[route.params.slug] || '');
</script>

<style scoped>
.docs-guide-content :deep(h1) {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.docs-guide-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.docs-guide-content :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.docs-guide-content :deep(p) {
  font-size: 1rem;
  line-height: 1.75;
  margin-bottom: 1rem;
}

.docs-guide-content :deep(pre) {
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.docs-guide-content :deep(code) {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.875rem;
}

.docs-guide-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.docs-guide-content :deep(th),
.docs-guide-content :deep(td) {
  text-align: left;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgb(var(--v-border-color));
}

.docs-guide-content :deep(th) {
  font-weight: 600;
}

.docs-guide-content :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.docs-guide-content :deep(a:hover) {
  text-decoration: underline;
}

.docs-guide-content :deep(ul),
.docs-guide-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.docs-guide-content :deep(li) {
  margin-bottom: 0.25rem;
  line-height: 1.75;
}

.docs-guide-content :deep(blockquote) {
  border-left: 4px solid rgb(var(--v-theme-primary));
  padding-left: 1rem;
  margin: 1rem 0;
  font-style: italic;
  opacity: 0.85;
}

.docs-guide-content :deep(hr) {
  border: none;
  border-top: 1px solid rgb(var(--v-border-color));
  margin: 2rem 0;
}
</style>
