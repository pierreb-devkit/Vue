<!--
  HomeCtaComponent
  ================
  Final call-to-action section with title, subtitle, and dual CTA buttons.

  USAGE:
  <homeCtaComponent :setup="config.home.cta" />

  CONFIG EXAMPLE (setup object):
  cta: {
    variant: 'alternate',
    title: 'Ready to get started?',
    subtitle: 'One sentence reinforcing the key benefit.',
    button: { title: 'Start Free', link: '/signup', color: 'primary' },
    secondaryButton: { title: 'See how it works', link: '/docs' },
  }
-->
<template>
  <section id="cta" :style="sectionStyle">
    <v-container :style="containerStyle">
      <v-row align="center" justify="center" class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="{ title: setup.title, subtitle: setup.subtitle, alignment: 'center' }"></homeContentComponent>
        </v-col>
        <v-col cols="12" class="text-center">
          <v-btn
            v-if="setup.button && setup.button.title && setup.button.link"
            :color="setup.button.color || 'primary'"
            variant="flat"
            size="x-large"
            :class="config.vuetify.theme.rounded"
            :href="setup.button.link"
          >
            {{ setup.button.title }}
          </v-btn>
          <v-btn
            v-if="setup.secondaryButton && setup.secondaryButton.title && setup.secondaryButton.link"
            variant="outlined"
            size="x-large"
            :class="{ [config.vuetify.theme.rounded]: true, 'ml-4': setup.button && setup.button.title && setup.button.link }"
            :href="setup.secondaryButton.link"
          >
            {{ setup.secondaryButton.title }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style, overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
import homeContentComponent from './utils/home.content.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomeCtaComponent',
  components: {
    homeContentComponent,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  /**
   * Initialise component data with the current Vuetify theme instance.
   * @returns {{ theme: import('vuetify').ThemeInstance }} Reactive theme reference.
   */
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
      const hasCustomBg = this.setup?.style?.section?.background;
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        ...colorModeStyle(this.setup.colorMode),
        ...(hasCustomBg ? {} : { background: bgColor }),
      };
    },
  },
};
</script>
