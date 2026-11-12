<template>
  <v-container class="fill-height d-flex align-center justify-center text-center">
    <div>
      <img
        v-if="notFoundConfig.image"
        :src="notFoundConfig.image"
        alt=""
        class="d-block mx-auto mb-6"
        :style="{ width: notFoundConfig.imageWidth, maxWidth: '100%' }"
      />
      <h1 class="text-display-medium font-weight-bold mb-4">{{ notFoundConfig.title }}</h1>
      <p class="text-body-large mb-8">{{ notFoundConfig.message }}</p>
      <v-btn color="primary" :to="{ name: 'Home' }" size="large">{{ notFoundConfig.buttonText }}</v-btn>
    </div>
  </v-container>
</template>

<script>
import { useHead } from '@unhead/vue';

/**
 * NotFound view — displayed when no route matches.
 */
export default {
  /**
   * The server answers 200 with the app shell for any unknown path (it cannot know the
   * client routes), so tell crawlers not to index this page. Removed when the view unmounts.
   * @returns {void}
   */
  setup() {
    useHead({ meta: [{ name: 'robots', content: 'noindex' }] });
  },
  computed: {
    /**
     * Resolved not-found configuration with fallback defaults.
     * `imageWidth` is a CSS length; a number or digit string (env vars arrive as strings) is read as px.
     * @returns {object} Object containing title, message, buttonText, and the optional image / imageWidth.
     */
    notFoundConfig() {
      const defaults = {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        buttonText: 'Go Home',
      };
      const merged = { ...defaults, ...(this.config?.app?.notFound || {}) };
      const { imageWidth } = merged;
      merged.imageWidth = /^\d+(\.\d+)?$/.test(imageWidth) ? `${imageWidth}px` : imageWidth || undefined;
      return merged;
    },
  },
};
</script>
