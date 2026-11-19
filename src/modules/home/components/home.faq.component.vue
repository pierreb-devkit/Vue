<!--
  HomeFaqComponent
  ================
  FAQ accordion section with JSON-LD FAQPage schema and markdown answers.

  USAGE:
  <homeFaqComponent :setup="config.home.faq" />

  CONFIG EXAMPLE (setup object):
  faq: {
    icon: 'fa-solid fa-circle-question',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know',
    variant: 'default',
    alignment: 'center',
    overlap: false,
    style: { section: {}, card: {} },
    content: [
      { question: 'How does it work?', answer: 'Markdown **supported**...' },
      { question: 'Is there a free trial?', answer: 'Yes, 14 days no credit card required.' },
    ],
  }
-->
<template>
  <section id="faq" :style="styles.section">
    <v-container :max-width="config.vuetify.theme.maxWidth" :style="styles.container">
      <v-row class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="{ icon: setup.icon, title: setup.title, alignment: setup.alignment }"></homeContentComponent>
        </v-col>
        <v-col v-if="setup.subtitle" cols="12">
          <homeContentComponent :setup="{ subtitle: setup.subtitle, alignment: setup.alignment }"></homeContentComponent>
        </v-col>
        <template v-for="(column, ci) in columns" :key="ci">
          <v-col cols="12" :md="colWidth" :offset-md="columns.length === 1 ? 2 : 0">
            <v-expansion-panels flat>
              <v-expansion-panel
                v-for="(item, index) in column"
                :key="`${ci}-${index}`"
                :style="styles.card"
                :class="`mb-3 ${config.vuetify.theme.rounded}`"
                elevation="0"
              >
                <v-expansion-panel-title>
                  <span class="text-body-large font-weight-medium">{{ item.question }}</span>
                  <template #actions="{ expanded }">
                    <v-fade-transition leave-absolute>
                      <v-icon :key="expanded" :icon="expanded ? 'fa-solid fa-minus' : 'fa-solid fa-plus'" size="x-small" color="primary" />
                    </v-fade-transition>
                  </template>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <homeContentComponent :setup="{ text: item.answer }" />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </template>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useHead } from '@unhead/vue';
import { sectionStyles } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomeFaqComponent',
  components: {
    homeContentComponent,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    if (props.setup.content && props.setup.content.length) {
      useHead({
        script: [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: props.setup.content
                .filter((item) => item.question && item.answer)
                .map((item) => ({
                  '@type': 'Question',
                  name: item.question,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer,
                  },
                })),
            }).replace(/</g, '\\u003c'),
          },
        ],
      });
    }

    return {};
  },
  computed: {
    /**
     * Inline styles of the section, its container and its cards (theme helper).
     * @returns {{ section: Object, container: Object, card: Object, background: String }}
     */
    styles() {
      return sectionStyles(this.setup, this.$vuetify?.display);
    },
    /**
     * Active visual variant of the section.
     * @returns {string} 'default' or 'alternate'
     */
    variant() {
      return this.setup.variant || 'default';
    },
    /**
     * Splits FAQ content into 1 or 2 columns; empty columns are filtered out.
     * @returns {Array<Array<Object>>}
     */
    columns() {
      const content = (this.setup.content || []).filter((item) => item?.question && item?.answer);
      if ((this.setup.columns || 1) === 2) {
        const half = Math.ceil(content.length / 2);
        const cols = [content.slice(0, half), content.slice(half)];
        return cols.filter((col) => col.length > 0);
      }
      return content.length ? [content] : [];
    },
    /**
     * Column width in Vuetify grid units for md+ breakpoints.
     * @returns {number}
     */
    colWidth() {
      return (this.setup.columns || 1) === 2 ? 6 : 8;
    },
  },
  mounted() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-faq-reduced-motion', '');
    styleEl.textContent = '#faq .v-expansion-panel-text__wrapper { transition-duration: 0ms !important; }';
    document.head.appendChild(styleEl);
    this.reducedMotionStyle = styleEl;
  },
  beforeUnmount() {
    if (this.reducedMotionStyle && this.reducedMotionStyle.parentNode) {
      this.reducedMotionStyle.parentNode.removeChild(this.reducedMotionStyle);
    }
  },
};
</script>

