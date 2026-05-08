<!--
  BillingPricingFeatureSectionComponent
  =====================================
  Renders one feature section inside a pricing card.

  - Optional title (e.g. "Core", "Collaboration")
  - Optional "Everything in {parent}, plus" heading when section.inheritsFrom is set
  - Bulleted list of items with optional icon, tooltip, and highlight flag

  USAGE:
  <BillingPricingFeatureSectionComponent
    :section="{ title, inheritsFrom, items: [{ text, icon, tooltip, highlight }] }"
    :parent-plan-name="'Starter'" />

  PROPS:
  - section          (Object, required): { title?: string, inheritsFrom?: string, items: [...] }
  - parentPlanName   (String, optional): Display name of the parent plan, used to render "Everything in {name}, plus"
-->
<template>
  <div class="billing-pricing-feature-section">
    <h4
      v-if="section.title"
      class="billing-pricing-feature-section__title text-title-small font-weight-medium mb-2"
    >
      {{ section.title }}
    </h4>
    <p
      v-else-if="inheritsHeading"
      class="billing-pricing-feature-section__inherits text-body-small text-medium-emphasis mb-2"
    >
      {{ inheritsHeading }}
    </p>

    <v-list density="compact" bg-color="transparent" class="pa-0">
      <v-list-item
        v-for="(item, idx) in section.items"
        :key="`${item.text}-${idx}`"
        :class="[
          'px-0',
          {
            'billing-pricing-feature-section__item--highlight': item.highlight,
            'billing-pricing-feature-section__item--disabled': item.enabled === false,
          },
        ]"
      >
        <template #prepend>
          <v-icon
            :icon="item.icon || 'fa-solid fa-check'"
            :color="item.enabled === false ? undefined : (item.iconColor || 'primary')"
            :class="{ 'text-disabled': item.enabled === false }"
            size="small"
            class="mr-3"
          ></v-icon>
        </template>
        <v-list-item-title>
          <span>{{ item.text }}</span>
          <v-tooltip v-if="item.tooltip" :text="item.tooltip" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-icon
                v-bind="tooltipProps"
                icon="fa-solid fa-circle-info"
                size="x-small"
                class="ml-2 text-medium-emphasis"
              ></v-icon>
            </template>
          </v-tooltip>
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
/**
 * Component definition.
 */
export default {
  name: 'BillingPricingFeatureSectionComponent',
  props: {
    section: {
      type: Object,
      required: true,
    },
    parentPlanName: {
      type: String,
      default: null,
    },
  },
  computed: {
    /**
     * @desc Render "Everything in {parent}, plus" when the section inherits and we have a parent name.
     * @returns {string|null}
     */
    inheritsHeading() {
      if (!this.section.inheritsFrom || !this.parentPlanName) return null;
      return this.$t('billing.pricingFeatureSection.everythingIn', { plan: this.parentPlanName });
    },
  },
};
</script>

<style scoped>
.billing-pricing-feature-section__item--highlight :deep(.v-list-item-title) {
  font-weight: 600;
}

.billing-pricing-feature-section__item--disabled :deep(.v-list-item-title) {
  color: rgba(var(--v-theme-on-surface), 0.38);
}
</style>
