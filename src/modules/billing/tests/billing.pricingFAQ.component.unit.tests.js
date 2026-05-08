/**
 * Unit tests for BillingPricingFAQComponent.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingFAQComponent from '../components/billing.pricingFAQ.component.vue';

const vuetify = createVuetify();
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: { billing: { pricing: { faq: { title: 'Frequently asked questions' } } } },
  },
});

describe('BillingPricingFAQComponent', () => {
  it('renders title and one expansion panel per FAQ entry', () => {
    const faqs = [
      { id: 'q1', question: 'What is X?', answer: 'X is Y.' },
      { id: 'q2', question: 'Does it reset?', answer: 'Yes, weekly.' },
    ];
    const wrapper = mount(BillingPricingFAQComponent, {
      props: { faqs },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('Frequently asked questions');
    expect(wrapper.findAll('.v-expansion-panel')).toHaveLength(2);
  });

  it('renders nothing (empty container) when faqs is empty', () => {
    const wrapper = mount(BillingPricingFAQComponent, {
      props: { faqs: [] },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.find('.v-expansion-panels').exists()).toBe(false);
  });

  it('emits a JSON-LD script with schema.org FAQPage shape', () => {
    const faqs = [{ id: 'q1', question: 'What is X?', answer: 'X is Y.' }];
    const wrapper = mount(BillingPricingFAQComponent, {
      props: { faqs },
      global: { plugins: [vuetify, i18n] },
    });
    const script = wrapper.find('script[type="application/ld+json"]');
    expect(script.exists()).toBe(true);
    const parsed = JSON.parse(script.element.textContent);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toHaveLength(1);
    expect(parsed.mainEntity[0]['@type']).toBe('Question');
    expect(parsed.mainEntity[0].name).toBe('What is X?');
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe('X is Y.');
  });

  it('escapes < in JSON-LD output to prevent script-tag breakout', () => {
    const faqs = [{ id: 'q1', question: 'Safe?', answer: 'Yes </script> safe.' }];
    const wrapper = mount(BillingPricingFAQComponent, {
      props: { faqs },
      global: { plugins: [vuetify, i18n] },
    });
    const script = wrapper.find('script[type="application/ld+json"]');
    // The raw JSON string must not contain a literal '<' (angle-bracket is unicode-escaped).
    // We check textContent which holds the raw JSON, not outerHTML (which always ends with the tag).
    expect(script.element.textContent).not.toContain('<');
    // But parsed value must still round-trip correctly via JSON.parse unicode escape support.
    const parsed = JSON.parse(script.element.textContent);
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe('Yes </script> safe.');
  });
});
