<!--
  HomePricingComponent
  ====================
  Pricing section for the homepage. Shows plan cards with billing toggle and CTA.

  USAGE:
  <homePricingComponent :setup="config.home.pricing" />

  CONFIG EXAMPLE (setup object):
  pricing: {
    title: 'Pricing',
    subtitle: 'Choose the plan that fits your needs',
    variant: 'alternate',
  }
-->
<template>
  <section id="pricing" :style="sectionStyle">
    <v-container :style="containerStyle">
      <v-row class="px-0 py-8">
        <v-col cols="12">
          <homeContentComponent :setup="setup"></homeContentComponent>
        </v-col>

        <!-- Billing toggle -->
        <v-col cols="12" class="mb-4">
          <billingPricingToggleComponent :annual="annual" @update:annual="annual = $event" />
        </v-col>

        <!-- Plans grid -->
        <v-col
          v-for="plan in mergedPlans"
          :key="plan.id"
          cols="12"
          sm="6"
          md="4"
          data-aos="fade"
        >
          <billingPricingCardComponent
            :plan="plan"
            :annual="annual"
            :current="false"
            @select="onSelectPlan"
          />
        </v-col>

        <!-- CTA -->
        <v-col cols="12" class="text-center mt-4">
          <v-btn
            to="/pricing"
            variant="text"
            class="text-none text-body-large"
            size="large"
          >
            See all plans
            <v-icon class="ml-4" size="x-small">fa-solid fa-arrow-right</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </section>
</template>

<script>
/**
 * Module dependencies.
 */
import { useTheme } from 'vuetify';
import { style, overlapStyle, colorModeStyle } from '../../../lib/helpers/theme';
import { useBillingStore } from '../../billing/stores/billing.store';
import plansConfig from '../../billing/config/billing.config';
import homeContentComponent from './utils/home.content.component.vue';
import billingPricingToggleComponent from '../../billing/components/billing.pricingToggle.component.vue';
import billingPricingCardComponent from '../../billing/components/billing.pricingCard.component.vue';

/**
 * Component definition.
 */
export default {
  name: 'HomePricingComponent',
  components: {
    homeContentComponent,
    billingPricingToggleComponent,
    billingPricingCardComponent,
  },
  props: {
    setup: {
      type: Object,
      required: true,
    },
  },
  data() {
    const theme = useTheme();
    return {
      theme,
      annual: false,
    };
  },
  computed: {
    variant() {
      return this.setup.variant || 'default';
    },
    containerStyle() {
      return {
        'max-width': this.config.vuetify.theme.maxWidth,
        ...overlapStyle(this.setup.overlap, this.$vuetify?.display),
      };
    },
    sectionStyle() {
      const bgColor = this.variant === 'alternate' ? this.theme.current.colors.surface : this.theme.current.colors.background;
      return {
        ...style('section', this.setup),
        ...colorModeStyle(this.setup.colorMode),
        background: bgColor,
      };
    },
    /**
     * @desc Merge static config (features, tagline, badge) with Stripe data (prices).
     * @returns {Array} Plans array with marketing content and pricing data combined
     */
    mergedPlans() {
      const billingStore = useBillingStore();
      return plansConfig.map((staticPlan) => {
        const stripePlan = billingStore.plans.find((p) => p.id === staticPlan.id) || {};
        return {
          ...staticPlan,
          monthlyPrice: stripePlan.monthlyPrice || null,
          annualPrice: stripePlan.annualPrice || null,
        };
      });
    },
  },
  created() {
    const billingStore = useBillingStore();
    billingStore.fetchPlans();
  },
  methods: {
    style,
    /**
     * @desc Handle plan selection — redirect to pricing page.
     */
    onSelectPlan() {
      this.$router.push('/pricing');
    },
  },
};
</script>
