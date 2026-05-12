<!--
  BillingCardComponent
  ====================
  Unified card for plans AND packs. Accepts a fully-resolved `item` object
  — the parent is responsible for CTA label, variant, action, and disabled state.

  USAGE (plan — from billing.pricing.view.vue):
  <BillingCardComponent :item="resolvedPlanItem" @cta-click="onCtaClick" />

  USAGE (pack — from billing.packs.component.vue):
  <BillingCardComponent :item="resolvedPackItem" @cta-click="onCtaClick" />

  ITEM SCHEMA:
    id        : string
    title     : string                   — large card heading
    subtitle  : string                   — 1-liner below title
    price     : { amount: string, period: string|null }
                  e.g. { amount: 'FREE', period: null }
                  e.g. { amount: '$39', period: '/month' }
    cta       : {
                  label    : string,
                  variant  : 'elevated'|'outlined'|'flat'|'tonal',
                  color    : string|null,
                  disabled : boolean,
                  loading  : boolean,
                  to       : string|null,   — router-link target (free plan signup)
                }
    info      : string|null              — ops-eval line, shown between CTA and features
    features  : [{ icon: string, color: string, text: string }]
    badge     : string|null              — e.g. 'MOST POPULAR'
    highlight : boolean                  — elevated card variant

  EVENTS:
  - cta-click ({ id }): emitted on CTA click (parent handles routing/checkout)
-->
<template>
  <v-card
    :class="['billing-card pa-6 d-flex flex-column', config.vuetify.theme.rounded]"
    :flat="config.vuetify.theme.flat"
    :elevation="item.highlight ? 8 : 1"
    height="100%"
  >
    <!-- Badge (floating above card top — accepted exception, doesn't shift content) -->
    <v-chip
      v-if="item.badge"
      color="primary"
      variant="flat"
      size="small"
      class="billing-card__badge"
    >
      {{ item.badge }}
    </v-chip>

    <!-- Title & subtitle -->
    <h3 class="text-headline-small font-weight-bold mb-0">{{ item.title }}</h3>
    <p class="text-body-medium text-medium-emphasis mt-0 mb-5">{{ item.subtitle }}</p>

    <!-- Price -->
    <div class="mb-6 d-flex align-baseline ga-2 flex-wrap">
      <span class="text-display-small font-weight-bold">{{ item.price.amount }}</span>
      <span v-if="item.price.period" class="text-body-medium text-medium-emphasis">{{ item.price.period }}</span>
      <v-chip
        v-if="item.price.chip"
        :color="item.price.chip.color || 'success'"
        size="small"
        variant="tonal"
      >
        {{ item.price.chip.text }}
      </v-chip>
    </div>

    <!-- CTA -->
    <div class="mb-4">
      <v-btn
        block
        :variant="item.cta.variant"
        :color="item.cta.color || undefined"
        :class="config.vuetify.theme.rounded"
        class="text-none font-weight-bold"
        size="large"
        :loading="item.cta.loading"
        :disabled="item.cta.disabled"
        :to="item.cta.to || undefined"
        @click="onCtaClick"
      >
        {{ item.cta.label }}
      </v-btn>
    </div>

    <!-- Info line (ops-eval) -->
    <p v-if="item.info" class="text-body-small text-medium-emphasis mb-4">{{ item.info }}</p>

    <!-- Features list -->
    <v-list
      v-if="item.features && item.features.length > 0"
      density="compact"
      bg-color="transparent"
      class="pa-0"
    >
      <v-list-item
        v-for="feature in item.features"
        :key="feature.text"
        class="px-0"
      >
        <template #prepend>
          <v-icon
            :icon="feature.icon || 'fa-solid fa-check'"
            :color="feature.color || 'primary'"
            size="small"
            class="mr-3"
          />
        </template>
        <v-list-item-title>{{ feature.text }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
export default {
  name: 'BillingCardComponent',

  props: {
    /**
     * @desc Fully-resolved card item. Parent builds this from static-content + store state.
     * @type {Object}
     */
    item: { type: Object, required: true },
  },

  emits: ['cta-click'],

  methods: {
    /**
     * @desc Emit cta-click with the item id. Parent handles routing/checkout action.
     * Skip when CTA is disabled to avoid ghost clicks on v-btn click-through.
     * @returns {void}
     */
    onCtaClick() {
      if (this.item.cta.disabled) return;
      this.$emit('cta-click', { id: this.item.id });
    },
  },
};
</script>

<style scoped>
/* Exception: floating badge so highlighted card content stays aligned
   with non-highlighted cards. Badge is config-driven via item.badge. */
.billing-card { position: relative; overflow: visible; }
.billing-card :deep(.v-card__overlay),
.billing-card :deep(.v-card__underlay) { overflow: visible; }
.billing-card__badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}
/* Allow `\n` in feature.text to render as line breaks (Vuetify v-list-item-title
   clips by default). Used by ops-eval features that list scraps / autofixes / stealth. */
.billing-card :deep(.v-list-item-title) {
  white-space: pre-line;
}
</style>
