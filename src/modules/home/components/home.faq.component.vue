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
  <section id="faq" :style="sectionStyle">
    <v-container :style="containerStyle">
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
                :style="cardStyle"
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
import { useTheme } from 'vuetify';
import { useHead } from '@unhead/vue';
import { style, overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
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
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    /**
     * Active visual variant of the section.
     * @returns {string} 'default' or 'alternate'
     */
    variant() {
      return this.setup.variant || 'default';
    },
    /**
     * Inline styles for the v-container, including max-width and optional overlap.
     * @returns {Object}
     */
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.setup.overlap, this.$vuetify?.display),
      };
    },
    /**
     * Inline styles for the section element, using theme background based on variant.
     * @returns {Object}
     */
    sectionStyle() {
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        ...colorModeStyle(this.setup.colorMode),
        background: bgColor,
      };
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
    /**
     * Inline styles for each expansion panel card, using theme surface/background.
     * @returns {Object}
     */
    cardStyle() {
      const cardColor = this.variant === 'alternate' ? this.theme.current.colors.background : this.theme.current.colors.surface;
      return {
        ...style('card', this.setup),
        background: cardColor,
      };
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

