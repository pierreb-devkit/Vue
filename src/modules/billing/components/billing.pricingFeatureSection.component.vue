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
      class="billing-pricing-feature-section__title text-body-large font-weight-bold mb-2"
    >
      {{ section.title }}
    </h4>
    <p
      v-else-if="resolvedHeading"
      class="billing-pricing-feature-section__inherits text-body-small text-medium-emphasis mb-2"
    >
      {{ resolvedHeading }}
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
            :color="item.enabled === false ? undefined : (item.iconColor || item.color || 'primary')"
            :class="{ 'text-disabled': item.enabled === false }"
            size="small"
            class="mr-3"
          ></v-icon>
        </template>
        <v-list-item-title :class="{ 'text-disabled': item.enabled === false, 'font-weight-semibold': item.highlight }">
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
     * @desc Resolve the section heading with priority:
     *   1. introText on section (project-owned copy, e.g. "Get started with:")
     *   2. inheritsFrom + parentPlanName → "Everything in {parent}, plus"
     *   3. null (no heading rendered)
     * @returns {string|null}
     */
    resolvedHeading() {
      if (this.section.introText) return this.section.introText;
      if (this.section.inheritsFrom && this.parentPlanName) {
        return `Everything in ${this.parentPlanName}, plus`;
      }
      return null;
    },
  },
};
</script>

<style scoped>
/* Separate stacked sections so each category title reads as a group label,
   not as another feature row. Uniform top margin gives the card vertical rhythm;
   the first section sits below the price/CTA/heading so the extra space reads clean. */
.billing-pricing-feature-section {
  margin-top: 1.25rem;
}
/* Allow feature/pack item text to wrap — Vuetify default v-list-item-title
   has white-space: nowrap + text-overflow: ellipsis which truncates substantive
   descriptions like "Stacks on top of subscription quota" into "… q…". */
.billing-pricing-feature-section :deep(.v-list-item-title) {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  line-height: 1.4;
}
</style>
