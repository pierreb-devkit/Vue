<!--
  DocsCodeblockComponent
  ======================
  Runnable code-block for documentation articles. Renders one example as
  language tabs (curl / Node / Python …) when the guide supplies a multi-language
  group, and degrades to a single block when only one language is present.

  COPY-WITH-MY-KEY (placeholder-only in the stack):
  - The rendered snippet always shows the static `<YOUR_API_KEY>` placeholder.
  - The "Copy with my key" affordance (shown when logged in) copies the snippet
    verbatim — the user pastes their own key in place of the placeholder.
  - A downstream project MAY extend this to substitute a real per-user key into
    the CLIPBOARD text only (never the rendered DOM). The stack ships the
    placeholder-only behaviour: NO key fetch, no key in the DOM, ever.

  INVARIANT: a real key is NEVER injected into the rendered/prerendered DOM.

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
          class="text-none text-caption"
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

      <!-- Copy with my key (only when logged in) — copies the snippet verbatim
           with the static placeholder; the user pastes their own key in. -->
      <v-btn
        v-if="isLoggedIn"
        :prepend-icon="copied === 'key' ? 'fa-solid fa-check' : 'fa-solid fa-key'"
        :color="copied === 'key' ? 'success' : undefined"
        variant="text"
        size="small"
        density="comfortable"
        class="text-none text-caption"
        data-test="docs-codeblock-copy-key"
        :aria-label="`Copy ${tabLabel(current)} example with my API key`"
        @click="copy(true)"
      >
        {{ copied === 'key' ? 'Copied' : 'Copy with my key' }}
      </v-btn>

      <!-- Plain copy -->
      <v-btn
        :icon="copied === 'plain' ? 'fa-solid fa-check' : 'fa-regular fa-copy'"
        :color="copied === 'plain' ? 'success' : undefined"
        variant="text"
        size="x-small"
        class="ml-1 mr-1"
        data-test="docs-codeblock-copy"
        :aria-label="`Copy ${tabLabel(current)} example`"
        @click="copy(false)"
      />
    </div>

    <!-- Rendered snippet: highlighted HTML with the STATIC placeholder only -->
    <!-- eslint-disable vue/no-v-html -- highlightedHtml is highlight.js over the raw snippet, sanitized below; never contains a real key -->
    <pre
      class="docs-codeblock__code"
      data-test="docs-codeblock-code"
    ><code :class="`language-${current.lang}`" v-html="highlightedHtml" /></pre>
    <!-- eslint-enable vue/no-v-html -->
  </v-theme-provider>
</template>

<script>
import hljs from 'highlight.js/lib/common';
import DOMPurify from 'dompurify';
import { useAuthStore } from '../../auth/stores/auth.store';

/**
 * The placeholder token rendered in the DOM AND copied verbatim. The stack
 * never substitutes a real key; a downstream project may extend `copy()` to
 * substitute it into the CLIPBOARD text only.
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
  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },
  data() {
    return {
      active: 0,
      /** @type {'plain'|'key'|null} which copy button last succeeded (for the checkmark) */
      copied: null,
      copyTimer: null,
    };
  },
  computed: {
    /**
     * @desc Whether a logged-in user is present (drives the "Copy with my key" button).
     * @returns {boolean}
     */
    isLoggedIn() {
      return !!this.authStore.isLoggedIn;
    },
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
     *       Operates on the RAW code (placeholder intact) — no real key is ever
     *       highlighted or rendered.
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
     * @desc Copy the current snippet verbatim (the static `<YOUR_API_KEY>`
     *   placeholder is preserved). `withKey` only drives which button flashes
     *   the success checkmark — the stack never substitutes a real key (a
     *   downstream project may extend this to do clipboard-only substitution).
     * @param {boolean} withKey - Which affordance triggered the copy.
     * @returns {Promise<void>}
     */
    async copy(withKey) {
      // Bail before showing success feedback if the clipboard API is unavailable
      // (insecure context / older browsers) so the checkmark only flashes on a
      // real copy.
      if (!navigator?.clipboard?.writeText) {
        console.warn('docs codeblock: clipboard API unavailable');
        return;
      }

      const text = this.current.code;

      try {
        await navigator.clipboard.writeText(text);
        this.copied = withKey ? 'key' : 'plain';
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => {
          this.copied = null;
        }, 1800);
      } catch (err) {
        console.warn('docs codeblock: clipboard write failed', err);
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
  font-family: monospace;
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
