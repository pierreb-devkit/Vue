<!--
  BillingCardComponent
  ====================
  Unified card for plans AND packs. Accepts a fully-resolved `item` object
  — the parent is responsible for CTA label, variant, action, and disabled state.

  USAGE (plan — from billing.pricing.view.vue):
  <BillingCardComponent :item="resolvedPlanItem" @cta-click="onCtaClick" />

  USAGE (pack — from billing.packs.component.vue):
  <BillingCardComponent :item="resolvedPackItem" @cta-click="onCtaClick" />

  ITEM SCHEMA (fully resolved — parent transforms static-content plan/pack into this):
    id        : string
    title     : string                   — large card heading
    subtitle  : string                   — 1-liner below title
    price     : { amount: string, period: string|null, chip?: { text: string, color?: string } }
                  e.g. { amount: 'FREE', period: null }
                  e.g. { amount: '$39', period: '/month', chip: { text: 'Save 17%', color: 'success' } }
    cta       : {
                  label    : string,                          — resolved label (parent picks "Sign up" / "Current Plan" / etc.)
                  variant  : 'elevated'|'outlined'|'flat'|'tonal',
                  color    : string|null,
                  disabled : boolean,
                  loading  : boolean,
                  to       : string|RouteLocationRaw|null,    — router-link target (v-btn :to passes through). Object form preserves query params.
                }
                Note: static-content plans carry `cta` as a plain string (the label).
                The parent (e.g. billing.pricing.view.vue resolvedPlanItems) expands it
                into this object — the name collision between the two layers is intentional
                but worth flagging for downstream overrides.
    info      : string|null              — ops-eval line, shown between CTA and features
    features  : [{ icon: string, color: string, text: string }]
                — flat feature list (legacy / default). Rendered when `sections` is empty/absent.
    sections  : [{ title?: string,
                   items: [{ text, icon?, iconColor?, tooltip?, highlight?, enabled? }] }]
                — OPTIONAL grouped feature sections. When present (length > 0) they REPLACE the
                  flat `features` list — each section renders via BillingPricingFeatureSectionComponent.
                  Note: item-level color key is `iconColor` (`color` is accepted as a back-compat
                  alias), and `enabled: false` greys an item. Inheritance is PLAN-level only (see
                  `inheritsFrom` / `parentPlanName` below) — a section never carries its own
                  "Everything in …" heading.
    inheritsFrom   : string|null         — OPTIONAL parent plan id (informational; the view resolves the name).
    parentPlanName : string|null         — OPTIONAL resolved parent plan display name. When set AND
                  `sections` is used, the card renders a single "Everything in {parentPlanName}, plus"
                  heading above the sections. The card is DUMB — it never resolves this itself, and it
                  does NOT forward it to the section components (the plan-level heading is the only one).
    badge     : string|null              — e.g. 'MOST POPULAR'
    highlight : boolean                  — elevated card variant

  EVENTS:
  - cta-click ({ id }): emitted on CTA click. Skipped when cta.disabled OR cta.to is set
                        (router-link owns navigation in the latter case — see onCtaClick).
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

    <!-- Features: grouped sections (inheritance-aware) OR flat fallback -->
    <template v-if="item.sections && item.sections.length > 0">
      <!-- Plan-level inheritance heading — rendered ONCE above the sections when the
           view resolved a parent plan name. Styled like the section component's own
           __inherits heading for visual consistency. The card OWNS this heading and
           deliberately does NOT pass parentPlanName down to the section components, so a
           section that declares `inheritsFrom` can never emit a second identical heading. -->
      <p
        v-if="item.parentPlanName"
        class="text-body-small text-medium-emphasis mb-2"
      >
        Everything in {{ item.parentPlanName }}, plus
      </p>
      <BillingPricingFeatureSectionComponent
        v-for="(section, idx) in item.sections"
        :key="`${section.title || 'section'}-${idx}`"
        :section="section"
      />
    </template>
    <template v-else>
      <!-- Features list -->
      <v-list
        v-if="item.features && item.features.length > 0"
        density="compact"
        bg-color="transparent"
        class="pa-0 billing-card__flat-features"
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
    </template>
  </v-card>
</template>

<script>
import BillingPricingFeatureSectionComponent from './billing.pricingFeatureSection.component.vue';

export default {
  name: 'BillingCardComponent',

  components: {
    BillingPricingFeatureSectionComponent,
  },

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
     * Skip when cta.to is set: v-btn binds router-link via :to and handles navigation
     * natively. Emitting in that case would trigger duplicate navigation from the
     * parent's @cta-click handler (which may push to a different target URL —
     * observed bug: free+guest plan with cta.to='/signup' double-navigated and
     * dropped the redirect query param).
     * @returns {void}
     */
    onCtaClick() {
      if (this.item.cta.disabled) return;
      if (this.item.cta.to) return;
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
   clips by default). Used by ops-eval features that list multi-line descriptions.
   Scoped to the FLAT features list only — grouped section items own their own
   white-space rule (BillingPricingFeatureSectionComponent) and must not inherit
   pre-line, which would otherwise cascade at equal specificity. */
.billing-card__flat-features :deep(.v-list-item-title) {
  white-space: pre-line;
}
</style>
