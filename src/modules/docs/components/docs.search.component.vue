<template>
  <div class="docs-search" data-test="docs-search">
    <!-- Trigger: opens the search modal (also bound to ⌘K / Ctrl+K / "/"). -->
    <v-btn
      variant="tonal"
      rounded="lg"
      class="docs-search__trigger text-none justify-start"
      prepend-icon="fa-solid fa-magnifying-glass"
      :block="block"
      :size="size"
      data-test="docs-search-trigger"
      @click="open"
    >
      <span class="text-medium-emphasis">{{ triggerLabel }}</span>
      <v-spacer />
      <span class="docs-search__kbd d-none d-sm-inline-flex text-caption">{{ shortcutHint }}</span>
    </v-btn>

    <!-- Search modal — a client-side fuzzy match over the guide tree. -->
    <v-dialog
      v-model="dialog"
      max-width="640"
      scrollable
      :scrim="true"
      data-test="docs-search-dialog"
    >
      <v-card rounded="xl" class="docs-search__card">
        <v-card-item class="pb-1">
          <v-text-field
            ref="inputRef"
            v-model="query"
            variant="solo-filled"
            flat
            rounded="lg"
            hide-details
            autofocus
            clearable
            :placeholder="placeholder"
            prepend-inner-icon="fa-solid fa-magnifying-glass"
            data-test="docs-search-input"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc.prevent="close"
          />
        </v-card-item>

        <v-card-text class="docs-search__results pa-2">
          <!-- Results -->
          <v-list
            v-if="results.length"
            density="comfortable"
            bg-color="transparent"
            nav
            data-test="docs-search-results"
          >
            <v-list-item
              v-for="(hit, i) in results"
              :key="`${hit.category}/${hit.slug}`"
              :active="i === activeIndex"
              rounded="lg"
              color="primary"
              prepend-icon="fa-solid fa-file-lines"
              :data-test="`docs-search-result`"
              @click="go(hit)"
              @mouseenter="activeIndex = i"
            >
              <v-list-item-title class="text-body-medium font-weight-medium">
                {{ hit.title }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="hit.categoryTitle" class="text-caption">
                {{ hit.categoryTitle }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <!-- Empty (query entered, nothing matched) -->
          <div
            v-else-if="query"
            class="text-center text-medium-emphasis py-8"
            data-test="docs-search-empty"
          >
            <v-icon icon="fa-solid fa-magnifying-glass" size="28" class="mb-2 d-block mx-auto" />
            <p class="text-body-medium">No results for “{{ query }}”.</p>
          </div>

          <!-- Idle (no query yet) -->
          <div
            v-else
            class="text-center text-medium-emphasis py-8"
            data-test="docs-search-idle"
          >
            <p class="text-body-medium">{{ idleLabel }}</p>
          </div>
        </v-card-text>

        <v-divider />
        <v-card-actions class="px-4 py-2 text-caption text-medium-emphasis">
          <span class="docs-search__kbd">↑↓</span>
          <span class="ml-1">to navigate</span>
          <span class="docs-search__kbd ml-3">↵</span>
          <span class="ml-1">to open</span>
          <span class="docs-search__kbd ml-3">esc</span>
          <span class="ml-1">to close</span>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
/**
 * Docs search.
 *
 * A dependency-free, client-side fuzzy match: a subsequence match over the
 * guide titles/summaries/categories from the docs store. Works everywhere with
 * zero external setup (and in tests) — no hosted index, no extra dependency.
 *
 * Opening: a ⌘K (mac) / Ctrl+K shortcut, a "/" shortcut (when not typing in a
 * field), and the visible trigger button. Mounted in the docs home + nav.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDocsStore } from '../stores/docs.store';
import config from '@/config';

defineProps({
  /** Render the trigger button full-width (used in the nav sidebar + home hero). */
  block: { type: Boolean, default: false },
  /** Vuetify size for the trigger button (e.g. 'large' for the home hero). */
  size: { type: String, default: undefined },
});

const router = useRouter();
const store = useDocsStore();

const searchConfig = computed(() => config?.docs?.search || {});
const placeholder = computed(() => searchConfig.value.placeholder || 'Search the docs…');
const triggerLabel = computed(() => searchConfig.value.label || 'Search');
const idleLabel = computed(() => searchConfig.value.idleLabel || 'Type to search the documentation.');

/** Max hits shown (keeps the modal scannable). */
const MAX_RESULTS = 8;

const dialog = ref(false);
const query = ref('');
const activeIndex = ref(0);
const inputRef = ref(null);

/**
 * Subsequence ("fuzzy") test: every char of `needle` appears in `haystack`
 * in order. Cheap, dependency-free, and forgiving of typos/abbreviations.
 * @param {string} needle - The (lower-cased) query.
 * @param {string} haystack - The (lower-cased) candidate text.
 * @returns {boolean}
 */
