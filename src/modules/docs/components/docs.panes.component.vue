<template>
  <div data-test="docs-article-body">
    <header>
      <v-row no-gutters class="docs-row pb-8">
        <v-col cols="12" lg="6" class="pe-lg-6">
          <h1 class="text-headline-large font-weight-medium mb-3" data-test="docs-article-title">{{ page.title }}</h1>
          <p class="text-body-large text-medium-emphasis">{{ page.lead }}</p>
        </v-col>
        <v-col cols="12" lg="6" class="ps-lg-6 mt-6 mt-lg-0">
          <DocsCodeblock :examples="[{ lang: 'plaintext', label: 'Base URL', code: page.base }]" />
        </v-col>
      </v-row>
    </header>

    <v-row
      v-for="section in page.sections"
      :id="section.id"
      :key="section.id"
      tag="section"
      no-gutters
      class="docs-row py-10 border-t"
      data-test="docs-panes-section"
    >
      <v-col cols="12" lg="6" class="pe-lg-6" data-test="docs-panes-text">
        <a v-for="alias in section.aliases" :id="alias" :key="alias" class="docs-row" />
        <h2 class="text-title-large font-weight-medium mb-2">{{ section.title }}</h2>
        <p v-if="section.path" class="text-mono text-body-medium">
          <span class="text-medium-emphasis">{{ section.method }}</span> {{ section.path }}
        </p>
        <p v-if="section.text" class="mb-3"><InlineText :text="section.text" /></p>

        <ol v-if="section.steps" class="ps-5 my-4">
          <li v-for="step in section.steps" :key="step" class="mb-2 ps-1"><InlineText :text="step" /></li>
        </ol>

        <template v-for="list in [section.list, section.sublist]" :key="list?.title">
          <div v-if="list" class="mt-6">
            <h3 v-if="list.title" class="text-title-small pb-2 border-b">{{ list.title }}</h3>
            <div
              v-for="row in list.rows"
              :key="row.name"
              class="py-2 border-b"
              :class="{ 'd-flex ga-2': list.labels }"
              data-test="docs-panes-row"
            >
              <v-sheet v-if="list.labels" color="transparent" width="104" class="flex-shrink-0 font-weight-medium">{{ row.name }}</v-sheet>
              <div v-else class="d-flex flex-wrap align-baseline ga-2 mb-1">
                <code class="font-weight-medium">{{ row.name }}</code>
                <span v-if="row.type" class="text-body-small text-medium-emphasis">{{ row.type }}</span>
              </div>
              <div class="text-medium-emphasis" data-test="docs-panes-value">
                <InlineText :text="row.text" />
                <template v-if="row.href">
                  {{ ' ' }}<a :href="row.href">{{ row.hrefLabel }}</a>
                </template>
              </div>
            </div>
          </div>
        </template>

        <div v-if="section.errors" class="mt-6">
          <h3 class="text-title-small pb-2 border-b">Errors</h3>
          <div v-for="error in section.errors" :key="error.code" class="d-flex ga-2 py-2 border-b">
            <v-sheet color="transparent" width="40" class="flex-shrink-0"><code class="font-weight-medium">{{ error.code }}</code></v-sheet>
            <div class="text-medium-emphasis" data-test="docs-panes-value"><InlineText :text="error.text" /></div>
          </div>
        </div>

        <div v-if="section.notes" class="mt-4 text-medium-emphasis">
          <p v-for="note in section.notes" :key="note" class="mb-2"><InlineText :text="note" /></p>
        </div>

        <p v-if="section.links" class="mt-4">
          <RouterLink v-for="link in section.links" :key="link.to" :to="link.to">{{ link.label }}</RouterLink>
        </p>
      </v-col>

      <v-col
        v-if="section.aside"
        cols="12"
        lg="6"
        class="docs-cards--held d-flex flex-column ga-3 ps-lg-6 mt-6 mt-lg-0"
        tabindex="0"
        :aria-label="`Code for ${section.title}`"
        role="region"
      >
        <DocsCodeblock
          v-if="section.aside.examples"
          v-model:lang="lang"
          :examples="section.aside.examples"
        />
        <DocsCodeblock
          v-if="section.aside.answer?.length"
          v-model:lang="lang"
          :examples="answerExamples(section.aside)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { h, ref } from 'vue';
import DocsCodeblock from './docs.codeblock.component.vue';

defineProps({
  /** The guide: `{ title, lead, base, sections }`. */
  page: { type: Object, required: true },
});

/** The language picked on any code card: every card follows it. */
const lang = ref('bash');

/**
 * Text with `backticks` as inline code, without any HTML in the content.
 * @param {{text: string}} componentProps - The text to render
 * @returns {Array} Text and code nodes
 */
const InlineText = ({ text }) => String(text).split(/`([^`]+)`/)
  .map((part, i) => (i % 2 ? h('code', part) : part));
InlineText.props = ['text'];

/**
 * The answer card's tabs: one card is named by its caption, several by their labels.
 * @param {{answer: Array, caption?: string}} aside - The section's right pane
 * @returns {Array<{lang: string, label: string, code: string}>}
 */
const answerExamples = ({ answer, caption }) => (answer.length > 1
  ? answer
  : [{ ...answer[0], label: caption || 'Response' }]);

</script>
