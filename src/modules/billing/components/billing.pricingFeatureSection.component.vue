<!--
  BillingPricingFeatureSectionComponent
  =====================================
  Renders one feature section inside a pricing card.

  - Optional title (e.g. "Core", "Collaboration")
  - Optional "Everything in {parent}, plus" heading when section.inheritsFrom is set
    (or a project-owned introText override)
  - Feature rows: icon + wrapping label, with optional tooltip, highlight, disabled

  Full Vuetify: components + utility classes only, no scoped CSS. Rows use a
  d-flex layout with a plain <span> so long labels wrap naturally (v-list-item-title
  forces nowrap + ellipsis, which would truncate substantive descriptions).

  USAGE:
  <BillingPricingFeatureSectionComponent
    :section="{ title, inheritsFrom, introText, items: [{ text, icon, iconColor, tooltip, highlight, enabled }] }"
    :parent-plan-name="'Starter'" />

  PROPS:
  - section          (Object, required): { title?, inheritsFrom?, introText?, items: [...] }
  - parentPlanName   (String, optional): parent plan display name for "Everything in {name}, plus"
-->
<template>
  <div class="mt-3">
    <h4
      v-if="section.title"
      class="text-body-large font-weight-bold mb-2"
    >
      {{ section.title }}
    </h4>
    <p
      v-else-if="resolvedHeading"
      class="text-body-small text-medium-emphasis mb-2"
    >
      {{ resolvedHeading }}
    </p>

    <div
      v-for="(item, idx) in section.items"
      :key="`${item.text}-${idx}`"
      class="d-flex align-start ga-3 mb-2"
    >
      <v-icon
        v-if="!item.highlight"
        :icon="item.enabled === false ? 'fa-solid fa-xmark' : (item.icon || 'fa-solid fa-check')"
        :color="item.enabled === false ? undefined : (item.iconColor || item.color || 'primary')"
        :class="{ 'text-medium-emphasis': item.enabled === false }"
        size="small"
        class="mt-1"
      ></v-icon>
      <span
        :class="[
          item.highlight ? 'text-body-1 font-weight-bold text-primary' : 'text-body-2',
          { 'text-medium-emphasis': item.enabled === false },
        ]"
      >
        {{ item.text }}
        <v-tooltip v-if="item.tooltip" :text="item.tooltip" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              icon="fa-solid fa-circle-info"
              size="x-small"
              class="ml-1 text-medium-emphasis"
            ></v-icon>
          </template>
        </v-tooltip>
      </span>
    </div>
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
