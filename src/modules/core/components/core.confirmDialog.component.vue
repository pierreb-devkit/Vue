<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="maxWidth"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card :class="config.vuetify.theme.rounded" class="pa-4">
      <v-card-title class="text-title-large font-weight-medium" :class="titleClass">
        {{ title }}
      </v-card-title>
      <v-card-text class="text-body-medium">
        <slot>
          <p class="mb-0">{{ message }}</p>
        </slot>
        <v-text-field
          v-if="confirmText"
          v-model="typed"
          :label="`Type ${confirmText} to confirm`"
          variant="outlined"
          density="compact"
          autocomplete="off"
          autofocus
          hide-details="auto"
          class="mt-4"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          class="text-none text-body-medium"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          :class="config.vuetify.theme.rounded"
          class="text-none text-body-medium"
          :disabled="loading || !canConfirm"
          :loading="loading"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'CoreConfirmDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    confirmLabel: { type: String, default: 'Confirm' },
    cancelLabel: { type: String, default: 'Cancel' },
    confirmColor: { type: String, default: 'primary' },
    titleClass: { type: String, default: '' },
    confirmText: { type: String, default: '' },
    maxWidth: { type: [Number, String], default: 440 },
    loading: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  /**
   * @desc Local reactive state. `typed` holds the user's text-field input when
   *       a `confirmText` typed-gate is active.
   * @returns {{ typed: string }}
   */
  data() {
    return { typed: '' };
  },
  computed: {
    /**
     * @desc Whether the confirm button should be enabled. Always true when no
     *       `confirmText` is required; otherwise requires an exact string match.
     * @returns {boolean}
     */
    canConfirm() {
      if (!this.confirmText) return true;
      return this.typed === this.confirmText;
    },
  },
  watch: {
    /**
     * @desc Reset the typed-gate input whenever the dialog closes so the next
     *       opening starts clean.
     * @param {boolean} open - New `modelValue` (true = dialog opened, false = closed).
     * @returns {void}
     */
    modelValue(open) {
      if (!open) this.typed = '';
    },
  },
  methods: {
    /**
     * @desc Handle the cancel action: emit `cancel` then close the dialog via
     *       `update:modelValue`.
     * @returns {void}
     */
    onCancel() {
      this.$emit('cancel');
      this.$emit('update:modelValue', false);
    },
    /**
     * @desc Handle the confirm action: emit `confirm` only when `canConfirm` is
     *       true. The dialog does NOT self-close — the parent controls closing
     *       via the v-model binding (intentional, to support async loading states).
     * @returns {void}
     */
    onConfirm() {
      if (!this.canConfirm) return;
      this.$emit('confirm');
    },
  },
};
</script>
