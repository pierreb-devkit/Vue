<!--
  HomeContentComponent
  ===================
  Unified content component for all home sections.
  Replaces both home.title.component.vue and home.text.component.vue.

  USAGE:
  <homeContentComponent :setup="setup" alignment="center" variant="default" color="default" />

  PROPS:
  - setup (Object, required): Content object
  - alignment (String): 'left' | 'center' | 'right' - default: 'left'
  - variant (String): 'default' or 'card' - default: 'default' (card adds padding to elements)
  - color (String): 'default' | 'light' | 'dark' - default: 'default'
    * default: primary/secondary/medium-emphasis colors
    * light: all text in light theme onSurface color
    * dark: all text in dark theme onSurface color

  SETUP OBJECT FORMAT:
  {
    // Level 1: Icon and Title (inline)
    icon: 'fa-solid fa-star',        // FontAwesome icon (primary color)
    title: 'Section Name',           // Normal text, right of icon
    
    // Level 2: Subtitle (H3, secondary color)
    subtitle: 'Main Heading',
    
    // Level 3: Text (normal text, gray, with markdown support)
    text: 'A detailed description that can be longer...',
    
    // Optional: Button
    button: {
      title: 'Learn More',
      link: '/',
      color: '#EA3F7D',  // Only for card variant
    },
  }
-->
<template>
  <div>
    <v-card-title :class="[alignmentClass, variant === 'default' ? 'pa-0' : '']">
      <!-- Level 1: Icon + Title (inline) -->
      <div v-if="setup.icon || setup.title" :class="['d-flex align-center ga-2 my-0', titleRowClass]">
        <v-icon v-if="setup.icon" size="x-small" :color="themeColor || 'primary'">{{ setup.icon }}</v-icon>
        <span
          v-if="setup.title"
          class="text-body-large font-weight-regular"
          :class="themeColor ? '' : 'text-on-background'"
          :style="themeColor ? { color: themeColor } : {}"
          >{{ setup.title }}</span
        >
      </div>

      <!-- Level 2: Subtitle (dynamic heading level) -->
      <component
        :is="'h' + headingLevel"
        v-if="setup.subtitle"
        :class="['text-headline-medium text-sm-headline-large font-weight-bold mb-4', setup.icon || setup.title ? 'mt-3' : 'mt-0', themeColor ? '' : 'text-secondary']"
        :style="themeColor ? { color: themeColor } : {}"
      >
        <VMarkdown v-if="setup.subtitle && setup.subtitle.includes('**')" :source="setup.subtitle" class="d-inline" />
        <template v-else>{{ setup.subtitle }}</template>
      </component>
    </v-card-title>

    <v-card-text v-if="setup.text" :class="[alignmentClass, variant === 'default' ? 'pa-0' : '']">
      <VMarkdown
        :class="['text-body-large', 'font-weight-regular my-4', themeColor ? '' : 'text-medium-emphasis']"
        :style="themeColor ? { color: themeColor } : ''"
        :source="setup.text"
      />
    </v-card-text>

    <v-card-actions
      v-if="setup.button && setup.button.title && setup.button.link"
      :class="[variant === 'default' ? 'pa-0' : '', justifyClass]"
    >
      <v-btn
        :href="setup.button.link"
        :target="buttonTarget"
        :rel="buttonRel"
        variant="text"
        class="my-4 text-none text-body-large"
        :style="themeColor ? { color: setup.button.color || themeColor } : {}"
        size="large"
      >
        {{ setup.button.title }}
        <v-icon class="ml-4" size="x-small">fa-solid fa-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';

/**
 * Export default
 */
export default {
  name: 'HomeContentComponent',
  props: {
    setup: {
      type: Object,
      required: true,
    },
    alignment: {
      type: String,
      default: 'left',
      validator: (value) => ['left', 'center', 'right'].includes(value),
    },
    variant: {
      type: String,
      default: 'default',
    },
    color: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'light', 'dark'].includes(value),
    },
    /**
     * HTML heading level for the subtitle element.
     * @type {number}
     */
    headingLevel: {
      type: Number,
      default: 3,
      validator: (value) => [1, 2, 3, 4, 5, 6].includes(value),
    },
  },
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    computedAlignment() {
      const value = this.setup.alignment || this.alignment;
      return ['left', 'center', 'right'].includes(value) ? value : 'left';
    },
    alignmentClass() {
      if (this.computedAlignment === 'center') return 'text-center';
      if (this.computedAlignment === 'right') return 'text-right';
      return 'text-left';
    },
    justifyClass() {
      if (this.computedAlignment === 'center') return 'justify-center';
      if (this.computedAlignment === 'right') return 'justify-end';
      return 'justify-start';
    },
    /**
     * Justify + (optional) row-reverse class for the icon+title row only.
     *
     * When `computedAlignment === 'right'`, the row is visually reversed via
     * `flex-row-reverse` so the icon sits on the right side of the title.
     * Because `flex-row-reverse` also inverts the main axis, `justify-end`
     * would push items to the LEFT edge, so we use `justify-start` instead —
     * under a reversed row `flex-start` is the right edge, which is what we
     * want for a right-aligned block.
     *
     * Note: `flex-row-reverse` only changes the visual order, not the DOM
     * order. Assistive tech still reads `[icon][title]`, so screen-reader
     * order is preserved.
     *
     * Scoped to the title row only — `v-card-actions` keeps using
     * `justifyClass` so button content order is untouched.
     * @returns {string} space-separated utility classes
     */
    titleRowClass() {
      if (this.computedAlignment === 'right') return 'justify-start flex-row-reverse';
      return this.justifyClass;
    },
    themeColor() {
      if (this.color === 'light') {
        return this.theme.themes.light.colors.onSurface;
      }
      if (this.color === 'dark') {
        return this.theme.themes.dark.colors.onSurface;
      }
      return null;
    },
    buttonTarget() {
      const explicit = this.setup.button?.target;
      if (explicit) return explicit;
      const link = this.setup.button?.link || '';
      return /^https?:\/\//i.test(link) ? '_blank' : null;
    },
    buttonRel() {
      return this.buttonTarget === '_blank' ? 'noopener noreferrer' : null;
    },
  },
};
</script>
