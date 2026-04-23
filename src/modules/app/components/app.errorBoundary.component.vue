<template>
  <slot v-if="!hasError" />
  <v-container v-else class="d-flex align-center justify-center" style="min-height: 60vh">
    <v-alert
      type="error"
      variant="tonal"
      prominent
      max-width="500"
      :rounded="config.vuetify.theme.rounded"
    >
      <template #title>Something went wrong</template>
      <p class="text-body-medium mt-2 mb-4">
        An unexpected error occurred. Please try again.
      </p>
      <v-btn
        color="error"
        variant="flat"
        class="text-none text-body-medium"
        :class="config.vuetify.theme.rounded"
        @click="retry"
      >
        <v-icon start icon="fa-solid fa-rotate-right" />
        Retry
      </v-btn>
    </v-alert>
  </v-container>
</template>

<script>
/**
 * Module dependencies.
 */
import { ref, onErrorCaptured } from 'vue';
import { captureException } from '../../../lib/helpers/errorTracker.js';

/**
 * Component definition.
 */
export default {
  name: 'AppErrorBoundary',
  /**
   * Provides reactive error boundary state and handlers to the template.
   *
   * @returns {{ hasError: import('vue').Ref<boolean>, retry: Function }} Exposed reactive error state and retry handler.
   */
  setup() {
    const hasError = ref(false);

    onErrorCaptured((err) => {
      hasError.value = true;
      captureException(err);
      return false; // prevent propagation
    });

    /**
     * Reset the error state so the wrapped content can be rendered again.
     *
     * @returns {void}
     */
    const retry = () => {
      hasError.value = false;
    };

    return { hasError, retry };
  },
};
</script>
