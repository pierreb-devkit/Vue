<template>
  <v-container class="fill-height" :style="`max-width: ${config.vuetify?.theme?.maxWidth || '100%'}`">
    <v-row align="center" justify="center">
      <v-col cols="12" class="text-center">
        <h1 class="text-h2 font-weight-bold mb-4">404</h1>
        <h2 class="text-h4 mb-4">{{ notFoundConfig.title }}</h2>
        <p class="text-body-1 mb-8">{{ notFoundConfig.message }}</p>
        <v-btn color="primary" to="/" size="large">
          {{ notFoundConfig.buttonText }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * Not Found (404) view component.
 *
 * Displays a user-friendly 404 page when no route matches.
 * Reads title, message, and button text from app config.
 */
export default {
  computed: {
    /**
     * Resolved notFound configuration with sensible defaults.
     * @returns {{ title: string, message: string, buttonText: string }} notFound display strings.
     */
    notFoundConfig() {
      const defaults = {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        buttonText: 'Go Home',
      };
      return { ...defaults, ...(this.config.app?.notFound || {}) };
    },
  },
};
</script>
