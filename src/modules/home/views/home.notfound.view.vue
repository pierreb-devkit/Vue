<template>
  <v-container class="fill-height d-flex align-center justify-center text-center">
    <div>
      <h1 class="text-display-medium font-weight-bold mb-4">{{ notFoundConfig.title }}</h1>
      <p class="text-body-large mb-8">{{ notFoundConfig.message }}</p>
      <v-btn color="primary" :to="{ name: 'Home' }" size="large">{{ notFoundConfig.buttonText }}</v-btn>
    </div>
  </v-container>
</template>

<script>
/**
 * NotFound view — displayed when no route matches.
 */
export default {
  computed: {
    /**
     * Resolved not-found configuration with fallback defaults.
     * @returns {object} Object containing title, message, and buttonText strings.
     */
    notFoundConfig() {
      const defaults = {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        buttonText: 'Go Home',
      };
      return { ...defaults, ...(this.config?.app?.notFound || {}) };
    },
  },
};
</script>
