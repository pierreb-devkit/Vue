<!--
  HomeContentComponent
  ===================
  Unified content component for all home sections.
  Replaces both home.title.component.vue and home.text.component.vue.

  USAGE:
  <homeContentComponent :setup="setup" alignment="center" variant="default" color="default" />

  PROPS:
  - setup (Object, required): Content object
  - alignment (String): 'left' or 'center' - default: 'left'
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
      link: '/docs',
      color: '#EA3F7D',  // Only for card variant
    },
  }
-->
<template>
  <div>
    <v-card-title :class="[computedAlignment === 'center' ? 'text-center' : 'text-left', variant === 'default' ? 'pa-0' : '']">
      <!-- Level 1: Icon + Title (inline) -->
      <div v-if="setup.icon || setup.title" :class="['d-flex align-center ga-2 my-0', computedAlignment === 'center' ? 'justify-center' : '']">
        <v-icon v-if="setup.icon" size="x-small" :color="themeColor || 'primary'">{{ setup.icon }}</v-icon>
        <span
          v-if="setup.title"
          class="text-body-1 font-weight-regular"
          :class="themeColor ? '' : 'text-on-background'"
          :style="themeColor ? { color: themeColor } : {}"
          >{{ setup.title }}</span
        >
      </div>

      <!-- Level 2: Subtitle (H3) -->
      <h4
        v-if="setup.subtitle"
        :class="['text-h4 font-weight-bold mb-4', themeColor ? '' : 'text-secondary']"
        :style="themeColor ? { color: themeColor } : {}"
      >
        <VMarkdown v-if="setup.subtitle && setup.subtitle.includes('**')" :source="setup.subtitle" class="d-inline" />
        <template v-else>{{ setup.subtitle }}</template>
      </h4>
    </v-card-title>

    <v-card-text v-if="setup.text" :class="[computedAlignment === 'center' ? 'text-center' : 'text-left', variant === 'default' ? 'pa-0' : '']">
      <VMarkdown
        :class="['text-body-1', 'font-weight-regular my-4', themeColor ? '' : 'text-medium-emphasis']"
        :style="themeColor ? { color: themeColor } : ''"
        :source="setup.text"
      />
    </v-card-text>

    <v-card-actions
      v-if="setup.button && setup.button.title && setup.button.link"
      :class="[variant === 'default' ? 'pa-0' : '', computedAlignment === 'center' ? 'justify-center' : '']"
    >
      <v-btn
        :href="setup.button.link"
        variant="text"
        class="my-4 text-none text-body-1"
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
  },
  data() {
    const theme = useTheme();
    return {
      theme,
    };
  },
  computed: {
    computedAlignment() {
      return this.setup.alignment || this.alignment;
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
  },
};
</script>
