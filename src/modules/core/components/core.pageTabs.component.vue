<template>
  <v-card
    color="surface"
    :flat="config.vuetify.theme.flat"
    :class="config.vuetify.theme.rounded"
    data-test="page-tabs"
  >
    <v-tabs
      :model-value="modelValue"
      color="primary"
      :grow="grow"
      @update:model-value="(v) => $emit('update:modelValue', v)"
    >
      <template v-for="tab in visibleTabs" :key="tab.value">
        <v-tab :value="tab.value" class="text-none text-body-medium">
          <v-icon v-if="tab.icon" :icon="tab.icon" size="small" class="mr-2"></v-icon>
          {{ tab.label }}
        </v-tab>
      </template>
    </v-tabs>
    <v-divider></v-divider>
    <v-window :model-value="modelValue">
      <v-window-item
        v-for="tab in visibleTabs"
        :key="tab.value"
        :value="tab.value"
      >
        <div class="pa-6">
          <slot :name="tab.value"></slot>
        </div>
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script>
/**
 * @desc Reusable page-level tab strip. Wraps PageHeader-bounded
 * pages (Account, Organization, Admin) so the tab styling +
 * inset padding stay aligned with the sidenav across the app.
 *
 * Usage:
 *   <PageTabs v-model="tab" :tabs="tabs">
 *     <template #profile> ... </template>
 *     <template #organizations> ... </template>
 *   </PageTabs>
 *
 * Each `tab` is { value, label, icon?, visible? }. When `visible`
 * is false, the entry is omitted from the strip (used for
 * permission-gated tabs like Subscriptions).
 *
 * `config` is injected via Vue globalProperties (same pattern as
 * CoreDatatable) — provides `config.vuetify.theme.flat` and
 * `config.vuetify.theme.rounded` for surface-consistent card styling.
 */
export default {
  name: 'CorePageTabs',
  props: {
    modelValue: { type: String, required: true },
    tabs: {
      type: Array,
      required: true,
      validator: (arr) => arr.every((t) => t && typeof t.value === 'string' && typeof t.label === 'string'),
    },
    grow: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  computed: {
    /**
     * Returns only tabs where `visible` is not explicitly false.
     * Tabs without a `visible` key are shown by default.
     * @returns {Array<{value: string, label: string, icon?: string, visible?: boolean}>}
     */
    visibleTabs() {
      return this.tabs.filter((t) => t.visible !== false);
    },
  },
};
</script>
