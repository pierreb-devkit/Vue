<!--
  BillingPricingFAQComponent
  ==========================
  FAQ accordion with embedded schema.org `FAQPage` JSON-LD for SEO.

  USAGE:
  <BillingPricingFAQComponent :faqs="[{ id, question, answer }]" />

  PROPS:
  - faqs (Array, required): [{ id: string, question: string, answer: string }]
                            Empty array → renders nothing (no title, no schema).
-->
<template>
  <div v-if="faqs.length > 0" class="billing-pricing-faq mt-12">
    <h2 class="text-headline-medium font-weight-bold mb-6 text-center">
      {{ $t('billing.pricing.faq.title') }}
    </h2>
    <v-expansion-panels variant="accordion" multiple>
      <v-expansion-panel
        v-for="faq in faqs"
        :key="faq.id"
      >
        <v-expansion-panel-title class="text-title-medium font-weight-medium">
          {{ faq.question }}
        </v-expansion-panel-title>
        <v-expansion-panel-text class="text-body-medium">
          {{ faq.answer }}
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Schema.org FAQPage JSON-LD — server-blind but Google/Bing pick it up after Vue renders -->
    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component, vue/no-v-html -- intentional JSON-LD injection, content is machine-generated JSON (no user input) -->
    <component :is="'script'" type="application/ld+json" v-html="schemaJson" />
  </div>
</template>

<script>
export default {
  name: 'BillingPricingFAQComponent',
  props: {
    faqs: {
      type: Array,
      required: true,
    },
  },
  computed: {
    /**
     * @desc Build schema.org FAQPage JSON-LD payload.
     * @returns {string} stringified JSON
     */
    schemaJson() {
      const payload = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: this.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
      return JSON.stringify(payload);
    },
  },
};
</script>
