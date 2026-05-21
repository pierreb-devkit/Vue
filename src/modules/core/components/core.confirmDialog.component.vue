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
  data() {
    return { typed: '' };
  },
  computed: {
    canConfirm() {
      if (!this.confirmText) return true;
      return this.typed === this.confirmText;
    },
  },
  watch: {
    modelValue(open) {
      if (!open) this.typed = '';
    },
  },
  methods: {
    onCancel() {
      this.$emit('cancel');
      this.$emit('update:modelValue', false);
    },
    onConfirm() {
      if (!this.canConfirm) return;
      this.$emit('confirm');
    },
  },
};
</script>