const subsequence = (needle, haystack) => {
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j += 1) {
    if (haystack[j] === needle[i]) i += 1;
  }
  return i === needle.length;
};

/**
 * Map of category slug → category title, for result subtitles.
 * @returns {Record<string, string>}
 */
const categoryTitles = computed(() => {
  const cats = Array.isArray(store.tree?.categories) ? store.tree.categories : [];
  return cats.reduce((acc, c) => {
    if (c?.slug) acc[c.slug] = c.title || c.slug;
    return acc;
  }, {});
});

/**
 * Client-side fuzzy results over the flattened guide tree. Ranks exact
 * substring matches in the title above subsequence matches, and matches over
 * title + summary/description + category so abbreviations resolve.
 * @returns {Array<{ slug: string, title: string, category: string, categoryTitle: string }>}
 */
const results = computed(() => {
  const q = String(query.value || '').trim().toLowerCase();
  if (!q) return [];
  const articles = Array.isArray(store.orderedArticles) ? store.orderedArticles : [];

  const scored = [];
  articles.forEach((art) => {
    const title = String(art?.title || '').toLowerCase();
    const summary = String(art?.summary || art?.description || '').toLowerCase();
    const category = String(art?.category || '').toLowerCase();
    const haystack = `${title} ${summary} ${category}`;

    let score = -1;
    if (title.startsWith(q)) score = 0;
    else if (title.includes(q)) score = 1;
    else if (summary.includes(q)) score = 2;
    else if (subsequence(q, haystack)) score = 3;

    if (score >= 0) {
      scored.push({
        score,
        slug: art.slug,
        title: art.title,
        category: art.category,
        categoryTitle: categoryTitles.value[art.category] || '',
      });
    }
  });

  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_RESULTS)
    .map(({ score, ...hit }) => hit); // eslint-disable-line no-unused-vars
});

/** Keep the active index in range as results change. */
watch(results, () => {
  activeIndex.value = 0;
});

/**
 * Move the active selection up/down within the result list (wrapping).
 * @param {number} delta - +1 (down) or -1 (up).
 * @returns {void}
 */
const move = (delta) => {
  const n = results.value.length;
  if (!n) return;
  activeIndex.value = (activeIndex.value + delta + n) % n;
};

/**
 * Navigate to an article hit and close the modal.
 * @param {{ category: string, slug: string }} hit - The selected article.
 * @returns {void}
 */
const go = (hit) => {
  if (!hit) return;
  close();
  router.push(`/docs/${hit.category}/${hit.slug}`).catch(() => {});
};

/** Open the currently highlighted result (Enter key). */
const selectActive = () => {
  go(results.value[activeIndex.value]);
};

/** Open the search modal, ensuring the guide tree is loaded for the search. */
const open = () => {
  dialog.value = true;
};

/** Close the search modal and reset transient state. */
const close = () => {
  dialog.value = false;
};

watch(dialog, async (isOpen) => {
  if (!isOpen) {
    query.value = '';
    activeIndex.value = 0;
    return;
  }
  // Ensure the tree is loaded so the search has something to match.
  store.fetchTree().catch(() => {});
  await nextTick();
  inputRef.value?.focus?.();
});

/**
 * Global keyboard shortcuts: ⌘K / Ctrl+K toggles the modal; "/" opens it when
 * the user is not already typing in an input/textarea/contenteditable.
 * @param {KeyboardEvent} e - The keydown event.
 * @returns {void}
 */
const onKeydown = (e) => {
  const isCmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
  if (isCmdK) {
    e.preventDefault();
    dialog.value = !dialog.value;
    return;
  }
  if (e.key === '/' && !dialog.value) {
    const el = e.target;
    const tag = el?.tagName ? el.tagName.toLowerCase() : '';
    const typing = tag === 'input' || tag === 'textarea' || el?.isContentEditable;
    if (typing) return;
    e.preventDefault();
    open();
  }
};

/** Display the platform-appropriate shortcut hint (⌘K on mac, Ctrl K elsewhere). */
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
const shortcutHint = computed(() => (isMac ? '⌘K' : 'Ctrl K'));

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});

defineExpose({ open, close });
</script>

<style scoped>
/* Floor only the inline (non-block) trigger; block usages (nav sidebar + home
   hero) fill their container, so this must not override Vuetify's block width. */
.docs-search__trigger:not(.v-btn--block) {
  min-width: 180px;
}

.docs-search__kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.7rem;
  line-height: 1;
}

.docs-search__results {
  min-height: 160px;
  max-height: 56vh;
}
</style>
