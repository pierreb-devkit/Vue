<!--
  DocsCodeblockComponent
  ======================
  Runnable code-block for documentation articles. Renders one example as
  language tabs (curl / Node / Python …) when the guide supplies a multi-language
  group, and degrades to a single block when only one language is present.

  COPY: one button copies the current snippet verbatim. The `<YOUR_API_KEY>`
  placeholder stays plain text, rendered and copied as-is; the reader pastes
  their own key in its place.

  PROPS:
  - examples (Array<{ lang, label?, code }>): One entry per language. `lang` is a
    highlight.js language id (e.g. `bash`, `javascript`, `python`); `label` is the
    optional tab label (defaults to a friendly name derived from `lang`); `code`
    is the raw snippet (already containing the `<YOUR_API_KEY>` placeholder where
    relevant). Required, non-empty.
  - lang (String, v-model): The language picked on a sibling card. Followed when
    this card has it, and updated when a tab is clicked here.
-->
<template>
  <v-theme-provider theme="dark" with-background class="docs-codeblock rounded-lg overflow-hidden border" data-test="docs-codeblock">
    <div class="d-flex align-center px-1 border-b">
      <!-- Language tabs (hidden when there is only one example) -->
      <v-tabs
        v-if="examples.length > 1"
        v-model="active"
        density="compact"
        height="38"
        color="primary"
        class="flex-grow-1"
        data-test="docs-codeblock-tabs"
      >
        <v-tab
          v-for="(ex, i) in examples"
          :key="ex.lang + i"
          :value="i"
          class="text-none text-body-small"
          :data-test="`docs-codeblock-tab-${ex.lang}`"
        >
          {{ tabLabel(ex) }}
        </v-tab>
      </v-tabs>
      <span
        v-else
        class="text-body-small text-medium-emphasis px-2 flex-grow-1"
        data-test="docs-codeblock-lang"
      >
        {{ tabLabel(examples[0]) }}
      </span>

      <v-spacer />

      <v-btn
        :icon="copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'"
        :color="copied ? 'success' : undefined"
        variant="text"
        size="x-small"
        class="ml-1 mr-1"
        data-test="docs-codeblock-copy"
        :aria-label="`Copy ${tabLabel(current)} example`"
        @click="copy"
      />
    </div>

    <!-- Rendered snippet: highlighted HTML of the raw code -->
    <!-- eslint-disable vue/no-v-html -- highlightedHtml is highlight.js over the raw snippet, sanitized below -->
    <pre
      class="docs-codeblock__code text-mono"
      data-test="docs-codeblock-code"
    ><code :class="`language-${current.lang}`" v-html="highlightedHtml" /></pre>
    <!-- eslint-enable vue/no-v-html -->
  </v-theme-provider>
</template>

<script>
import hljs from 'highlight.js/lib/common';
import DOMPurify from 'dompurify';
import { createLogger } from '../../../lib/helpers/logger';

const logger = createLogger('docs');

/**
 * The placeholder token guides write in their snippets, rendered and copied verbatim.
 */
export const API_KEY_PLACEHOLDER = '<YOUR_API_KEY>';

/**
 * Friendly fallback labels for common highlight.js language ids.
 */
const LANG_LABELS = {
  bash: 'cURL',
  sh: 'cURL',
  shell: 'cURL',
  curl: 'cURL',
  js: 'Node',
  javascript: 'Node',
  node: 'Node',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  py: 'Python',
  python: 'Python',
  json: 'JSON',
};

export default {
  name: 'DocsCodeblockComponent',
  props: {
    examples: {
      type: Array,
      required: true,
      validator: (rows) => Array.isArray(rows) && rows.length > 0
        && rows.every((r) => r && typeof r.lang === 'string' && typeof r.code === 'string'),
    },
    lang: { type: String, default: undefined },
  },
  emits: ['update:lang'],
  data() {
    return {
      active: 0,
      /** Whether the last copy succeeded (shows the checkmark briefly). */
      copied: false,
      copyTimer: null,
    };
  },
  computed: {
    /**
     * @desc The currently selected example (clamped to a valid index).
     * @returns {{ lang: string, label?: string, code: string }}
     */
    current() {
      const i = Math.min(Math.max(this.active, 0), this.examples.length - 1);
      return this.examples[i] || this.examples[0];
    },
    /**
     * @desc The current snippet highlighted via highlight.js, sanitized.
     * @returns {string} Sanitized HTML for the <code> body.
     */
    highlightedHtml() {
      const { lang, code } = this.current;
      let html;
      if (lang && hljs.getLanguage(lang)) {
        html = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
      } else {
        html = hljs.highlightAuto(code).value;
      }
      return DOMPurify.sanitize(html);
    },
  },
  watch: {
    lang: {
      immediate: true,
      /**
       * @desc Follow the language picked elsewhere, when this card has it.
       * @param {string|undefined} lang - The picked language.
       * @returns {void}
       */
      handler(lang) {
        const i = this.examples.findIndex((ex) => ex.lang === lang);
        if (i >= 0) this.active = i;
      },
    },
    /**
     * @desc A new set of examples (another guide, same card): follow the picked language again.
     * @returns {void}
     */
    examples() {
      const i = this.examples.findIndex((ex) => ex.lang === this.lang);
      if (i >= 0) this.active = i;
    },
    /**
     * @desc Tell the other cards which language was picked here.
     * @param {number} i - The active tab.
     * @returns {void}
     */
    active(i) {
      const lang = this.examples[i]?.lang;
      if (lang && lang !== this.lang) this.$emit('update:lang', lang);
    },
  },
  beforeUnmount() {
    if (this.copyTimer) clearTimeout(this.copyTimer);
  },
  methods: {
    /**
     * @desc Resolve a tab/label for an example.
     * @param {{ lang: string, label?: string }} ex - The example.
     * @returns {string}
     */
    tabLabel(ex) {
      if (!ex) return '';
      if (ex.label) return ex.label;
      return LANG_LABELS[ex.lang] || ex.lang;
    },
    /**
     * @desc Copy the current snippet verbatim (the `<YOUR_API_KEY>` placeholder is preserved).
     * @returns {Promise<void>}
     */
    async copy() {
      // Bail before showing success feedback if the clipboard API is unavailable
      // (insecure context / older browsers) so the checkmark only flashes on a
      // real copy.
      if (!navigator?.clipboard?.writeText) {
        logger.warn('docs codeblock: clipboard API unavailable');
        return;
      }

      try {
        await navigator.clipboard.writeText(this.current.code);
        this.copied = true;
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copied = false;
        }, 1800);
      } catch (err) {
        logger.warn('docs codeblock: clipboard write failed', err);
      }
    },
  },
};
</script>

<style scoped>
/* A code block is raw <pre> output: no Vuetify component renders it. */
.docs-codeblock__code {
  margin: 0;
  padding: 14px 16px;
  font-size: 0.8125rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
}

/* highlight.js only tags the tokens; no highlight theme is loaded. */
.docs-codeblock__code :deep(.hljs-string) {
  color: rgb(var(--v-theme-success));
}

.docs-codeblock__code :deep(.hljs-number),
.docs-codeblock__code :deep(.hljs-literal) {
  color: rgb(var(--v-theme-warning));
}

.docs-codeblock__code :deep(.hljs-keyword),
.docs-codeblock__code :deep(.hljs-built_in),
.docs-codeblock__code :deep(.hljs-attr) {
  font-weight: 500;
}

.docs-codeblock__code :deep(.hljs-comment) {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
