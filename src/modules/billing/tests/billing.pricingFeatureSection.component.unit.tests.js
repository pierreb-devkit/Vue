/**
 * Unit tests for BillingPricingFeatureSectionComponent.
 */
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import { createI18n } from 'vue-i18n';
import BillingPricingFeatureSectionComponent from '../components/billing.pricingFeatureSection.component.vue';

const vuetify = createVuetify();
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      billing: {
        pricingFeatureSection: {
          everythingIn: 'Everything in {plan}, plus',
        },
      },
    },
  },
});

describe('BillingPricingFeatureSectionComponent', () => {
  it('renders title when provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: 'Core', items: [{ text: 'A' }, { text: 'B' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('Core');
  });

  it('does not render title when section.title is null', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: { title: null, items: [{ text: 'A' }] },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.find('.billing-pricing-feature-section__title').exists()).toBe(false);
  });

  it('renders inheritsFrom heading when section has inheritsFrom and parentPlanName is provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          inheritsFrom: 'starter',
          items: [{ text: 'Pro feature' }],
        },
        parentPlanName: 'Starter',
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('Everything in Starter, plus');
  });

  it('renders all items with text + icon when provided', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [
            { text: 'A', icon: 'fa-solid fa-check' },
            { text: 'B', icon: 'fa-solid fa-star' },
          ],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    expect(wrapper.text()).toContain('A');
    expect(wrapper.text()).toContain('B');
    expect(wrapper.findAll('.v-icon')).toHaveLength(2);
  });

  it('applies highlight class to items flagged highlight=true', () => {
    const wrapper = mount(BillingPricingFeatureSectionComponent, {
      props: {
        section: {
          title: null,
          items: [
            { text: 'Normal', highlight: false },
            { text: 'Highlighted', highlight: true },
          ],
        },
        parentPlanName: null,
      },
      global: { plugins: [vuetify, i18n] },
    });
    const highlighted = wrapper.findAll('.billing-pricing-feature-section__item--highlight');
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text()).toContain('Highlighted');
  });
});
